import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  jwt: {
    secret: process.env.JWT_SECRET || 'asrtava-enterprise-super-secret-key-replace-in-production-min-32-chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  db: {
    connectionString: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'asrtava_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

