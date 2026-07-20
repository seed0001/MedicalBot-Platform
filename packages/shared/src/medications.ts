import { z } from 'zod'

/**
 * Schedules are structured, never freetext. Reminder jobs and adherence scoring
 * both read this, so "twice daily with food" has to be machine-readable.
 */
export const scheduleSchema = z.object({
  kind: z.enum(['fixed_times', 'interval_hours', 'as_needed', 'cyclic']),
  /** 24h local times, e.g. ["08:00", "20:00"]. Used by fixed_times. */
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).default([]),
  /** Used by interval_hours. */
  intervalHours: z.number().int().positive().nullable().default(null),
  /** 0=Sunday..6=Saturday. Empty means every day. */
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  /** Used by cyclic, e.g. 21 days on / 7 off. */
  cycleOnDays: z.number().int().positive().nullable().default(null),
  cycleOffDays: z.number().int().positive().nullable().default(null),
  withFood: z.boolean().default(false),
  instructions: z.string().max(500).nullable().default(null),
})
export type Schedule = z.infer<typeof scheduleSchema>

export const medicationSchema = z.object({
  name: z.string().min(1).max(200),
  /** RxNorm concept id once resolved. Null until normalized. */
  rxcui: z.string().max(20).nullable().default(null),
  dose: z.string().min(1).max(100),
  form: z
    .enum([
      'tablet',
      'capsule',
      'liquid',
      'injection',
      'inhaler',
      'patch',
      'topical',
      'other',
    ])
    .default('tablet'),
  schedule: scheduleSchema,
  purpose: z.string().max(300).nullable().default(null),
  prescriber: z.string().max(200).nullable().default(null),
  pharmacy: z.string().max(200).nullable().default(null),
  startedAt: z.coerce.date().nullable().default(null),
  endedAt: z.coerce.date().nullable().default(null),
  refillsRemaining: z.number().int().min(0).nullable().default(null),
  isActive: z.boolean().default(true),
})
export type Medication = z.infer<typeof medicationSchema>

export const ADHERENCE_STATUSES = ['taken', 'skipped', 'late', 'missed'] as const
export type AdherenceStatus = (typeof ADHERENCE_STATUSES)[number]

export const adherenceEventSchema = z.object({
  medicationId: z.string().uuid(),
  status: z.enum(ADHERENCE_STATUSES),
  /** The dose slot this event answers for. */
  scheduledFor: z.coerce.date(),
  recordedAt: z.coerce.date(),
  /** "made me drowsy", "ran out", "forgot" — the why matters clinically. */
  reason: z.string().max(500).nullable().default(null),
})
export type AdherenceEvent = z.infer<typeof adherenceEventSchema>

/** Fraction of scheduled doses marked taken (late still counts as taken). */
export function adherenceRate(events: readonly AdherenceEvent[]): number {
  if (events.length === 0) return 1
  const took = events.filter((e) => e.status === 'taken' || e.status === 'late').length
  return took / events.length
}
