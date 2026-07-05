const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_2GeMJv5cuPtB@ep-bold-recipe-ahrdc21p.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' });

async function insertKey(key, tier) {
  await pool.query(
    'INSERT INTO keys_table (key, tier, expiry, redeemed, discord_id, created_at) VALUES ($1, $2, $3, false, null, $4) ON CONFLICT (key) DO NOTHING',
    [key, tier, null, new Date().toISOString()]
  );
  console.log('Inserted:', key, '-', tier);
}

async function main() {
  const keys = [
    ['CHTX-PREM-HBTX-F60B', 'PREMIUM'],
    ['CHTX-PREM-08CR-HR66', 'PREMIUM'],
    ['CHTX-PREM-FCIO-SKOQ', 'PREMIUM'],
    ['CHTX-PREM-OIPS-NACY', 'PREMIUM'],
    ['CHTX-PREM-2PVX-H2CW', 'PREMIUM'],
    ['CHTX-PREM-XLKY-XJGW', 'PREMIUM'],
    ['CHTX-PRO-N9K7-BS84', 'PRO'],
  ];
  for (const [key, tier] of keys) {
    await insertKey(key, tier);
  }
  await pool.end();
  console.log('\nAll keys inserted.');
}
main().catch(console.error);
