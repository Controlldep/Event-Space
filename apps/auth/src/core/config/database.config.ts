import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: parseInt(String(process.env.AUTH_DB_PORT), 10) || 5432,
  username: process.env.AUTH_DB_USER,
  password: process.env.AUTH_DB_PASSWORD,
  database: process.env.AUTH_DB_NAME,
  autoLoadEntities: true,
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
}));
