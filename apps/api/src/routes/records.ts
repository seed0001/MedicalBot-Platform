import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq, gte } from 'drizzle-orm'
import { adherenceRate, type AdherenceEvent } from '@medbot/shared'
import type { ConditionKey } from '@medbot/shared'
import { modulesFor } from '@medbot/conditions'
import { db, schema } from '../db/index.js'
import { requireUser } from './auth.js'

/**
 * Read endpoints backing the browsable UI. Everything is scoped to the session
 * user — there is no route here that can return another account's records.
 */
export async function recordRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser)

  app.get('/profile', async (request, reply) => {
    const userId = request.session.userId!

    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1)

    const team = await db
      .select()
      .from(schema.careTeam)
      .where(eq(schema.careTeam.userId, userId))
      .orderBy(asc(schema.careTeam.name))

    return reply.send({ profile: profile ?? null, careTeam: team })
  })

  app.get('/conditions', async (request, reply) => {
    const userId = request.session.userId!

    const rows = await db
      .select()
      .from(schema.conditions)
      .where(eq(schema.conditions.userId, userId))
      .orderBy(asc(schema.conditions.key))

    const modules = modulesFor(rows.map((r) => r.key as ConditionKey))

    return reply.send({
      conditions: rows.map((row) => {
        const mod = modules.find((m) => m.key === row.key)
        return {
          ...row,
          label: mod?.label ?? row.key,
          summary: mod?.summary ?? null,
          hasModule: Boolean(mod),
          trackedMetrics: mod?.metrics ?? [],
          thresholds: mod?.redFlags ?? [],
          trends: mod?.trends ?? [],
        }
      }),
    })
  })

  app.get('/medications', async (request, reply) => {
    const userId = request.session.userId!
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const meds = await db
      .select()
      .from(schema.medications)
      .where(eq(schema.medications.userId, userId))
      .orderBy(asc(schema.medications.name))

    const events = await db
      .select()
      .from(schema.adherenceEvents)
      .where(
        and(
          eq(schema.adherenceEvents.userId, userId),
          gte(schema.adherenceEvents.scheduledFor, since),
        ),
      )

    return reply.send({
      medications: meds.map((med) => {
        const mine = events.filter((e) => e.medicationId === med.id)
        return {
          ...med,
          adherence30d: Number(
            adherenceRate(mine as unknown as AdherenceEvent[]).toFixed(3),
          ),
          doseCount30d: mine.length,
          missed30d: mine.filter((e) => e.status === 'missed' || e.status === 'skipped').length,
        }
      }),
    })
  })

  app.get('/medications/:id/adherence', async (request, reply) => {
    const userId = request.session.userId!
    const { id } = request.params as { id: string }

    const rows = await db
      .select()
      .from(schema.adherenceEvents)
      .where(
        and(
          eq(schema.adherenceEvents.userId, userId),
          eq(schema.adherenceEvents.medicationId, id),
        ),
      )
      .orderBy(desc(schema.adherenceEvents.scheduledFor))
      .limit(200)

    return reply.send({ events: rows })
  })

  app.get('/appointments', async (request, reply) => {
    const userId = request.session.userId!

    const rows = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.userId, userId))
      .orderBy(desc(schema.appointments.startsAt))

    const team = await db
      .select({ id: schema.careTeam.id, name: schema.careTeam.name })
      .from(schema.careTeam)
      .where(eq(schema.careTeam.userId, userId))

    const now = new Date()
    const withProvider = rows.map((r) => ({
      ...r,
      providerName: team.find((t) => t.id === r.providerId)?.name ?? null,
    }))

    return reply.send({
      upcoming: withProvider.filter((r) => r.startsAt >= now).sort((a, b) => +a.startsAt - +b.startsAt),
      past: withProvider.filter((r) => r.startsAt < now),
    })
  })

  app.get('/questionnaires', async (request, reply) => {
    const userId = request.session.userId!

    const rows = await db
      .select()
      .from(schema.questionnaireResponses)
      .where(eq(schema.questionnaireResponses.userId, userId))
      .orderBy(desc(schema.questionnaireResponses.completedAt))

    const byKey = new Map<string, typeof rows>()
    for (const row of rows) {
      const list = byKey.get(row.questionnaireKey) ?? []
      list.push(row)
      byKey.set(row.questionnaireKey, list)
    }

    return reply.send({
      instruments: [...byKey.entries()].map(([key, responses]) => ({
        key,
        latest: responses[0] ?? null,
        history: responses
          .map((r) => ({ completedAt: r.completedAt, score: r.score, band: r.band }))
          .reverse(),
      })),
    })
  })
}
