require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL or DATABASE_URL_POOLED environment variable is not defined.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Testing connection to Neon Serverless Postgres...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version(), current_database(), current_user, now() as server_time;');
    console.log('✓ Successfully connected to Neon Postgres:');
    console.log(res.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Failed to connect to Neon:', err.message);
  process.exit(1);
});

