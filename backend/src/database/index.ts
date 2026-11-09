import knex, { Knex } from 'knex';
import { config } from '../config';

export const db: Knex = knex({
  client: 'pg',
  connection: config.db.connectionString
    ? {
        connectionString: config.db.connectionString,
        ssl: config.db.ssl,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl,
      },
  pool: {
    min: config.db.poolMin,
    max: config.db.poolMax,
    afterCreate: (conn: any, done: any) => {
      conn.query('SET timezone="UTC";', (err: any) => {
        done(err, conn);
      });
    },
  },
});

/**
 * Runs a query within a tenant-isolated transaction context by setting PostgreSQL RLS session variables
 */
export async function withTenantContext<T>(
  tenantId: string | null,
  isSuperAdmin: boolean,
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (trx) => {
    if (isSuperAdmin) {
      await trx.raw(`SET LOCAL app.is_super_admin = 'true';`);
    } else if (tenantId) {
      await trx.raw(`SET LOCAL app.is_super_admin = 'false';`);
      await trx.raw(`SET LOCAL app.current_tenant_id = ?;`, [tenantId]);
    }
    return callback(trx);
  });
}

