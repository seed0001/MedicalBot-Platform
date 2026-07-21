import type { FastifyInstance } from 'fastify'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db/index.js'
import { requireAdmin, requireUser, roleOf } from './auth.js'

/**
 * Administrator section. Visible to admins and the owner; role changes are
 * owner-only. Authorization is enforced here on the server — the UI hiding a
 * link is a convenience, never the control.
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser)
  app.addHook('preHandler', requireAdmin)

  app.get('/admin/overview', async (_request, reply) => {
    const [[users], [onboarded], [demo], [admins], [metrics], [meds], [assessments]] =
      await Promise.all([
        db.select({ n: count() }).from(schema.users),
        db.select({ n: count() }).from(schema.users).where(eq(schema.users.role, 'user')),
        db.select({ n: count() }).from(schema.users).where(eq(schema.users.isDemo, true)),
        db.select({ n: count() }).from(schema.users).where(eq(schema.users.role, 'admin')),
        db.select({ n: count() }).from(schema.metrics),
        db.select({ n: count() }).from(schema.medications),
        db.select({ n: count() }).from(schema.questionnaireResponses),
      ])

    const userRows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        isDemo: schema.users.isDemo,
        createdAt: schema.users.createdAt,
        onboardedAt: schema.users.onboardedAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(500)

    return reply.send({
      stats: {
        users: users?.n ?? 0,
        plainUsers: onboarded?.n ?? 0,
        admins: admins?.n ?? 0,
        demoAccounts: demo?.n ?? 0,
        metrics: metrics?.n ?? 0,
        medications: meds?.n ?? 0,
        assessments: assessments?.n ?? 0,
      },
      users: userRows,
    })
  })

  const roleBody = z.object({ role: z.enum(['user', 'admin']) })

  // Owner-only: promote a user to admin or demote back to user.
  app.post('/admin/users/:id/role', async (request, reply) => {
    const callerRole = await roleOf(request.session.userId)
    if (callerRole !== 'owner') {
      return reply.code(403).send({ error: 'Only the owner can change roles' })
    }

    const parsed = roleBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid role', issues: parsed.error.issues })
    }

    const { id } = request.params as { id: string }
    if (id === request.session.userId) {
      return reply.code(400).send({ error: 'You cannot change your own role' })
    }

    const [target] = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)
    if (!target) return reply.code(404).send({ error: 'User not found' })
    if (target.role === 'owner') {
      return reply.code(400).send({ error: 'The owner role cannot be changed here' })
    }

    await db
      .update(schema.users)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(schema.users.id, id))

    return reply.send({ ok: true, role: parsed.data.role })
  })
}
