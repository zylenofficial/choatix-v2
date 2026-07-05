const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_2GeMJv5cuPtB@ep-bold-recipe-ahrdc21p.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' });

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateKey(tier) {
  const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
  const SECRET = 'choatix-secret-key-2024';
  const hash = hashCode(`${tier}:${expiry}:${nonce}:${SECRET}`);
  const checksum = hash.toString(36).toUpperCase().padStart(4, '0').substring(0, 4);
  return `CHTX-${tier.substring(0, 4)}-${nonce}-${checksum}`;
}

async function main() {
  const count = parseInt(process.argv[2]) || 5;
  const tier = process.argv[3] || 'PREMIUM';
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push(generateKey(tier));
  }
  for (const key of keys) {
    await pool.query(
      'INSERT INTO keys_table (key, tier, expiry, redeemed, discord_id, created_at) VALUES ($1, $2, $3, false, null, $4) ON CONFLICT (key) DO NOTHING',
      [key, tier, null, new Date().toISOString()]
    );
    console.log(key);
  }
  await pool.end();
  console.log(`\n${count} ${tier} key(s) created.`);
}
main().catch(console.error);
