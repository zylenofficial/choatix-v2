require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DB_URL = process.env.DATABASE_URL;
const SECRET = process.env.KEY_SECRET || 'choatix-secret-key-2024';
let memKeys = {};
let memUsers = {};
let memReferrals = {};
let memPartners = {};

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
  if (tierPrefix.startsWith('PRO')) tier = 'PRO';
  else if (tierPrefix.startsWith('PREM')) tier = 'PREMIUM';
  else return null;
  return { tier, nonce: parts[2], checksum: parts[3] };
}

function generateReferralCode(discordId) {
  const hash = hashCode(discordId + Date.now()).toString(36).toUpperCase();
  return `CHOA-${hash.slice(0, 6)}`;
}

function generateKey(tier) {
  const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
  const hash = hashCode(`${tier}:${expiry}:${nonce}:${SECRET}`);
  const checksum = hash.toString(36).toUpperCase().padStart(4, '0');
  return `CHTX-${tier.substring(0, 4)}-${nonce}-${checksum}`;
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
    CREATE TABLE IF NOT EXISTS partners_table (
      discord_id TEXT PRIMARY KEY,
      name TEXT,
      tier TEXT DEFAULT 'PARTNER',
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS referrals_table (
      code TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      uses INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 10,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS referral_uses_table (
      id SERIAL PRIMARY KEY,
      code TEXT,
      referee_id TEXT,
      used_at TEXT
    );
    CREATE TABLE IF NOT EXISTS benchmarks (
      id SERIAL PRIMARY KEY,
      discord_id TEXT NOT NULL,
      nickname TEXT DEFAULT 'Anonymous',
      hardware_hash TEXT NOT NULL,
      cpu_model TEXT,
      gpu_model TEXT,
      ram_gb INTEGER,
      cpu_score FLOAT,
      ram_score FLOAT,
      disk_score FLOAT,
      gpu_score FLOAT,
      overall_score FLOAT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
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

async function isPartner(discordId) {
  if (app.locals.pool) {
    const r = await app.locals.pool.query('SELECT * FROM partners_table WHERE discord_id = $1', [discordId]);
    return r.rows[0] || null;
  }
  return memPartners[discordId] || null;
}

async function savePartner(discordId, data) {
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO partners_table (discord_id, name, tier, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (discord_id) DO UPDATE SET name=$2, tier=$3, created_at=$4',
      [discordId, data.name, data.tier, data.createdAt]
    );
  } else {
    memPartners[discordId] = data;
  }
}

async function deletePartner(discordId) {
  if (app.locals.pool) {
    await app.locals.pool.query('DELETE FROM partners_table WHERE discord_id = $1', [discordId]);
  } else {
    delete memPartners[discordId];
  }
}

async function getReferral(code) {
  if (app.locals.pool) {
    const r = await app.locals.pool.query('SELECT * FROM referrals_table WHERE code = $1', [code]);
    return r.rows[0] || null;
  }
  return memReferrals[code] || null;
}

async function saveReferral(code, data) {
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO referrals_table (code, referrer_id, uses, max_uses, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO UPDATE SET referrer_id=$2, uses=$3, max_uses=$4, created_at=$5',
      [code, data.referrerId, data.uses, data.maxUses, data.createdAt]
    );
  } else {
    memReferrals[code] = data;
  }
}

async function useReferral(code, refereeId) {
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO referral_uses_table (code, referee_id, used_at) VALUES ($1,$2,$3)',
      [code, refereeId, new Date().toISOString()]
    );
    await app.locals.pool.query(
      'UPDATE referrals_table SET uses = uses + 1 WHERE code = $1',
      [code]
    );
  } else {
    if (memReferrals[code]) memReferrals[code].uses++;
  }
}

async function getUserReferral(discordId) {
  if (app.locals.pool) {
    const r = await app.locals.pool.query('SELECT * FROM referrals_table WHERE referrer_id = $1', [discordId]);
    return r.rows[0] || null;
  }
  return Object.values(memReferrals).find(r => r.referrerId === discordId) || null;
}

// ─── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: DB_URL ? 'postgresql' : 'memory', uptime: process.uptime() });
});

// ─── Key Generation (admin + partner) ──────────────────────────
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
    const key = generateKey(tier);
    await saveKey(key, { tier, expiry: null, redeemed: false, discordId: null, createdAt: new Date().toISOString() });
    keys.push(key);
  }
  res.json({ success: true, keys });
});

// ─── Partner generate (no admin secret needed) ────────────────
app.post('/api/partner/generate', async (req, res) => {
  const { tier, count = 1, discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: 'Discord ID required' });

  const partner = await isPartner(discordId);
  if (!partner) return res.status(403).json({ error: 'Not a partner' });
  if (!['PRO', 'PREMIUM'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = generateKey(tier);
    await saveKey(key, { tier, expiry: null, redeemed: false, discordId: null, createdAt: new Date().toISOString() });
    keys.push(key);
  }
  res.json({ success: true, keys, partner: partner.name });
});

// ─── Partner management (admin) ───────────────────────────────
app.post('/api/partner/add', async (req, res) => {
  const { discordId, name, adminSecret } = req.body;
  if (adminSecret !== 'choatix-admin-2024') return res.status(403).json({ error: 'Unauthorized' });
  if (!discordId || !name) return res.status(400).json({ error: 'Discord ID and name required' });

  await savePartner(discordId, { name, tier: 'PARTNER', createdAt: new Date().toISOString() });
  res.json({ success: true, message: `${name} added as partner` });
});

app.post('/api/partner/remove', async (req, res) => {
  const { discordId, adminSecret } = req.body;
  if (adminSecret !== 'choatix-admin-2024') return res.status(403).json({ error: 'Unauthorized' });

  await deletePartner(discordId);
  res.json({ success: true });
});

app.get('/api/partner/:discordId', async (req, res) => {
  const partner = await isPartner(req.params.discordId);
  if (!partner) return res.status(404).json({ isPartner: false });
  res.json({ isPartner: true, name: partner.name, tier: partner.tier });
});

// ─── Referral system ──────────────────────────────────────────
app.post('/api/referral/create', async (req, res) => {
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: 'Discord ID required' });

  const existing = await getUserReferral(discordId);
  if (existing) return res.json({ success: true, code: existing.code, uses: existing.uses, maxUses: existing.max_uses });

  const code = generateReferralCode(discordId);
  await saveReferral(code, { referrerId: discordId, uses: 0, maxUses: 10, createdAt: new Date().toISOString() });
  res.json({ success: true, code, uses: 0, maxUses: 10 });
});

app.get('/api/referral/:code', async (req, res) => {
  const referral = await getReferral(req.params.code);
  if (!referral) return res.status(404).json({ error: 'Invalid referral code' });
  res.json({ code: referral.code, referrerId: referral.referrer_id, uses: referral.uses, maxUses: referral.max_uses });
});

app.post('/api/referral/redeem', async (req, res) => {
  const { code, refereeId } = req.body;
  if (!code || !refereeId) return res.status(400).json({ error: 'Code and referee ID required' });

  const referral = await getReferral(code.toUpperCase());
  if (!referral) return res.json({ success: false, message: 'Invalid referral code' });
  if (referral.referrer_id === refereeId) return res.json({ success: false, message: "You can't use your own referral code" });
  if (referral.uses >= referral.max_uses) return res.json({ success: false, message: 'Referral code has reached max uses' });

  await useReferral(code.toUpperCase(), refereeId);

  const key = generateKey('PRO');
  await saveKey(key, { tier: 'PRO', expiry: null, redeemed: true, discordId: refereeId, createdAt: new Date().toISOString() });
  await saveUser(refereeId, { tier: 'PRO', key, activatedAt: new Date().toISOString() });

  const referrerKey = generateKey('PREMIUM');
  await saveKey(referrerKey, { tier: 'PREMIUM', expiry: null, redeemed: true, discordId: referral.referrer_id, createdAt: new Date().toISOString() });
  await saveUser(referral.referrer_id, { tier: 'PREMIUM', key: referrerKey, activatedAt: new Date().toISOString() });

  res.json({
    success: true,
    refereeReward: 'PRO',
    referrerReward: 'PREMIUM',
    message: 'You got PRO! Referrer got PREMIUM upgrade!',
  });
});

app.get('/api/referral/user/:discordId', async (req, res) => {
  const referral = await getUserReferral(req.params.discordId);
  if (!referral) return res.status(404).json({ error: 'No referral code found' });
  res.json({ code: referral.code, uses: referral.uses, maxUses: referral.max_uses });
});

// ─── License lookup by Discord ID ────────────────────────────
app.get('/api/license/:discordId', async (req, res) => {
  const user = await getUser(req.params.discordId);
  if (!user) return res.status(404).json({ success: false, message: 'No license found for this Discord ID' });
  res.json({ success: true, tier: user.tier, key: user.key || null, activatedAt: user.activated_at || null });
});

// ─── Key / Redeem (legacy) ──────────────────────────────────
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

// ─── Admin ────────────────────────────────────────────────────
app.get('/api/admin/keys', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== 'choatix-admin-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (app.locals.pool) {
    const keys = await app.locals.pool.query('SELECT * FROM keys_table');
    const users = await app.locals.pool.query('SELECT * FROM users_table');
    const partners = await app.locals.pool.query('SELECT * FROM partners_table');
    const referrals = await app.locals.pool.query('SELECT * FROM referrals_table');
    res.json({ keys: keys.rows, users: users.rows, partners: partners.rows, referrals: referrals.rows });
  } else {
    res.json({ keys: memKeys, users: memUsers, partners: memPartners, referrals: memReferrals });
  }
});

// ── Leaderboard ──
app.post('/api/benchmark/submit', async (req, res) => {
  const { discord_id, nickname, hardware_hash, cpu_model, gpu_model, ram_gb, cpu_score, ram_score, disk_score, gpu_score, overall_score } = req.body;
  if (!overall_score) return res.status(400).json({ error: 'overall_score required' });
  const id = discord_id || 'anonymous';
  const hw = hardware_hash || 'unknown';
  if (app.locals.pool) {
    await app.locals.pool.query(
      'INSERT INTO benchmarks (discord_id, nickname, hardware_hash, cpu_model, gpu_model, ram_gb, cpu_score, ram_score, disk_score, gpu_score, overall_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [id, nickname || 'Anonymous', hw, cpu_model || '', gpu_model || '', ram_gb || 0, cpu_score || 0, ram_score || 0, disk_score || 0, gpu_score || 0, overall_score]
    );
  }
  res.json({ success: true });
});

app.get('/api/leaderboard', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  if (app.locals.pool) {
    const r = await app.locals.pool.query(
      'SELECT *, ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank FROM benchmarks ORDER BY overall_score DESC LIMIT $1', [limit]
    );
    return res.json({ entries: r.rows });
  }
  res.json({ entries: [] });
});

app.get('/api/leaderboard/hardware/:hash', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  if (app.locals.pool) {
    const r = await app.locals.pool.query(
      'SELECT *, ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank FROM benchmarks WHERE hardware_hash = $1 ORDER BY overall_score DESC LIMIT $2',
      [req.params.hash, limit]
    );
    return res.json({ entries: r.rows });
  }
  res.json({ entries: [] });
});

app.get('/api/leaderboard/user/:discordId', async (req, res) => {
  if (app.locals.pool) {
    const r = await app.locals.pool.query(
      'SELECT *, (SELECT COUNT(*) + 1 FROM benchmarks b2 WHERE b2.overall_score > b1.overall_score) as rank FROM benchmarks b1 WHERE discord_id = $1 ORDER BY overall_score DESC LIMIT 5',
      [req.params.discordId]
    );
    return res.json({ entries: r.rows });
  }
  res.json({ entries: [] });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Choatix License Server running on port ${PORT} (${DB_URL ? 'PostgreSQL' : 'in-memory'})`);
    require('./bot.js');
  });
}).catch((err) => {
  console.error('Failed to init DB, falling back to memory:', err.message);
  app.listen(PORT, () => {
    console.log(`Choatix License Server running on port ${PORT} (in-memory fallback)`);
    require('./bot.js');
  });
});
