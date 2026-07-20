import type { FastifyInstance } from 'fastify'
import { and, desc, eq, gte } from 'drizzle-orm'
import { z } from 'zod'
import { METRIC_TYPES, normalizeMetricInput } from '@medbot/shared'
import { modulesFor, mergedRedFlags } from '@medbot/conditions'
import type { ConditionKey } from '@medbot/shared'
import { db, schema } from '../db/index.js'
import { requireUser } from './auth.js'

const createBody = z.object({
  type: z.enum(METRIC_TYPES),
  value: z.number(),
  valueSecondary: z.number().nullish(),
  unit: z.string().optional(),
  recordedAt: z.coerce.date().optional(),
  context: z.string().max(120).nullish(),
  note: z.string().max(2000).nullish(),
  source: z.enum(['manual', 'chat_extraction', 'device_import', 'lab_upload', 'questionnaire'])
    .default('manual'),
})

const listQuery = z.object({
  type: z.enum(METRIC_TYPES).optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

export async function metricRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser)

  app.post('/metrics', async (request, reply) => {
    const parsed = createBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid metric', issues: parsed.error.issues })
    }

    const userId = request.session.userId!
    const entry = normalizeMetricInput({
      ...parsed.data,
      valueSecondary: parsed.data.valueSecondary ?? null,
      context: parsed.data.context ?? null,
      note: parsed.data.note ?? null,
    })

    const [row] = await db
      .insert(schema.metrics)
      .values({
        userId,
        type: entry.type,
        value: entry.value.toString(),
        valueSecondary: entry.valueSecondary?.toString() ?? null,
        unit: entry.unit,
        recordedAt: entry.recordedAt,
        source: entry.source,
        context: entry.context,
        note: entry.note,
      })
      .returning({ id: schema.metrics.id })

    const alerts = await checkRedFlags(userId, entry.type, entry.value)

    return reply.code(201).send({ id: row!.id, alerts })
  })

  app.get('/metrics', async (request, reply) => {
    const parsed = listQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid query', issues: parsed.error.issues })
    }

    const userId = request.session.userId!
    const { type, days, limit } = parsed.data
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const filters = [eq(schema.metrics.userId, userId), gte(schema.metrics.recordedAt, since)]
    if (type) filters.push(eq(schema.metrics.type, type))

    const rows = await db
      .select()
      .from(schema.metrics)
      .where(and(...filters))
      .orderBy(desc(schema.metrics.recordedAt))
      .limit(limit)

    return reply.send({
      metrics: rows.map((r) => ({
        ...r,
        value: Number(r.value),
        valueSecondary: r.valueSecondary === null ? null : Number(r.valueSecondary),
      })),
    })
  })
}

/**
 * Evaluates the new reading against the red flags declared by the user's
 * condition modules. Occurrence-based flags count matching readings inside the
 * flag's window rather than firing on a single outlier.
 */
async function checkRedFlags(
  userId: string,
  metricType: string,
  value: number,
): Promise<Array<{ id: string; severity: string; message: string }>> {
  const userConditions = await db
    .select({ key: schema.conditions.key })
    .from(schema.conditions)
    .where(and(eq(schema.conditions.userId, userId), eq(schema.conditions.status, 'active')))

  const modules = modulesFor(userConditions.map((c) => c.key as ConditionKey))
  const flags = mergedRedFlags(modules).filter((f) => f.metric === metricType)
  if (flags.length === 0) return []

  const triggered: Array<{ id: string; severity: string; message: string }> = []

  for (const flag of flags) {
    const breaches = flag.operator === 'lt' ? value < flag.threshold : value > flag.threshold
    if (!breaches) continue

    if (flag.occurrences <= 1) {
      triggered.push({ id: flag.id, severity: flag.severity, message: flag.message })
      continue
    }

    const since = new Date(Date.now() - flag.windowHours * 60 * 60 * 1000)
    const recent = await db
      .select({ value: schema.metrics.value })
      .from(schema.metrics)
      .where(
        and(
          eq(schema.metrics.userId, userId),
          eq(schema.metrics.type, metricType),
          gte(schema.metrics.recordedAt, since),
        ),
      )

    const matching = recent.filter((r) => {
      const v = Number(r.value)
      return flag.operator === 'lt' ? v < flag.threshold : v > flag.threshold
    }).length

    if (matching >= flag.occurrences) {
      triggered.push({ id: flag.id, severity: flag.severity, message: flag.message })
    }
  }

  // Most severe first — the UI shows the top one prominently.
  const order = { emergency: 0, urgent: 1, notice: 2 } as const
  return triggered.sort(
    (a, b) =>
      order[a.severity as keyof typeof order] - order[b.severity as keyof typeof order],
  )
}
