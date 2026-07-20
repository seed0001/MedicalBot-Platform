import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { config } from '../config.js'
import { db, schema } from '../db/index.js'
import { DEMO_EMAIL, resetDemoData, seedDemoData } from '../seed/index.js'

/**
 * Exploration routes. Registered only when DEMO_MODE=true, so on a normal
 * deployment these paths do not exist at all rather than existing and refusing.
 *
 * The reset here removes demo accounts only. Turning DEMO_MODE off and running
 * a reset is the switch from exploring to real use.
 */
export async function demoRoutes(app: FastifyInstance): Promise<void> {
  if (!config.DEMO_MODE) return

  app.log.warn('DEMO_MODE is on — /auth/demo and /api/demo/* are exposed without auth.')

  app.post('/auth/demo', async (request, reply) => {
    let [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, DEMO_EMAIL))
      .limit(1)

    // First sign-in on a fresh database seeds itself rather than making the
    // user go find a CLI command.
    if (!user) {
      const seeded = await seedDemoData()
      user = { id: seeded.userId }
    }

    request.session.userId = user.id
    return reply.send({ ok: true, userId: user.id })
  })

  app.post('/api/demo/reseed', async (_request, reply) => {
    const { userId, metrics } = await seedDemoData()
    return reply.send({ ok: true, userId, metrics })
  })

  app.post('/api/demo/reset', async (request, reply) => {
    const { usersDeleted } = await resetDemoData()
    await request.session.destroy()
    return reply.send({ ok: true, usersDeleted })
  })
}
