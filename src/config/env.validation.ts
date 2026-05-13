import z from 'zod';

const envSchema = z.object({
  // APP
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // DATABASE
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  DATABASE_URL: z.url(),

  // AUTH
  JWT_SECRET_KEY: z.string().min(32, {
    error: 'JWT_SECRET_KEY must be at least 32 characters for security',
  }),
  JWT_EXPIRATION_TIME: z.string().regex(/^\d+[smhd]$/, {
    error: 'JWT_EXPIRATION_TIME must match format like "15m", "1h", "7d"',
  }),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).default(7),
  MAX_ACTIVE_SESSIONS_PER_USER: z.coerce
    .number()
    .int()
    .positive()
    .min(1)
    .default(5),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((e) => ` - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return parsed.data;
}
