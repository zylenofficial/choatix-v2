require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);

// ── Config ──────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID || '1014494449809772544';

const PLAN_PRICES = {
  pro: { amount: '5.99', currency: 'EUR', label: 'Phantom Pro' },
  phantom: { amount: '9.99', currency: 'EUR', label: 'Phantom Premium' },
};

const DISCOUNT_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,19}$/;
const FREE_RATE_LIMIT = { maxPerIp: 3, maxPerDiscord: 1, windowMs: 24 * 60 * 60 * 1000 };

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
// Raw body for webhook signature verification (must be before JSON parser for webhook route)
app.post('/api/webhook/stripe', express.raw({ type: 'application/json', limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

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
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      stripe_customer_id TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_lic_stripe_session ON licenses(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_lic_stripe_pi ON licenses(stripe_payment_intent);
    CREATE INDEX IF NOT EXISTS idx_lic_status ON licenses(status);
    CREATE INDEX IF NOT EXISTS idx_lic_plan ON licenses(plan);

    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_lic_stripe_session ON licenses(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_lic_stripe_pi ON licenses(stripe_payment_intent);

    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rl_lookup ON rate_limits(identifier, action, created_at);

    CREATE TABLE IF NOT EXISTS discount_codes (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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

// ── Stripe Helpers ─────────────────────────────────────────────
const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeRequest(path, opts = {}) {
  if (!STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(opts.headers || {}),
    },
    body: opts.body,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Stripe API ${res.status}: ${err}`);
  }
  return res.json();
}

async function createStripeCheckout({ plan, discordId, email, amountCents, discountCode }) {
  const planInfo = PLAN_PRICES[plan];
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('locale', 'en');
  body.set('client_reference_id', generateIdempotencyKey());
  body.set('success_url', `${BASE_URL}/success/return.html?session_id={CHECKOUT_SESSION_ID}`);
  body.set('cancel_url', `${BASE_URL}/success/cancel.html`);
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', planInfo.currency.toLowerCase());
  body.set('line_items[0][price_data][unit_amount]', String(amountCents));
  body.set('line_items[0][price_data][product_data][name]', `${planInfo.label} License`);
  body.set('line_items[0][price_data][product_data][description]', `Phantom Tweaks ${planInfo.label} License Key`);
  body.set('metadata[plan]', plan);
  body.set('metadata[discordId]', discordId || '');
  if (discountCode) body.set('metadata[discountCode]', discountCode);
  if (email) body.set('customer_email', email);
  return stripeRequest('/checkout/sessions', { method: 'POST', body: body.toString() });
}

async function retrieveStripeSession(sessionId) {
  return stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

// Stripe-Signature header format: t=<timestamp>,v1=<hmac_sha256_hex>
function verifyStripeWebhook(rawBody, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('No STRIPE_WEBHOOK_SECRET configured — skipping signature verification');
    return null;
  }
  const parts = (signatureHeader || '').split(',').map(s => s.trim());
  const t = parts.find(p => p.startsWith('t='))?.slice(2);
  const sig = parts.find(p => p.startsWith('v1='))?.slice(3);
  if (!t || !sig) return null;
  const ts = parseInt(t, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return null;
  const payload = `${t}.${rawBody.toString()}`;
  const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payload).digest();
  const received = Buffer.from(sig, 'hex');
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  return JSON.parse(rawBody.toString());
}

// ── License Fulfillment (idempotent) ────────────────────────────
async function fulfillLicense({ plan, discordId, email, sessionId, paymentIntent, customerId }) {
  if (!pool) throw new Error('Database required for license fulfillment');

  // Check if already fulfilled
  const existing = await qOne(
    'SELECT * FROM licenses WHERE (stripe_session_id IS NOT NULL AND stripe_session_id=$1) OR (stripe_payment_intent IS NOT NULL AND stripe_payment_intent=$2)',
    [sessionId, paymentIntent]
  );
  if (existing) {
    return { license: existing, alreadyFulfilled: true };
  }

  const licenseKey = generateLicenseKey();
  const now = new Date().toISOString();
  const license = await qOne(
    `INSERT INTO licenses (license_key, plan, status, discord_id, customer_email, stripe_session_id, stripe_payment_intent, stripe_customer_id, created_at)
     VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8) RETURNING *`,
    [licenseKey, plan, discordId || null, email || null, sessionId || null, paymentIntent || null, customerId || null, now]
  );

  return { license, alreadyFulfilled: false };
}

// ── Admin Auth Middleware ────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!ADMIN_SECRET) return res.status(503).json({ error: 'Admin access is not configured' });
  const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  next();
}

// ────────────────────────────────────────────────────────────────
//  ROUTES
// ────────────────────────────────────────────────────────────────

// ── Health ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: pool ? 'postgresql' : 'memory',
    paymentProvider: 'stripe',
    stripeConfigured: Boolean(STRIPE_SECRET_KEY),
    stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
    uptime: process.uptime(),
  });
});

app.get('/api/discount/:code', async (req, res) => {
  if (!pool) return res.status(503).json({ valid: false, error: 'Discount validation is temporarily unavailable' });
  const code = req.params.code.trim().toUpperCase();
  if (!DISCOUNT_CODE_RE.test(code)) return res.json({ valid: false, error: 'Invalid discount code' });
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    if (!await checkRateLimit(`ip:${ip}`, 'discount_validation', 30, 60 * 1000)) {
      return res.status(429).json({ valid: false, error: 'Too many code checks. Please try again in a minute.' });
    }
    const discount = await qOne(
      'SELECT code, discount_percent FROM discount_codes WHERE code=$1 AND active=TRUE AND (expires_at IS NULL OR expires_at > NOW())',
      [code]
    );
    if (!discount) return res.json({ valid: false, error: 'Invalid or expired discount code' });
    res.json({ valid: true, code: discount.code, discount: discount.discount_percent });
  } catch (err) {
    console.error('[Discount validation error]', err);
    res.status(500).json({ valid: false, error: 'Could not validate discount code' });
  }
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

// ── STRIPE CHECKOUT ────────────────────────────────────────────
app.post('/api/license/checkout', async (req, res) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payments are not configured on the server' });
    }
    const { plan, discordId, email, discountCode } = req.body;
    if (!plan || !['pro', 'phantom'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Use pro or phantom' });
    }
    const cleanDiscordId = discordId && typeof discordId === 'string' ? discordId.trim() : null;

    const planInfo = PLAN_PRICES[plan];
    const submittedCode = typeof discountCode === 'string' ? discountCode.trim().toUpperCase() : '';
    if (discountCode != null && !submittedCode) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }

    let discount = null;
    if (submittedCode) {
      if (!DISCOUNT_CODE_RE.test(submittedCode)) return res.status(400).json({ error: 'Invalid discount code' });
      if (!pool) return res.status(503).json({ error: 'Discount validation is temporarily unavailable' });
      discount = await qOne(
        'SELECT code, discount_percent FROM discount_codes WHERE code=$1 AND active=TRUE AND (expires_at IS NULL OR expires_at > NOW())',
        [submittedCode]
      );
      if (!discount) return res.status(400).json({ error: 'Invalid or expired discount code' });
    }

    const baseCents = Math.round(Number(planInfo.amount) * 100);
    const finalCents = baseCents - (discount ? Math.round(baseCents * discount.discount_percent / 100) : 0);
    const session = await createStripeCheckout({
      plan,
      discordId: cleanDiscordId,
      email: email || null,
      amountCents: finalCents,
      discountCode: discount?.code || null,
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Failed to create Stripe Checkout Session' });
    }

    // Pre-create license record (pending) for idempotency
    if (pool) {
      await q(
        `INSERT INTO licenses (license_key, plan, status, discord_id, customer_email, stripe_session_id, created_at)
         VALUES ($1, $2, 'pending', $3, $4, $5, NOW()) ON CONFLICT (stripe_session_id) DO NOTHING`,
        [generateLicenseKey(), plan, cleanDiscordId, email || null, session.id]
      );
    }

    res.json({ sessionId: session.id, url: session.url, status: session.payment_status });
  } catch (err) {
    console.error('[Checkout error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Complete order (after redirect from Stripe) ─────────────────
app.post('/api/license/capture', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await retrieveStripeSession(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const plan = session.metadata?.plan;
    if (!plan || !['pro', 'phantom'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan in session' });
    }

    const paymentIntent = session.payment_intent || null;
    const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);

    const existing = await qOne('SELECT * FROM licenses WHERE stripe_session_id=$1', [sessionId]);
    if (existing && existing.status !== 'pending') {
      return res.json({ licenseKey: existing.license_key, plan: existing.plan, status: 'active', alreadyFulfilled: true });
    }

    const { license } = await fulfillLicense({
      plan,
      discordId: session.metadata?.discordId || null,
      email: session.customer_details?.email || null,
      sessionId,
      paymentIntent,
      customerId,
    });

    res.json({ licenseKey: license.license_key, plan: license.plan, status: 'active' });
  } catch (err) {
    console.error('[Capture error]', err);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

// ── STRIPE WEBHOOK ─────────────────────────────────────────────
app.post('/api/webhook/stripe', async (req, res) => {
  try {
    const rawBody = req.body;
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    const event = verifyStripeWebhook(rawBody, signature);
    if (!event) {
      console.warn('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    console.log(`[Webhook] Received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const plan = session.metadata?.plan;
      const sessionId = session.id;
      const paymentIntent = session.payment_intent || null;
      const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);

      if (!plan || !['pro', 'phantom'].includes(plan)) {
        console.warn(`[Webhook] Invalid plan: ${plan}`);
        return res.json({ received: true });
      }
      if (session.payment_status !== 'paid') {
        return res.json({ received: true });
      }

      // Idempotency: check if already fulfilled
      if (pool) {
        const existing = await qOne('SELECT * FROM licenses WHERE stripe_session_id=$1', [sessionId]);
        if (existing && existing.status !== 'pending') {
          console.log(`[Webhook] Already fulfilled: ${sessionId}`);
          return res.json({ received: true, duplicate: true });
        }
      }

      await fulfillLicense({
        plan,
        discordId: session.metadata?.discordId || null,
        email: session.customer_details?.email || null,
        sessionId,
        paymentIntent,
        customerId,
      });

      console.log(`[Webhook] Fulfilled: ${plan} license for session ${sessionId}`);
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const pi = charge.payment_intent;
      if (pi && pool) {
        await q("UPDATE licenses SET status='revoked' WHERE stripe_payment_intent=$1", [pi]);
        console.log(`[Webhook] Revoked license for refunded payment: ${pi}`);
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
      const user = await getUser(discordId);
      return res.json({
        plan: 'phantom',
        status: 'active',
        isOwner: true,
        profile: user?.username ? {
          id: discordId,
          username: user.username,
          displayName: user.global_name || user.username,
          avatarUrl: user.avatar || '',
        } : null,
      });
    }
    const license = await qOne(
      'SELECT license_key, plan, status, created_at, expires_at, activated_at, hwid FROM licenses WHERE discord_id=$1 AND status=\'active\' ORDER BY created_at DESC LIMIT 1',
      [discordId]
    );
    if (!license) return res.status(404).json({ error: 'No active license found' });
    const user = await getUser(discordId);
    res.json({
      ...license,
      profile: user?.username ? {
        id: discordId,
        username: user.username,
        displayName: user.global_name || user.username,
        avatarUrl: user.avatar || '',
      } : null,
    });
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
       stripe_session_id, stripe_payment_intent,
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

// ── ADMIN: DISCOUNT CODES ──────────────────────────────────────
app.get('/api/admin/discount-codes', requireAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database is not configured' });
  try {
    const discountCodes = await q(
      'SELECT code, discount_percent, active, expires_at, created_at FROM discount_codes ORDER BY created_at DESC'
    );
    res.json({ discountCodes });
  } catch (err) {
    console.error('[Admin discount list error]', err);
    res.status(500).json({ error: 'Could not load discount codes' });
  }
});

app.post('/api/admin/discount-codes', requireAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database is not configured' });
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const discountPercent = req.body.discountPercent;
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;

  if (!DISCOUNT_CODE_RE.test(code)) {
    return res.status(400).json({ error: 'Code must be 3-20 letters, numbers, hyphens, or underscores' });
  }
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    return res.status(400).json({ error: 'Discount must be a whole percentage from 1 to 90' });
  }
  if (req.body.expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) {
    return res.status(400).json({ error: 'Expiration must be a valid future date' });
  }

  try {
    const discount = await qOne(
      'INSERT INTO discount_codes (code, discount_percent, expires_at) VALUES ($1, $2, $3) RETURNING code, discount_percent, active, expires_at, created_at',
      [code, discountPercent, expiresAt ? expiresAt.toISOString() : null]
    );
    res.status(201).json({ discountCode: discount });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That discount code already exists' });
    console.error('[Admin discount create error]', err);
    res.status(500).json({ error: 'Could not create discount code' });
  }
});

app.post('/api/admin/discount-codes/:code/deactivate', requireAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database is not configured' });
  const code = req.params.code.trim().toUpperCase();
  if (!DISCOUNT_CODE_RE.test(code)) return res.status(400).json({ error: 'Invalid discount code' });
  try {
    const discount = await qOne(
      'UPDATE discount_codes SET active=FALSE WHERE code=$1 RETURNING code',
      [code]
    );
    if (!discount) return res.status(404).json({ error: 'Discount code not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin discount deactivate error]', err);
    res.status(500).json({ error: 'Could not deactivate discount code' });
  }
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
  if (!ADMIN_SECRET) return res.status(503).send('Admin access is not configured');
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
    const user = await getUser(discordId);
    return res.json({
      success: true,
      tier: 'PHANTOM',
      key: 'OWNER',
      activatedAt: null,
      profile: user?.username ? {
        id: discordId,
        username: user.username,
        displayName: user.global_name || user.username,
        avatarUrl: user.avatar || '',
      } : null,
    });
  }
  // Check new licenses table first
  const newLicense = await qOne(
    "SELECT * FROM licenses WHERE discord_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1",
    [discordId]
  );
  if (newLicense) {
    const user = await getUser(discordId);
    return res.json({
      success: true,
      tier: newLicense.plan.toUpperCase() === 'PHANTOM' ? 'PHANTOM' : newLicense.plan.toUpperCase(),
      key: newLicense.license_key,
      activatedAt: newLicense.activated_at,
      profile: user?.username ? {
        id: discordId,
        username: user.username,
        displayName: user.global_name || user.username,
        avatarUrl: user.avatar || '',
      } : null,
    });
  }
  // Fallback to legacy users_table
  const user = await getUser(discordId);
  if (!user) return res.status(404).json({ success: false, message: 'No license found' });
  res.json({
    success: true,
    tier: user.tier,
    key: user.key || null,
    activatedAt: user.activated_at || null,
    profile: user.username ? {
      id: discordId,
      username: user.username,
      displayName: user.global_name || user.username,
      avatarUrl: user.avatar || '',
    } : null,
  });
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
const ADMIN_SECRET_LEGACY = ADMIN_SECRET;
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
    if (STRIPE_SECRET_KEY) console.log('Stripe: configured');
    else console.log('Stripe: NOT CONFIGURED');
  });
}).catch((err) => {
  console.error('Failed to init DB, falling back to memory:', err.message);
  app.listen(PORT, () => {
    console.log(`Phantom License Server running on port ${PORT} (in-memory fallback)`);
  });
});
