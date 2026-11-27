const fs = require('fs');
const path = require('path');

function loadModule(name) {
  try {
    return require(name);
  } catch (e1) {
    try {
      return require(path.join(__dirname, '..', 'backend', 'node_modules', name));
    } catch (e2) {
      return require(path.join(process.cwd(), 'backend', 'node_modules', name));
    }
  }
}

try {
  loadModule('dotenv').config();
} catch (e) {
  // In production (e.g. Render), environment variables are already set in process.env
}

const { Client } = loadModule('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment.');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

async function migrate() {
  console.log('Connecting to Neon via direct compute URL for DDL migrations...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    // 1. Ensure migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION current_app_tenant() RETURNS UUID AS $$
      BEGIN
          RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
      EXCEPTION
          WHEN OTHERS THEN
              RETURN NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    // 2. Fetch applied migrations
    const res = await client.query('SELECT filename FROM schema_migrations;');
    const appliedFiles = new Set(res.rows.map(r => r.filename));

    // 3. Read migration files in order
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files in ${migrationsDir}`);

    let count = 0;
    for (const file of files) {
      if (appliedFiles.has(file)) {
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        console.log(`✓ Applied ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`✕ Migration failed on ${file}:`, err.message);
        throw err;
      }
    }

    console.log(`\n============================================================`);
    console.log(`Migration Complete: ${count} applied, ${files.length - count} previously applied.`);
    console.log(`============================================================`);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration aborted:', err);
    process.exit(1);
  });
}

module.exports = { migrate };

