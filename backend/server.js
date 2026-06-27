const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'licenses.json');

app.use(cors());
app.use(express.json());

function loadLicenses() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {}
  return { keys: {}, discordUsers: {} };
}

function saveLicenses(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const SECRET = 'choatix-v2-secret-2024'
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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

// Generate a key (admin only)
app.post('/api/generate', (req, res) => {
  const { tier, count = 1, adminSecret } = req.body;
  if (adminSecret !== 'choatix-admin-2024') {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  if (!['PRO', 'PREMIUM'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Use PRO or PREMIUM' });
  }

  const data = loadLicenses();
  const keys = [];

  for (let i = 0; i < count; i++) {
    const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hash = hashCode(`${tier}:${expiry}:${nonce}:${SECRET}`);
    const checksum = hash.toString(36).toUpperCase().padStart(4, '0');
    const key = `CHTX-${tier.substring(0, 4)}-${nonce}-${checksum}`;

    data.keys[key] = {
      tier,
      expiry,
      createdAt: new Date().toISOString(),
      redeemed: false,
      discordId: null,
    };
    keys.push(key);
  }

  saveLicenses(data);
  res.json({ success: true, keys });
});

// Verify a key (in-app activation)
app.post('/api/license/verify-key', (req, res) => {
  const { key, discordId } = req.body;
  if (!key) return res.status(400).json({ valid: false, message: 'Key required' });

  const validated = validateKeyFormat(key);
  if (!validated) return res.json({ valid: false, message: 'Invalid key format' });

  const data = loadLicenses();
  const stored = data.keys[key.trim().toUpperCase()];

  if (!stored) return res.json({ valid: false, message: 'Key not found in database' });
  if (stored.redeemed && stored.discordId !== discordId) {
    return res.json({ valid: false, message: 'Key already redeemed by another user' });
  }

  // Mark as redeemed
  stored.redeemed = true;
  stored.discordId = discordId || 'in-app';
  data.keys[key.trim().toUpperCase()] = stored;

  // Store by discord ID
  if (discordId) {
    data.discordUsers[discordId] = {
      tier: stored.tier,
      key: key.trim().toUpperCase(),
      activatedAt: new Date().toISOString(),
    };
  }

  saveLicenses(data);
  res.json({ valid: true, tier: stored.tier });
});

// Lookup by Discord ID
app.get('/api/license/:discordId', (req, res) => {
  const data = loadLicenses();
  const user = data.discordUsers[req.params.discordId];

  if (!user) return res.status(404).json({ error: 'No license found' });
  res.json({ tier: user.tier, activatedAt: user.activatedAt });
});

// Redeem via Discord bot
app.post('/api/redeem', (req, res) => {
  const { key, discordId } = req.body;
  if (!key || !discordId) {
    return res.status(400).json({ success: false, message: 'Key and Discord ID required' });
  }

  const validated = validateKeyFormat(key);
  if (!validated) return res.json({ success: false, message: 'Invalid key format' });

  const data = loadLicenses();
  const stored = data.keys[key.trim().toUpperCase()];

  if (!stored) return res.json({ success: false, message: 'Key not found' });
  if (stored.redeemed) return res.json({ success: false, message: 'Key already redeemed' });

  stored.redeemed = true;
  stored.discordId = discordId;
  data.keys[key.trim().toUpperCase()] = stored;

  data.discordUsers[discordId] = {
    tier: stored.tier,
    key: key.trim().toUpperCase(),
    activatedAt: new Date().toISOString(),
  };

  saveLicenses(data);
  res.json({ success: true, tier: stored.tier, message: `Activated ${stored.tier} plan!` });
});

// List all keys (admin)
app.get('/api/admin/keys', (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== 'choatix-admin-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const data = loadLicenses();
  res.json({ keys: data.keys, users: data.discordUsers });
});

app.listen(PORT, () => {
  console.log(`Choatix License Server running on http://localhost:${PORT}`);
});
