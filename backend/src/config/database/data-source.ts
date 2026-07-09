import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  config({ path: resolve(__dirname, '../../..', '.local.env') });
  config({ path: resolve(__dirname, '../../..', '.env') });
}

function buildDataSourceOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL;
  const sslEnabled = process.env.DB_SSL === 'true';

  const connection = databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'surakshya',
      };

  return {
    type: 'postgres',
    ...connection,
    entities: [resolve(__dirname, '../../**/*.entity{.ts,.js}')],
    migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };
}

export default new DataSource(buildDataSourceOptions());
