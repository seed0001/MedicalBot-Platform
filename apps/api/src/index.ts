import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import session from '@fastify/session'
import Fastify from 'fastify'
import { config, isProduction, googleConfigured, openRouterConfigured } from './config.js'
import { closeDb, pingDb } from './db/index.js'
import { authRoutes } from './routes/auth.js'
import { legalRoutes } from './routes/legal.js'
import { metricRoutes } from './routes/metrics.js'

const app = Fastify({
  logger: {
    level: isProduction ? 'info' : 'debug',
    // PHI must never reach logs. Redact aggressively and revisit whenever a
    // route starts accepting a new sensitive field.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.note',
        'req.body.value',
        'req.body.answers',
        'req.body.content',
      ],
      remove: true,
    },
  },
  trustProxy: true,
})

await app.register(cors, {
  origin: config.APP_URL,
  credentials: true,
})

await app.register(cookie)
await app.register(session, {
  secret: config.SESSION_SECRET,
  cookieName: 'medbot_session',
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  },
  saveUninitialized: false,
})

app.get('/health', async () => {
  const dbOk = await pingDb()
  return {
    status: dbOk ? 'ok' : 'degraded',
    checks: {
      database: dbOk,
      google: googleConfigured,
      openrouter: openRouterConfigured,
    },
  }
})

await app.register(authRoutes)
await app.register(legalRoutes)
await app.register(metricRoutes, { prefix: '/api' })

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, 'Shutting down')
  await app.close()
  await closeDb()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error, 'Failed to start')
  process.exit(1)
}
