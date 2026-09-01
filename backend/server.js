require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Config ──────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'CHANGE_ME_ADMIN_SECRET';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'live';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID || '1014494449809772544';

const PAYPAL_BASE = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const PLAN_PRICES = {
  pro: { amount: '5.99', currency: 'EUR', label: 'Phantom Pro' },
  phantom: { amount: '9.99', currency: 'EUR', label: 'Phantom Premium' },
};

const FREE_RATE_LIMIT = { maxPerIp: 3, maxPerDiscord: 1, windowMs: 24 * 60 * 60 * 1000 };

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Raw body for webhook signature verification (must be before JSON parser for webhook route)
app.post('/api/webhook/paypal', express.raw({ type: 'application/json', limit: '10mb' }));

// Serve static success/admin pages
app.use('/success', express.static(__dirname + '/pages'));
app.use('/admin', express.static(__dirname + '/pages'));

// ── License Key Generation ──────────────────────────────────────
function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[crypto.randomInt(chars.length)];
    }
    segments.push(seg);
  }
  return `PHNT-${segments[0]}-${segments[1]}-${segments[2]}`;
}

function generateIdempotencyKey() {
  return crypto.randomBytes(16).toString('hex');
}

// ── Database ────────────────────────────────────────────────────
let pool = null;

async function initDB() {
  if (!DB_URL) {
    console.log('No DATABASE_URL — running in memory mode');
    return;
  }
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: DB_URL, max: 10, idleTimeoutMillis: 30000 });
  app.locals.pool = pool;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL CHECK (plan IN ('free','pro','phantom')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','revoked','expired')),
      customer_email TEXT,
      discord_id TEXT,
      paypal_order_id TEXT,
      paypal_transaction_id TEXT UNIQUE,
      paypal_payer_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      hwid TEXT,
      activated_at TIMESTAMPTZ,
      last_validation TIMESTAMPTZ,
      ip_address TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_lic_key ON licenses(license_key);
    CREATE INDEX IF NOT EXISTS idx_lic_discord ON licenses(discord_id);
    CREATE INDEX IF NOT EXISTS idx_lic_paypal_tx ON licenses(paypal_transaction_id);
    CREATE INDEX IF NOT EXISTS idx_lic_paypal_order ON licenses(paypal_order_id);
    CREATE INDEX IF NOT EXISTS idx_lic_status ON licenses(status);
    CREATE INDEX IF NOT EXISTS idx_lic_plan ON licenses(plan);

    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rl_lookup ON rate_limits(identifier, action, created_at);

    -- Keep legacy tables
    CREATE TABLE IF NOT EXISTS keys_table (
      key TEXT PRIMARY KEY, tier TEXT NOT NULL, expiry TEXT,
      redeemed BOOLEAN DEFAULT false, discord_id TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS users_table (
      discord_id TEXT PRIMARY KEY, tier TEXT NOT NULL, key TEXT,
      activated_at TEXT, username TEXT, avatar TEXT, global_name TEXT
    );
    CREATE TABLE IF NOT EXISTS partners_table (
      discord_id TEXT PRIMARY KEY, name TEXT, tier TEXT DEFAULT 'PARTNER', created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS referrals_table (
      code TEXT PRIMARY KEY, referrer_id TEXT NOT NULL,
      uses INTEGER DEFAULT 0, max_uses INTEGER DEFAULT 10, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS referral_uses_table (
      id SERIAL PRIMARY KEY, code TEXT, referee_id TEXT, used_at TEXT
    );
  `);
  console.log('PostgreSQL connected');
}

async function q(text, params) {
  if (pool) {
    const r = await pool.query(text, params);
    return r.rows;
  }
  return [];
}

async function qOne(text, params) {
  const rows = await q(text, params);
  return rows[0] || null;
}

// ── Rate Limiting ───────────────────────────────────────────────
async function checkRateLimit(identifier, action, maxRequests, windowMs) {
  if (!pool) return true;
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const r = await pool.query(
    'SELECT COUNT(*)::int as cnt FROM rate_limits WHERE identifier=$1 AND action=$2 AND created_at > $3',
    [identifier, action, cutoff]
  );
  if (r.rows[0].cnt >= maxRequests) return false;
  await pool.query('INSERT INTO rate_limits (identifier, action) VALUES ($1,$2)', [identifier, action]);
  return true;
}

// ── PayPal Helpers ──────────────────────────────────────────────
let paypalToken = null;
let paypalTokenExpiry = 0;

async function getPayPalToken() {
  if (paypalToken && Date.now() < paypalTokenExpiry) return paypalToken;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error('PayPal not configured');
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  paypalToken = data.access_token;
  paypalTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return paypalToken;
}

async function verifyPayPalWebhook(headers, rawBody) {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('No PAYPAL_WEBHOOK_ID configured — skipping signature verification');
    return true;
  }
  try {
    const token = await getPayPalToken();
    const body = JSON.parse(rawBody.toString());
    const verificationPayload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      actual_sig: headers['paypal-transmission-sig'],
      sig_algo: 'SHA256withRSA',
      webhook_id: PAYPAL_WEBHOOK_ID,
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_event: body,
    };
    const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload),
    });
    const result = await res.json();
    return result.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Webhook verification error:', err.message);
    return false;
  }
}

async function capturePaypalOrder(orderId) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Capture failed: ${res.status} ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function getOrderDetails(orderId) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Order fetch failed: ${res.status}`);
  return res.json();
}

// ── License Fulfillment (idempotent) ────────────────────────────
async function fulfillLicense(orderId, payerId, plan) {
  if (!pool) throw new Error('Database required for license fulfillment');

  // Check if already fulfilled
  const existing = await qOne('SELECT * FROM licenses WHERE paypal_order_id = $1', [orderId]);
  if (existing) {
    return { license: existing, alreadyFulfilled: true };
  }

  const licenseKey = generateLicenseKey();
  const now = new Date().toISOString();
  const license = await qOne(
    `INSERT INTO licenses (license_key, plan, status, paypal_order_id, paypal_payer_id, created_at)
     VALUES ($1, $2, 'active', $3, $4, $5) RETURNING *`,
    [licenseKey, plan, orderId, payerId, now]
  );

  return { license, alreadyFulfilled: false };
}

// ── Admin Auth Middleware ────────────────────────────────────────
function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  next();
}

// ────────────────────────────────────────────────────────────────
//  ROUTES
// ────────────────────────────────────────────────────────────────

// ── Health ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: pool ? 'postgresql' : 'memory', uptime: process.uptime() });
});

// ── Get PayPal Client ID (public) ───────────────────────────────
app.get('/api/paypal/client-id', (req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID || null });
});

// ── FREE LICENSE ────────────────────────────────────────────────
app.post('/api/license/free', async (req, res) => {
  try {
    const { discordId, email } = req.body;
    if (!discordId || typeof discordId !== 'string' || discordId.trim().length < 17) {
      return res.status(400).json({ error: 'Valid Discord ID required' });
    }
    const cleanDiscordId = discordId.trim();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Owner always gets free
    if (cleanDiscordId === OWNER_DISCORD_ID) {
      const key = generateLicenseKey();
      const license = await qOne(
        `INSERT INTO licenses (license_key, plan, status, discord_id, created_at, activated_at)
         VALUES ($1, 'free', 'active', $2, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING *`,
        [key, cleanDiscordId]
      );
      if (!license) {
        const existing = await qOne('SELECT * FROM licenses WHERE discord_id=$1 AND plan=\'free\' LIMIT 1', [cleanDiscordId]);
        return res.json({ licenseKey: existing.license_key, plan: 'free', status: 'active', alreadyExists: true });
      }
      return res.json({ licenseKey: license.license_key, plan: 'free', status: 'active', alreadyExists: false });
    }

    // Rate limit: max 3 free per IP per day
    if (!await checkRateLimit(`ip:${ip}`, 'free', FREE_RATE_LIMIT.maxPerIp, FREE_RATE_LIMIT.windowMs)) {
      return res.status(429).json({ error: 'Rate limit: too many free license requests from your network' });
    }

    // Rate limit: max 1 free per Discord ID ever
    if (!await checkRateLimit(`discord:${cleanDiscordId}`, 'free', FREE_RATE_LIMIT.maxPerDiscord, 365 * 24 * 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'You already have a free license' });
    }

    // Check if already has a free license
    const existingFree = await qOne(
      'SELECT * FROM licenses WHERE discord_id=$1 AND plan=\'free\' AND status!=\'revoked\' LIMIT 1',
      [cleanDiscordId]
    );
    if (existingFree) {
      return res.json({ licenseKey: existingFree.license_key, plan: 'free', status: 'active', alreadyExists: true });
    }

    const key = generateLicenseKey();
    const license = await qOne(
      `INSERT INTO licenses (license_key, plan, status, discord_id, customer_email, created_at, activated_at, ip_address)
       VALUES ($1, 'free', 'active', $2, $3, NOW(), NOW(), $4) RETURNING *`,
      [key, cleanDiscordId, email || null, ip]
    );

    res.json({ licenseKey: license.license_key, plan: 'free', status: 'active', alreadyExists: false });
  } catch (err) {
    console.error('[Free license error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PAYPAL CHECKOUT ────────────────────────────────────────────
app.post('/api/license/checkout', async (req, res) => {
  try {
    const { plan, discordId, email } = req.body;
    if (!plan || !['pro', 'phantom'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Use pro or phantom' });
    }
    const cleanDiscordId = discordId && typeof discordId === 'string' ? discordId.trim() : null;

    const planInfo = PLAN_PRICES[plan];
    const token = await getPayPalToken();

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `PHNT-${plan}-${Date.now()}`,
        description: `${planInfo.label} License`,
        custom_id: JSON.stringify({ plan, discordId: cleanDiscordId, email: email || null }),
        amount: {
          currency_code: planInfo.currency,
          value: planInfo.amount,
          breakdown: {
            item_total: { currency_code: planInfo.currency, value: planInfo.amount },
          },
        },
        items: [{
          name: planInfo.label,
          description: `Phantom Tweaks ${planInfo.label} License Key`,
          unit_amount: { currency_code: planInfo.currency, value: planInfo.amount },
          quantity: '1',
          category: 'DIGITAL_GOODS',
        }],
      }],
      application_context: {
        brand_name: 'Phantom Tweaks',
        locale: 'en-US',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${BASE_URL}/success/return.html`,
        cancel_url: `${BASE_URL}/success/cancel.html`,
      },
    };

    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(orderBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[PayPal checkout error]', err);
      return res.status(500).json({ error: 'Failed to create PayPal order' });
    }

    const order = await response.json();
    const approveUrl = order.links?.find(l => l.rel === 'approve')?.href;

    // Pre-create license record (pending) for idempotency
    if (pool) {
      await q(
        `INSERT INTO licenses (license_key, plan, status, discord_id, customer_email, paypal_order_id, created_at)
         VALUES ($1, $2, 'pending', $3, $4, $5, NOW()) ON CONFLICT (paypal_order_id) DO NOTHING`,
        [generateLicenseKey(), plan, cleanDiscordId, email || null, order.id]
      );
    }

    res.json({ orderId: order.id, approvalUrl, status: order.status });
  } catch (err) {
    console.error('[Checkout error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Capture order (after redirect from PayPal) ──────────────────
app.post('/api/license/capture', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    // Check if already fulfilled
    const existing = await qOne('SELECT * FROM licenses WHERE paypal_order_id=$1 AND status!=\'pending\'', [orderId]);
    if (existing) {
      return res.json({ licenseKey: existing.license_key, plan: existing.plan, status: 'active', alreadyFulfilled: true });
    }

    // Capture payment
    const captureData = await capturePaypalOrder(orderId);
    if (captureData.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed', status: captureData.status });
    }

    // Extract plan from custom_id
    const purchaseUnit = captureData.purchase_units?.[0];
    const customData = JSON.parse(purchaseUnit?.custom_id || '{}');
    const plan = customData.plan;
    if (!plan || !['pro', 'phantom'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan in order' });
    }

    const capture = purchaseUnit?.payments?.captures?.[0];
    const transactionId = capture?.id;
    const payerId = captureData.payer?.payer_id;

    // Update or create license
    let license;
    if (existing) {
      license = await qOne(
        `UPDATE licenses SET status='active', paypal_transaction_id=$1, paypal_payer_id=$2,
         activated_at=NOW(), expires_at=NULL WHERE paypal_order_id=$3 RETURNING *`,
        [transactionId, payerId, orderId]
      );
    } else {
      const key = generateLicenseKey();
      license = await qOne(
        `INSERT INTO licenses (license_key, plan, status, discord_id, customer_email, paypal_order_id, paypal_transaction_id, paypal_payer_id, created_at, activated_at)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
        [key, plan, customData.discordId, customData.email, orderId, transactionId, payerId]
      );
    }

    res.json({ licenseKey: license.license_key, plan: license.plan, status: 'active' });
  } catch (err) {
    console.error('[Capture error]', err);
    res.status(500).json({ error: 'Failed to capture order' });
  }
});

// ── PAYPAL WEBHOOK ─────────────────────────────────────────────
app.post('/api/webhook/paypal', async (req, res) => {
  try {
    const rawBody = req.body;
    const headers = req.headers;

    // Verify webhook signature
    const valid = await verifyPayPalWebhook(headers, rawBody);
    if (!valid) {
      console.warn('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString());
    console.log(`[Webhook] Received: ${event.event_type}`);

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const orderId = capture.supplementary_data?.related_ids?.order_id;
      const transactionId = capture.id;
      const payerId = capture.payer?.payer_id || event.resource?.payer_id;
      const amount = capture.amount;

      if (!orderId) {
        console.warn('[Webhook] No order ID in capture event');
        return res.json({ received: true });
      }

      // Idempotency: check if already fulfilled
      if (pool) {
        const existing = await qOne(
          'SELECT * FROM licenses WHERE paypal_order_id=$1 OR paypal_transaction_id=$2',
          [orderId, transactionId]
        );
        if (existing && existing.status !== 'pending') {
          console.log(`[Webhook] Already fulfilled: ${orderId}`);
          return res.json({ received: true, duplicate: true });
        }
      }

      // Get order details to determine plan
      let plan = null;
      let discordId = null;
      let email = null;
      try {
        const orderDetails = await getOrderDetails(orderId);
        const purchaseUnit = orderDetails.purchase_units?.[0];
        if (purchaseUnit?.custom_id) {
          const customData = JSON.parse(purchaseUnit.custom_id);
          plan = customData.plan;
          discordId = customData.discordId;
          email = customData.email;
        }
      } catch (err) {
        console.error('[Webhook] Failed to fetch order details:', err.message);
      }

      if (!plan || !['pro', 'phantom'].includes(plan)) {
        console.warn(`[Webhook] Invalid plan: ${plan}`);
        return res.json({ received: true });
      }

      // Fulfill license (idempotent)
      const { license, alreadyFulfilled } = await fulfillLicense(orderId, payerId, plan);

      // Update with additional info if we have it
      if (pool && !alreadyFulfilled) {
        await q(
          `UPDATE licenses SET paypal_transaction_id=$1, discord_id=COALESCE(discord_id, $2),
           customer_email=COALESCE(customer_email, $3), activated_at=NOW()
           WHERE paypal_order_id=$4`,
          [transactionId, discordId, email, orderId]
        );
      }

      console.log(`[Webhook] Fulfilled: ${plan} license for order ${orderId}`);
    }

    // Also handle other events
    if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      const capture = event.resource;
      const orderId = capture.supplementary_data?.related_ids?.order_id;
      if (orderId && pool) {
        await q("UPDATE licenses SET status='revoked' WHERE paypal_order_id=$1", [orderId]);
        console.log(`[Webhook] Revoked license for refunded order: ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook error]', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// ── LICENSE ACTIVATE (with HWID) ──────────────────────────────
app.post('/api/license/activate', async (req, res) => {
  try {
    const { licenseKey, hwid, discordId } = req.body;
    if (!licenseKey || !hwid) {
      return res.status(400).json({ valid: false, error: 'License key and HWID required' });
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const license = await qOne('SELECT * FROM licenses WHERE license_key = $1', [cleanKey]);
    if (!license) {
      return res.json({ valid: false, error: 'invalid_license' });
    }

    if (license.status === 'revoked') {
      return res.json({ valid: false, error: 'revoked' });
    }
    if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < new Date())) {
      if (license.status !== 'expired') {
        await q("UPDATE licenses SET status='expired' WHERE license_key=$1", [cleanKey]);
      }
      return res.json({ valid: false, error: 'expired' });
    }
    if (license.status === 'inactive') {
      return res.json({ valid: false, error: 'inactive' });
    }

    // First activation: bind HWID
    if (!license.hwid) {
      await q(
        'UPDATE licenses SET hwid=$1, activated_at=COALESCE(activated_at, NOW()), discord_id=COALESCE(discord_id, $2) WHERE license_key=$3',
        [hwid, discordId || null, cleanKey]
      );
      return res.json({
        valid: true,
        plan: license.plan,
        status: 'active',
        expires_at: license.expires_at,
        hwid_bound: true,
        activated_at: new Date().toISOString(),
      });
    }

    // Subsequent: check HWID
    if (license.hwid !== hwid) {
      return res.json({ valid: false, error: 'hwid_mismatch', message: 'This license is bound to another device' });
    }

    // Update last validation
    await q('UPDATE licenses SET last_validation=NOW() WHERE license_key=$1', [cleanKey]);

    return res.json({
      valid: true,
      plan: license.plan,
      status: 'active',
      expires_at: license.expires_at,
      hwid_bound: true,
    });
  } catch (err) {
    console.error('[Activate error]', err);
    res.status(500).json({ valid: false, error: 'internal_error' });
  }
});

// ── LICENSE VALIDATE ───────────────────────────────────────────
app.post('/api/license/validate', async (req, res) => {
  try {
    const { licenseKey, hwid } = req.body;
    if (!licenseKey) return res.status(400).json({ valid: false, error: 'License key required' });

    const cleanKey = licenseKey.trim().toUpperCase();
    const license = await qOne('SELECT * FROM licenses WHERE license_key = $1', [cleanKey]);
    if (!license) return res.json({ valid: false, error: 'invalid_license' });

    if (license.status === 'revoked') return res.json({ valid: false, error: 'revoked' });
    if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < new Date())) {
      return res.json({ valid: false, error: 'expired' });
    }
    if (license.status !== 'active') return res.json({ valid: false, error: license.status });

    // HWID check
    if (license.hwid && hwid && license.hwid !== hwid) {
      return res.json({ valid: false, error: 'hwid_mismatch' });
    }

    // Check expiry
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await q("UPDATE licenses SET status='expired' WHERE license_key=$1", [cleanKey]);
      return res.json({ valid: false, error: 'expired' });
    }

    await q('UPDATE licenses SET last_validation=NOW() WHERE license_key=$1', [cleanKey]);

    return res.json({
      valid: true,
      plan: license.plan,
      status: license.status,
      expires_at: license.expires_at,
      hwid_bound: !!license.hwid,
    });
  } catch (err) {
    console.error('[Validate error]', err);
    res.status(500).json({ valid: false, error: 'internal_error' });
  }
});

// ── LICENSE DEACTIVATE ─────────────────────────────────────────
app.post('/api/license/deactivate', async (req, res) => {
  try {
    const { licenseKey, hwid } = req.body;
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });

    const cleanKey = licenseKey.trim().toUpperCase();
    const license = await qOne('SELECT * FROM licenses WHERE license_key = $1', [cleanKey]);
    if (!license) return res.status(404).json({ error: 'License not found' });

    if (hwid && license.hwid && license.hwid !== hwid) {
      return res.status(403).json({ error: 'HWID mismatch' });
    }

    await q("UPDATE licenses SET status='inactive', hwid=NULL WHERE license_key=$1", [cleanKey]);
    res.json({ success: true, message: 'License deactivated' });
  } catch (err) {
    console.error('[Deactivate error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── LICENSE STATUS ─────────────────────────────────────────────
app.get('/api/license/status/:key', async (req, res) => {
  try {
    const cleanKey = req.params.key.trim().toUpperCase();
    const license = await qOne('SELECT license_key, plan, status, created_at, expires_at, activated_at, last_validation FROM licenses WHERE license_key=$1', [cleanKey]);
    if (!license) return res.status(404).json({ error: 'License not found' });
    res.json(license);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── LICENSE LOOKUP BY DISCORD ID ───────────────────────────────
app.get('/api/license/discord/:discordId', async (req, res) => {
  try {
    const discordId = req.params.discordId.trim();
    if (discordId === OWNER_DISCORD_ID) {
      return res.json({ plan: 'phantom', status: 'active', isOwner: true });
    }
    const license = await qOne(
      'SELECT license_key, plan, status, created_at, expires_at, activated_at, hwid FROM licenses WHERE discord_id=$1 AND status=\'active\' ORDER BY created_at DESC LIMIT 1',
      [discordId]
    );
    if (!license) return res.status(404).json({ error: 'No active license found' });
    res.json(license);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── RESET HWID ─────────────────────────────────────────────────
app.post('/api/license/reset-hwid', async (req, res) => {
  try {
    const { licenseKey, adminSecret } = req.body;
    if (adminSecret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });

    const cleanKey = licenseKey.trim().toUpperCase();
    await q('UPDATE licenses SET hwid=NULL WHERE license_key=$1', [cleanKey]);
    res.json({ success: true, message: 'HWID reset' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── ADMIN: LIST ALL LICENSES ───────────────────────────────────
app.get('/api/admin/licenses', requireAdmin, async (req, res) => {
  try {
    const { plan, status, search, page = 1, limit = 50 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (plan) { where.push(`plan=$${idx++}`); params.push(plan); }
    if (status) { where.push(`status=$${idx++}`); params.push(status); }
    if (search) { where.push(`(license_key ILIKE $${idx} OR discord_id ILIKE $${idx} OR customer_email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const rows = await q(
      `SELECT id, license_key, plan, status, customer_email, discord_id, paypal_order_id, paypal_transaction_id,
       created_at, expires_at, hwid IS NOT NULL as hwid_bound, activated_at, last_validation
       FROM licenses ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );
    const countRow = await qOne(`SELECT COUNT(*)::int as total FROM licenses ${whereClause}`, params.slice(0, -2));

    res.json({ licenses: rows, total: countRow?.total || 0, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('[Admin licenses error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── ADMIN: REVOKE / REACTIVATE / RESET HWID ───────────────────
app.post('/api/admin/license/revoke', requireAdmin, async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });
    await q("UPDATE licenses SET status='revoked' WHERE license_key=$1", [licenseKey.trim().toUpperCase()]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/admin/license/reactivate', requireAdmin, async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });
    await q("UPDATE licenses SET status='active' WHERE license_key=$1", [licenseKey.trim().toUpperCase()]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/admin/license/reset-hwid', requireAdmin, async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });
    await q('UPDATE licenses SET hwid=NULL WHERE license_key=$1', [licenseKey.trim().toUpperCase()]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ── ADMIN: STATS ───────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const total = await qOne('SELECT COUNT(*)::int as cnt FROM licenses');
    const byPlan = await q('SELECT plan, COUNT(*)::int as cnt FROM licenses GROUP BY plan');
    const byStatus = await q('SELECT status, COUNT(*)::int as cnt FROM licenses GROUP BY status');
    res.json({ total: total?.cnt || 0, byPlan, byStatus });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ── ADMIN DASHBOARD HTML ───────────────────────────────────────
app.get('/admin/dashboard', (req, res) => {
  const secret = req.query.key;
  if (secret !== ADMIN_SECRET) return res.status(403).send('Unauthorized');
  res.sendFile(__dirname + '/pages/admin.html');
});

// ── CUSTOMER LICENSE LOOKUP ────────────────────────────────────
app.get('/api/customer/license', async (req, res) => {
  try {
    const { key, discord_id } = req.query;
    if (!key && !discord_id) return res.status(400).json({ error: 'Provide key or discord_id' });

    let license;
    if (key) {
      license = await qOne(
        'SELECT license_key, plan, status, created_at, expires_at, activated_at, hwid IS NOT NULL as hwid_bound FROM licenses WHERE license_key=$1',
        [key.trim().toUpperCase()]
      );
    } else {
      license = await qOne(
        'SELECT license_key, plan, status, created_at, expires_at, activated_at, hwid IS NOT NULL as hwid_bound FROM licenses WHERE discord_id=$1 ORDER BY created_at DESC LIMIT 1',
        [discord_id.trim()]
      );
    }
    if (!license) return res.status(404).json({ error: 'License not found' });
    res.json(license);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ────────────────────────────────────────────────────────────────
//  LEGACY ENDPOINTS (backward compatibility)
// ────────────────────────────────────────────────────────────────

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

function generateKey(tier) {
  const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
  const hash = hashCode(`${tier}:${Date.now()}:${nonce}`);
  const checksum = hash.toString(36).toUpperCase().padStart(4, '0');
  if (tier === 'PHANTOM') return `PHNTM-PHNT-${nonce}-${checksum}`;
  return `PHNTM-${tier.substring(0, 4)}-${nonce}-${checksum}`;
}

async function getKey(key) {
  if (pool) { const r = await pool.query('SELECT * FROM keys_table WHERE key = $1', [key]); return r.rows[0] || null; }
  return null;
}

async function saveKey(key, data) {
  if (pool) {
    await pool.query(
      'INSERT INTO keys_table (key, tier, expiry, redeemed, discord_id, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO UPDATE SET tier=$2, expiry=$3, redeemed=$4, discord_id=$5, created_at=$6',
      [key, data.tier, data.expiry, data.redeemed, data.discordId, data.createdAt]
    );
  }
}

async function getUser(discordId) {
  if (pool) { const r = await pool.query('SELECT * FROM users_table WHERE discord_id = $1', [discordId]); return r.rows[0] || null; }
  return null;
}

async function saveUser(discordId, data) {
  if (pool) {
    await pool.query(
      'INSERT INTO users_table (discord_id, tier, key, activated_at, username, avatar, global_name) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (discord_id) DO UPDATE SET tier=$2, key=$3, activated_at=$4, username=COALESCE($5, users_table.username), avatar=COALESCE($6, users_table.avatar), global_name=COALESCE($7, users_table.global_name)',
      [discordId, data.tier, data.key, data.activatedAt, data.username || null, data.avatar || null, data.globalName || null]
    );
  }
}

async function deleteUser(discordId) {
  if (pool) await pool.query('DELETE FROM users_table WHERE discord_id = $1', [discordId]);
}

async function isPartner(discordId) {
  if (pool) { const r = await pool.query('SELECT * FROM partners_table WHERE discord_id = $1', [discordId]); return r.rows[0] || null; }
  return null;
}

async function savePartner(discordId, data) {
  if (pool) {
    await pool.query(
      'INSERT INTO partners_table (discord_id, name, tier, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (discord_id) DO UPDATE SET name=$2, tier=$3, created_at=$4',
      [discordId, data.name, data.tier, data.createdAt]
    );
  }
}

async function deletePartner(discordId) {
  if (pool) await pool.query('DELETE FROM partners_table WHERE discord_id = $1', [discordId]);
}

async function getReferral(code) {
  if (pool) { const r = await pool.query('SELECT * FROM referrals_table WHERE code = $1', [code]); return r.rows[0] || null; }
  return null;
}

async function saveReferral(code, data) {
  if (pool) {
    await pool.query(
      'INSERT INTO referrals_table (code, referrer_id, uses, max_uses, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO UPDATE SET referrer_id=$2, uses=$3, max_uses=$4, created_at=$5',
      [code, data.referrerId, data.uses, data.maxUses, data.createdAt]
    );
  }
}

async function useReferral(code, refereeId) {
  if (pool) {
    await pool.query('INSERT INTO referral_uses_table (code, referee_id, used_at) VALUES ($1,$2,$3)', [code, refereeId, new Date().toISOString()]);
    await pool.query('UPDATE referrals_table SET uses = uses + 1 WHERE code = $1', [code]);
  }
}

async function getUserReferral(discordId) {
  if (pool) { const r = await pool.query('SELECT * FROM referrals_table WHERE referrer_id = $1', [discordId]); return r.rows[0] || null; }
  return null;
}

// Legacy: License lookup by Discord ID
app.get('/api/license/:discordId', async (req, res) => {
  const discordId = req.params.discordId.trim();
  if (discordId === OWNER_DISCORD_ID) {
    return res.json({ success: true, tier: 'PHANTOM', key: 'OWNER', activatedAt: null });
  }
  // Check new licenses table first
  const newLicense = await qOne(
    "SELECT * FROM licenses WHERE discord_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1",
    [discordId]
  );
  if (newLicense) {
    return res.json({ success: true, tier: newLicense.plan.toUpperCase() === 'PHANTOM' ? 'PHANTOM' : newLicense.plan.toUpperCase(), key: newLicense.license_key, activatedAt: newLicense.activated_at });
  }
  // Fallback to legacy users_table
  const user = await getUser(discordId);
  if (!user) return res.status(404).json({ success: false, message: 'No license found' });
  res.json({ success: true, tier: user.tier, key: user.key || null, activatedAt: user.activated_at || null });
});

// Legacy: Key verification
app.post('/api/license/verify-key', async (req, res) => {
  const { key, discordId } = req.body;
  if (!key) return res.status(400).json({ valid: false, message: 'Key required' });
  const stored = await getKey(key.trim().toUpperCase());
  if (!stored) return res.json({ valid: false, message: 'Key not found in database' });
  if (stored.redeemed && stored.discord_id !== discordId) {
    return res.json({ valid: false, message: 'Key already redeemed by another user' });
  }
  await saveKey(key.trim().toUpperCase(), { tier: stored.tier, expiry: stored.expiry, redeemed: true, discordId: discordId || 'in-app', createdAt: stored.created_at });
  if (discordId) await saveUser(discordId, { tier: stored.tier, key: key.trim().toUpperCase(), activatedAt: new Date().toISOString() });
  res.json({ valid: true, tier: stored.tier });
});

// Legacy: Key generation (admin)
const ADMIN_SECRET_LEGACY = process.env.ADMIN_SECRET || 'izboMyG93P10s5T2yp8VofbN5FWeBut+';
app.post('/api/generate', async (req, res) => {
  const { tier, count = 1, adminSecret } = req.body;
  if (adminSecret !== ADMIN_SECRET_LEGACY) return res.status(403).json({ error: 'Invalid admin secret' });
  if (!['PRO', 'PHANTOM'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = generateKey(tier);
    await saveKey(key, { tier, expiry: null, redeemed: false, discordId: null, createdAt: new Date().toISOString() });
    keys.push(key);
  }
  res.json({ success: true, keys });
});

// Legacy: Partner
app.post('/api/partner/generate', async (req, res) => {
  const { tier, count = 1, discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: 'Discord ID required' });
  const partner = await isPartner(discordId);
  if (!partner) return res.status(403).json({ error: 'Not a partner' });
  if (!['PRO', 'PHANTOM'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = generateKey(tier);
    await saveKey(key, { tier, expiry: null, redeemed: false, discordId: null, createdAt: new Date().toISOString() });
    keys.push(key);
  }
  res.json({ success: true, keys, partner: partner.name });
});

app.post('/api/partner/add', async (req, res) => {
  const { discordId, name, adminSecret } = req.body;
  if (adminSecret !== ADMIN_SECRET_LEGACY) return res.status(403).json({ error: 'Unauthorized' });
  if (!discordId || !name) return res.status(400).json({ error: 'Discord ID and name required' });
  await savePartner(discordId, { name, tier: 'PARTNER', createdAt: new Date().toISOString() });
  res.json({ success: true });
});

app.post('/api/partner/remove', async (req, res) => {
  const { discordId, adminSecret } = req.body;
  if (adminSecret !== ADMIN_SECRET_LEGACY) return res.status(403).json({ error: 'Unauthorized' });
  await deletePartner(discordId);
  res.json({ success: true });
});

app.get('/api/partner/:discordId', async (req, res) => {
  const partner = await isPartner(req.params.discordId);
  if (!partner) return res.status(404).json({ isPartner: false });
  res.json({ isPartner: true, name: partner.name, tier: partner.tier });
});

// Legacy: Referrals
app.post('/api/referral/create', async (req, res) => {
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: 'Discord ID required' });
  const existing = await getUserReferral(discordId);
  if (existing) return res.json({ success: true, code: existing.code, uses: existing.uses, maxUses: existing.max_uses });
  const code = `CHOA-${hashCode(discordId + Date.now()).toString(36).toUpperCase().slice(0, 6)}`;
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
  const referrerKey = generateKey('PHANTOM');
  await saveKey(referrerKey, { tier: 'PHANTOM', expiry: null, redeemed: true, discordId: referral.referrer_id, createdAt: new Date().toISOString() });
  await saveUser(referral.referrer_id, { tier: 'PHANTOM', key: referrerKey, activatedAt: new Date().toISOString() });
  res.json({ success: true, refereeReward: 'PRO', referrerReward: 'PHANTOM' });
});

app.get('/api/referral/user/:discordId', async (req, res) => {
  const referral = await getUserReferral(req.params.discordId);
  if (!referral) return res.status(404).json({ error: 'No referral code found' });
  res.json({ code: referral.code, uses: referral.uses, maxUses: referral.max_uses });
});

// Legacy: Redeem
app.post('/api/redeem', async (req, res) => {
  const { key, discordId, username, avatar, globalName } = req.body;
  if (!key || !discordId) return res.status(400).json({ success: false, message: 'Key and Discord ID required' });
  const stored = await getKey(key.trim().toUpperCase());
  if (!stored) return res.json({ success: false, message: 'Key not found' });
  if (stored.redeemed) return res.json({ success: false, message: 'Key already redeemed' });
  await saveKey(key.trim().toUpperCase(), { tier: stored.tier, expiry: stored.expiry, redeemed: true, discordId, createdAt: stored.created_at });
  await saveUser(discordId, { tier: stored.tier, key: key.trim().toUpperCase(), activatedAt: new Date().toISOString(), username, avatar, globalName });
  res.json({ success: true, tier: stored.tier });
});

app.post('/api/license/unlink', async (req, res) => {
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ success: false, message: 'Discord ID required' });
  const user = await getUser(discordId);
  if (!user) return res.status(404).json({ success: false, message: 'No license found' });
  if (user.key) {
    const keyData = await getKey(user.key);
    if (keyData) await saveKey(user.key, { ...keyData, redeemed: false, discord_id: null });
  }
  await deleteUser(discordId);
  res.json({ success: true });
});

// Legacy: Admin
app.get('/api/admin/keys', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== ADMIN_SECRET_LEGACY) return res.status(403).json({ error: 'Unauthorized' });
  if (pool) {
    const keys = await pool.query('SELECT * FROM keys_table');
    const users = await pool.query('SELECT * FROM users_table');
    const partners = await pool.query('SELECT * FROM partners_table');
    const referrals = await pool.query('SELECT * FROM referrals_table');
    res.json({ keys: keys.rows, users: users.rows, partners: partners.rows, referrals: referrals.rows });
  } else {
    res.json({ keys: {}, users: {}, partners: {}, referrals: {} });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== ADMIN_SECRET_LEGACY) return res.status(403).json({ error: 'Unauthorized' });
  try {
    let users = [];
    if (pool) {
      const result = await pool.query('SELECT * FROM users_table ORDER BY activated_at DESC');
      users = result.rows;
    }
    res.json({ users: users.map(u => ({
      discord_id: u.discord_id, tier: u.tier, key: u.key, activated_at: u.activated_at,
      username: u.username, avatar: u.avatar, global_name: u.global_name,
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Start ───────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Phantom License Server running on port ${PORT} (${pool ? 'PostgreSQL' : 'in-memory'})`);
    if (PAYPAL_CLIENT_ID) console.log(`PayPal mode: ${PAYPAL_MODE}`);
    else console.log('PayPal: NOT CONFIGURED');
  });
}).catch((err) => {
  console.error('Failed to init DB, falling back to memory:', err.message);
  app.listen(PORT, () => {
    console.log(`Phantom License Server running on port ${PORT} (in-memory fallback)`);
  });
});
