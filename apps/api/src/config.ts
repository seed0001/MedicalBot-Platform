import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)'),

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

export const config = parsed.data
export type Config = typeof config

export const isProduction = config.NODE_ENV === 'production'
export const googleConfigured = Boolean(
  config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI,
)
export const openRouterConfigured = Boolean(config.OPENROUTER_API_KEY)
