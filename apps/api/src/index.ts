import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import session from '@fastify/session'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { config, isProduction, googleConfigured, openRouterConfigured } from './config.js'
import { closeDb, pingDb, runMigrations, usingPglite } from './db/index.js'
import { authRoutes } from './routes/auth.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { demoRoutes } from './routes/demo.js'
import { legalRoutes } from './routes/legal.js'
import { metricRoutes } from './routes/metrics.js'
import { recordRoutes } from './routes/records.js'

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
      driver: usingPglite ? 'pglite (embedded)' : 'postgres',
      demoMode: config.DEMO_MODE,
      google: googleConfigured,
      openrouter: openRouterConfigured,
    },
  }
})

await app.register(authRoutes)
await app.register(legalRoutes)
await app.register(demoRoutes)
await app.register(dashboardRoutes, { prefix: '/api' })
await app.register(recordRoutes, { prefix: '/api' })
await app.register(metricRoutes, { prefix: '/api' })

// Migrations run in-process for both drivers so deployment never depends on
// drizzle-kit being present at runtime (it is a devDependency and gets pruned).
try {
  await runMigrations()
  app.log.info({ driver: usingPglite ? 'pglite' : 'postgres' }, 'Database ready')
} catch (error) {
  app.log.error(error, 'Migrations failed')
  process.exit(1)
}

/**
 * Serve the exported frontend from this same process. Next exports `/dashboard`
 * as `dashboard.html`, so the not-found handler retries with that suffix before
 * giving up — that is what makes deep links and refreshes work.
 */
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../../web/out')

if (existsSync(webRoot)) {
  await app.register(fastifyStatic, { root: webRoot })

  app.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET') {
      return reply.code(404).send({ error: 'Not found' })
    }
    // API paths should 404 as JSON rather than falling through to the app shell.
    const path = request.url.split('?')[0] ?? '/'
    if (/^\/(api|auth|health|legal)\b/.test(path)) {
      return reply.code(404).send({ error: 'Not found' })
    }

    const candidate = `${path.replace(/\/$/, '')}.html`
    if (existsSync(join(webRoot, candidate))) {
      return reply.sendFile(candidate)
    }
    return reply.code(404).type('text/html').sendFile('404.html')
  })

  app.log.info({ webRoot }, 'Serving frontend')
} else {
  app.log.warn({ webRoot }, 'No frontend build found — API only')
}

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
