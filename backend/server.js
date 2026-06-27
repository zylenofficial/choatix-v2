const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DB_URL = process.env.DATABASE_URL;
let memKeys = {};
let memUsers = {};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function validateKeyFormat(key) {
  const cleaned = key.trim().toUpperCase();
  const parts = cleaned.split('-');
  if (parts.length !== 4 || parts[0] !== 'CHTX') return null;
  const tierPrefix = parts[1];
  let tier;
  if (tierPrefix === 'PROC' || tierPrefix === 'PRO-') tier = 'PRO';
  else if (tierPrefix === 'PREM') tier = 'PREMIUM';
  else return null;
  return { tier, nonce: parts[2], checksum: parts[3] };
}

async function initDB() {
  if (!DB_URL) return;
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DB_URL });
  app.locals.pool = pool;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keys_table (
      key TEXT PRIMARY KEY,
      tier TEXT NOT NULL,
      expiry TEXT,
      redeemed BOOLEAN DEFAULT false,
      discord_id TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS users_table (
      discord_id TEXT PRIMARY KEY,
      tier TEXT NOT NULL,
      key TEXT,
      activated_at TEXT
    );
  `);
  console.log('PostgreSQL connected');
}

async function getKey(key) {
  if (app.locals.pool) {
    const r = await app.locals.pool.query('SELECT * FROM keys_table WHERE key = $1', [key]);
    return r.rows[0] || null;
  }
  return memKeys[key] || null;
}

async function saveKey(key, data) {
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO keys_table (key, tier, expiry, redeemed, discord_id, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO UPDATE SET tier=$2, expiry=$3, redeemed=$4, discord_id=$5, created_at=$6',
      [key, data.tier, data.expiry, data.redeemed, data.discordId, data.createdAt]
    );
  } else {
    memKeys[key] = data;
  }
}

async function getUser(discordId) {
  if (app.locals.pool) {
    const r = await app.locals.pool.query('SELECT * FROM users_table WHERE discord_id = $1', [discordId]);
    return r.rows[0] || null;
  }
  return memUsers[discordId] || null;
}

async function saveUser(discordId, data) {
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO users_table (discord_id, tier, key, activated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (discord_id) DO UPDATE SET tier=$2, key=$3, activated_at=$4',
      [discordId, data.tier, data.key, data.activatedAt]
    );
  } else {
    memUsers[discordId] = data;
  }
}

async function deleteUser(discordId) {
  if (app.locals.pool) {
    await app.locals.pool.query('DELETE FROM users_table WHERE discord_id = $1', [discordId]);
  } else {
    delete memUsers[discordId];
  }
}

const SECRET = 'choatix-v2-secret-2024';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: DB_URL ? 'postgresql' : 'memory', uptime: process.uptime() });
});

app.post('/api/generate', async (req, res) => {
  const { tier, count = 1, adminSecret } = req.body;
  if (adminSecret !== 'choatix-admin-2024') {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  if (!['PRO', 'PREMIUM'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Use PRO or PREMIUM' });
  }

  const keys = [];
  for (let i = 0; i < count; i++) {
    const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hash = hashCode(`${tier}:${expiry}:${nonce}:${SECRET}`);
    const checksum = hash.toString(36).toUpperCase().padStart(4, '0');
    const key = `CHTX-${tier.substring(0, 4)}-${nonce}-${checksum}`;
    await saveKey(key, { tier, expiry, redeemed: false, discordId: null, createdAt: new Date().toISOString() });
    keys.push(key);
  }
  res.json({ success: true, keys });
});

app.post('/api/license/verify-key', async (req, res) => {
  const { key, discordId } = req.body;
  if (!key) return res.status(400).json({ valid: false, message: 'Key required' });

  const validated = validateKeyFormat(key);
  if (!validated) return res.json({ valid: false, message: 'Invalid key format' });

  const stored = await getKey(key.trim().toUpperCase());
  if (!stored) return res.json({ valid: false, message: 'Key not found in database' });
  if (stored.redeemed && stored.discord_id !== discordId) {
    return res.json({ valid: false, message: 'Key already redeemed by another user' });
  }

  await saveKey(key.trim().toUpperCase(), {
    tier: stored.tier,
    expiry: stored.expiry,
    redeemed: true,
    discordId: discordId || 'in-app',
    createdAt: stored.created_at,
  });

  if (discordId) {
    await saveUser(discordId, {
      tier: stored.tier,
      key: key.trim().toUpperCase(),
      activatedAt: new Date().toISOString(),
    });
  }

  res.json({ valid: true, tier: stored.tier });
});

app.get('/api/license/:discordId', async (req, res) => {
  const user = await getUser(req.params.discordId);
  if (!user) return res.status(404).json({ error: 'No license found' });
  res.json({ tier: user.tier, activatedAt: user.activated_at });
});

app.post('/api/redeem', async (req, res) => {
  const { key, discordId } = req.body;
  if (!key || !discordId) {
    return res.status(400).json({ success: false, message: 'Key and Discord ID required' });
  }

  const validated = validateKeyFormat(key);
  if (!validated) return res.json({ success: false, message: 'Invalid key format' });

  const stored = await getKey(key.trim().toUpperCase());
  if (!stored) return res.json({ success: false, message: 'Key not found' });
  if (stored.redeemed) return res.json({ success: false, message: 'Key already redeemed' });

  await saveKey(key.trim().toUpperCase(), {
    tier: stored.tier,
    expiry: stored.expiry,
    redeemed: true,
    discordId,
    createdAt: stored.created_at,
  });

  await saveUser(discordId, {
    tier: stored.tier,
    key: key.trim().toUpperCase(),
    activatedAt: new Date().toISOString(),
  });

  res.json({ success: true, tier: stored.tier, message: `Activated ${stored.tier} plan!` });
});

app.get('/api/admin/keys', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== 'choatix-admin-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (app.locals.pool) {
    const keys = await app.locals.pool.query('SELECT * FROM keys_table');
    const users = await app.locals.pool.query('SELECT * FROM users_table');
    res.json({ keys: keys.rows, users: users.rows });
  } else {
    res.json({ keys: memKeys, users: memUsers });
  }
});

app.post('/api/license/unlink', async (req, res) => {
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ success: false, message: 'Discord ID required' });

  const user = await getUser(discordId);
  if (!user) return res.status(404).json({ success: false, message: 'No license found for this Discord ID' });

  if (user.key) {
    const keyData = await getKey(user.key);
    if (keyData) {
      await saveKey(user.key, { ...keyData, redeemed: false, discord_id: null });
    }
  }

  await deleteUser(discordId);
  res.json({ success: true, message: 'License unlinked successfully' });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Choatix License Server running on port ${PORT} (${DB_URL ? 'PostgreSQL' : 'in-memory'})`);
  });
}).catch((err) => {
  console.error('Failed to init DB, falling back to memory:', err.message);
  app.listen(PORT, () => {
    console.log(`Choatix License Server running on port ${PORT} (in-memory fallback)`);
  });
});
