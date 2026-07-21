import type { FastifyInstance } from 'fastify'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { METRIC_TYPES, normalizeMetricInput } from '@medbot/shared'
import { openRouterConfigured } from '../config.js'
import { db, schema } from '../db/index.js'
import { extractDocument } from '../ai/extract-document.js'
import { requireUser } from './auth.js'

/**
 * Document import: upload a lab report / prescription / visit summary as a PDF or
 * image, have a vision model extract structured candidates, and — only after the
 * user reviews and confirms — write them into labs, medications, and vitals.
 * Parse and commit are separate steps on purpose: nothing is written until the
 * user approves it.
 */

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])
const MAX_BYTES = 15 * 1024 * 1024
const MED_FORMS = new Set([
  'tablet',
  'capsule',
  'liquid',
  'injection',
  'inhaler',
  'patch',
  'topical',
  'other',
])

const toDate = (s: string | null | undefined): Date | null => {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(+d) ? null : d
}

export async function importRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser)

  // Base64 data URLs are large, so this route gets a bigger body limit.
  app.post('/import/parse', { bodyLimit: 20 * 1024 * 1024 }, async (request, reply) => {
    if (!openRouterConfigured) {
      return reply.code(503).send({
        error: 'Document import needs OPENROUTER_API_KEY set on the server.',
        configured: false,
      })
    }
    const body = request.body as { filename?: string; mimeType?: string; dataUrl?: string }
    const { filename, mimeType, dataUrl } = body
    if (!mimeType || !ALLOWED_TYPES.has(mimeType)) {
      return reply.code(400).send({ error: 'Upload a PDF, PNG, JPG, or WebP file.' })
    }
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return reply.code(400).send({ error: 'Missing file data.' })
    }
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
    if ((base64.length * 3) / 4 > MAX_BYTES) {
      return reply.code(413).send({ error: 'File is too large (max 15 MB).' })
    }

    try {
      const extracted = await extractDocument({
        filename: filename ?? 'document',
        mimeType,
        dataUrl,
      })
      return reply.send(extracted)
    } catch (err) {
      request.log.error({ err: err instanceof Error ? err.message : 'unknown' }, 'Document parse failed')
      return reply.code(502).send({ error: 'Could not read that document. Try a clearer scan or a different file.' })
    }
  })

  const commitBody = z.object({
    sourceDocument: z.string().max(300).nullish(),
    labResults: z
      .array(
        z.object({
          testName: z.string().min(1),
          value: z.string().min(1),
          unit: z.string().nullish(),
          referenceText: z.string().nullish(),
          flag: z.string().nullish(),
          panelName: z.string().nullish(),
          loinc: z.string().nullish(),
          collectedAt: z.string().nullish(),
        }),
      )
      .default([]),
    medications: z
      .array(
        z.object({
          name: z.string().min(1),
          dose: z.string().nullish(),
          form: z.string().nullish(),
          frequency: z.string().nullish(),
          purpose: z.string().nullish(),
        }),
      )
      .default([]),
    vitals: z
      .array(
        z.object({
          type: z.enum(METRIC_TYPES),
          value: z.number(),
          valueSecondary: z.number().nullish(),
          unit: z.string().nullish(),
          at: z.string().nullish(),
        }),
      )
      .default([]),
  })

  app.post('/import/commit', async (request, reply) => {
    const parsed = commitBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid selection', issues: parsed.error.issues })
    }
    const userId = request.session.userId!
    const { labResults, medications, vitals, sourceDocument } = parsed.data

    await db.transaction(async (tx) => {
      for (const lab of labResults) {
        const collectedAt = toDate(lab.collectedAt)
        await tx.insert(schema.labResults).values({
          userId,
          testName: lab.testName,
          loinc: lab.loinc ?? null,
          value: lab.value,
          unit: lab.unit ?? null,
          collectedAt,
          referenceText: lab.referenceText ?? null,
          flag: lab.flag ?? 'normal',
          panelName: lab.panelName ?? null,
          sourceDocument: sourceDocument ?? null,
        })
        // Mirror numeric results into metrics so they trend on the charts.
        const n = Number(lab.value)
        if (Number.isFinite(n)) {
          await tx.insert(schema.metrics).values({
            userId,
            type: 'lab_value',
            value: String(n),
            unit: lab.unit ?? 'varies',
            recordedAt: collectedAt ?? new Date(),
            source: 'lab_upload',
            context: lab.testName,
            note: lab.referenceText ?? null,
          })
        }
      }

      for (const med of medications) {
        const form = med.form && MED_FORMS.has(med.form.toLowerCase()) ? med.form.toLowerCase() : 'other'
        await tx.insert(schema.medications).values({
          userId,
          name: med.name,
          dose: med.dose ?? 'as directed',
          form,
          schedule: {
            kind: 'as_needed',
            times: [],
            intervalHours: null,
            daysOfWeek: [],
            cycleOnDays: null,
            cycleOffDays: null,
            withFood: false,
            instructions: med.frequency ?? null,
          },
          purpose: med.purpose ?? null,
        })
      }

      for (const v of vitals) {
        const entry = normalizeMetricInput({
          type: v.type as never,
          value: v.value,
          valueSecondary: v.valueSecondary ?? null,
          recordedAt: toDate(v.at) ?? undefined,
        })
        await tx.insert(schema.metrics).values({
          userId,
          type: entry.type,
          value: String(entry.value),
          valueSecondary: entry.valueSecondary == null ? null : String(entry.valueSecondary),
          unit: entry.unit,
          recordedAt: entry.recordedAt,
          source: 'lab_upload',
          context: null,
        })
      }
    })

    return reply.send({
      ok: true,
      labsAdded: labResults.length,
      medsAdded: medications.length,
      vitalsAdded: vitals.length,
    })
  })

  app.get('/lab-results', async (request, reply) => {
    const userId = request.session.userId!
    const rows = await db
      .select()
      .from(schema.labResults)
      .where(eq(schema.labResults.userId, userId))
      .orderBy(desc(schema.labResults.collectedAt))
      .limit(500)
    return reply.send({ labResults: rows })
  })
}
