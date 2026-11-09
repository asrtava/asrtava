require('dotenv').config();
const { Client } = require('pg');

async function check() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  console.log('Tables found:', res.rows.map(r => r.table_name));
  await c.end();
}

check().catch(console.error);

