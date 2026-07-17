import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PAYMENTS_DB_PORT: z.coerce.number().default(5432),
  PAYMENTS_DB_USER: z.string(),
  PAYMENTS_DB_HOST: z.string().default('localhost'),
  PAYMENTS_DB_PASSWORD: z.string().min(5),
  PAYMENTS_DB_NAME: z.string(),

  JWT_SECRET: z.string().min(3, 'Секрет JWT должен быть не менее 3 символов'),
  MAX_AGE_ACCESS_TOKEN: z.coerce.string(),
  MAX_AGE_ACCESS_TOKEN_FOR_REDIS: z.coerce.number(),

  JWT_SECRET_REFRESH: z.string().min(5, 'Секрет REFRESH должен быть не менее 5 символов'),
  MAX_AGE_REFRESH_TOKEN: z.coerce.string(),
  MAX_AGE_REFRESH_TOKEN_FOR_REDIS: z.coerce.number(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number(),

  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),

  MY_EMAIL: z.string().email('Неверный формат почты'),
  MY_PASS: z.string(),

  OUTBOX_CRON_EXPRESSION: z.string().default('*/5 * * * * *'),
});

export type EnvConfig = z.infer<typeof envSchema>;
