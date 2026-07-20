import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // `pglite://<dir>` runs Postgres embedded locally; anything else is a normal
  // connection string. Defaults to embedded so a fresh clone runs with no setup.
  DATABASE_URL: z.string().min(1).default('pglite://./.data/medbot'),
  REDIS_URL: z.string().optional(),

  /**
   * Enables seeded exploration: the demo sign-in route and the reset endpoint.
   * Independent of NODE_ENV so a deployed instance can be explored, but it is
   * off unless set and the server logs loudly when it is on.
   */
  DEMO_MODE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // Validated below rather than here: both are mandatory in production, but get
  // throwaway defaults outside it so a fresh clone boots with no .env at all.
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars').optional(),
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),

  // Model routing by task class — see SPEC.md §4.1. Swappable without a deploy.
  MODEL_CHAT: z.string().default('anthropic/claude-sonnet-4.5'),
  MODEL_EXTRACT: z.string().default('anthropic/claude-haiku-4.5'),
  MODEL_ANALYZE: z.string().default('anthropic/claude-sonnet-4.5'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  // Fail loudly at boot rather than at the first request that needs the value.
  console.error(`Invalid environment configuration:\n${issues}`)
  process.exit(1)
}

const env = parsed.data
const inProduction = env.NODE_ENV === 'production'

// Deterministic throwaway values. Fine for local exploration — sessions do not
// survive a restart and no real Google token is ever encrypted with them.
const DEV_SESSION_SECRET = 'dev-only-session-secret-not-for-production-use'
const DEV_ENCRYPTION_KEY = '0'.repeat(64)

if (inProduction && (!env.SESSION_SECRET || !env.ENCRYPTION_KEY)) {
  console.error(
    'SESSION_SECRET and ENCRYPTION_KEY are required in production.\n' +
      'Generate each with: openssl rand -hex 32',
  )
  process.exit(1)
}

if (!env.SESSION_SECRET || !env.ENCRYPTION_KEY) {
  console.warn('[config] Using throwaway dev secrets. Set real ones before deploying.')
}

export const config = {
  ...env,
  SESSION_SECRET: env.SESSION_SECRET ?? DEV_SESSION_SECRET,
  ENCRYPTION_KEY: env.ENCRYPTION_KEY ?? DEV_ENCRYPTION_KEY,
}
export type Config = typeof config

export const isProduction = inProduction
export const googleConfigured = Boolean(
  config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI,
)
export const openRouterConfigured = Boolean(config.OPENROUTER_API_KEY)
