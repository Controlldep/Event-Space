import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.EVENTS_DB_HOST || 'localhost',
  port: parseInt(String(process.env.EVENTS_DB_PORT), 10) || 5432,
  username: process.env.EVENTS_DB_USER,
  password: process.env.EVENTS_DB_PASSWORD,
  database: process.env.EVENTS_DB_NAME,
  autoLoadEntities: true,
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
}));
