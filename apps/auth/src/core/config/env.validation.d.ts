import { z } from 'zod';
export declare const envSchema: z.ZodObject<
  {
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        development: 'development';
        production: 'production';
        test: 'test';
      }>
    >;
    DB_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_USERNAME: z.ZodString;
    DB_HOST: z.ZodDefault<z.ZodString>;
    DB_PASSWORD: z.ZodString;
    DB_DATABASE: z.ZodString;
    JWT_SECRET: z.ZodString;
    MAX_AGE_ACCESS_TOKEN: z.ZodCoercedString<unknown>;
    MAX_AGE_ACCESS_TOKEN_FOR_REDIS: z.ZodCoercedNumber<unknown>;
    JWT_SECRET_REFRESH: z.ZodString;
    MAX_AGE_REFRESH_TOKEN: z.ZodCoercedString<unknown>;
    MAX_AGE_REFRESH_TOKEN_FOR_REDIS: z.ZodCoercedNumber<unknown>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    REDIS_PASSWORD: z.ZodOptional<z.ZodString>;
    REDIS_DB: z.ZodCoercedNumber<unknown>;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    MY_EMAIL: z.ZodString;
    MY_PASS: z.ZodString;
    OUTBOX_CRON_EXPRESSION: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type EnvConfig = z.infer<typeof envSchema>;
