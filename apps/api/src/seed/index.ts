import { eq } from 'drizzle-orm'
import { GAD7, PHQ9, scoreQuestionnaire } from '@medbot/shared'
import { db, schema } from '../db/index.js'
import {
  DEMO_DAYS,
  generateGlucose,
  generateSideEffects,
  generateSubjective,
  generateVitals,
  makeRng,
  type GeneratedMetric,
} from './generate.js'

export const DEMO_EMAIL = 'demo@medbot.local'
const DEMO_GOOGLE_ID = 'demo-user-000'
const SEED = 20260719

function at(daysAgo: number, hour: number, now: Date): Date {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d
}

const iso = (d: Date): string => d.toISOString().slice(0, 10)

/**
 * Wipes every demo account and everything hanging off it. All domain tables
 * cascade from `users`, so this one delete is the whole master reset — nothing
 * is left orphaned and real accounts are untouched.
 */
export async function resetDemoData(): Promise<{ usersDeleted: number }> {
  const deleted = await db
    .delete(schema.users)
    .where(eq(schema.users.isDemo, true))
    .returning({ id: schema.users.id })
  return { usersDeleted: deleted.length }
}

export async function seedDemoData(): Promise<{ userId: string; metrics: number }> {
  await resetDemoData()

  const now = new Date()
  const rng = makeRng(SEED)

  const [user] = await db
    .insert(schema.users)
    .values({
      googleId: DEMO_GOOGLE_ID,
      email: DEMO_EMAIL,
      isDemo: true,
      // The demo account is an owner so the admin section is explorable.
      role: 'owner',
      onboardedAt: at(DEMO_DAYS, 9, now),
      termsAcceptedAt: at(DEMO_DAYS, 9, now),
      termsVersion: '1.0.0',
    })
    .returning({ id: schema.users.id })

  const userId = user!.id

  await db.insert(schema.profiles).values({
    userId,
    displayName: 'Demo User',
    dateOfBirth: '1984-03-12',
    sexAtBirth: 'prefer_not_to_say',
    heightCm: '178.0',
    timezone: 'America/New_York',
    allergies: ['penicillin', 'shellfish'],
    emergencyContactName: 'Jordan Reyes',
    emergencyContactPhone: '555-0142',
    preferredPharmacy: 'Riverside Pharmacy — 4th & Oak',
  })

  const providers = await db
    .insert(schema.careTeam)
    .values([
      {
        userId,
        name: 'Dr. Amara Osei',
        role: 'primary_care',
        organization: 'Riverside Family Medicine',
        phone: '555-0110',
        email: null,
      },
      {
        userId,
        name: 'Dr. Ellis Nakamura',
        role: 'endocrinologist',
        organization: 'Metro Endocrine Associates',
        phone: '555-0128',
        email: null,
      },
      {
        userId,
        name: 'Dr. Priya Raman',
        role: 'psychiatrist',
        organization: 'Lakeside Behavioral Health',
        phone: '555-0175',
        email: null,
      },
    ])
    .returning({ id: schema.careTeam.id, role: schema.careTeam.role })

  const endo = providers.find((p) => p.role === 'endocrinologist')!.id
  const psych = providers.find((p) => p.role === 'psychiatrist')!.id
  const pcp = providers.find((p) => p.role === 'primary_care')!.id

  await db.insert(schema.conditions).values([
    {
      userId,
      key: 'diabetes_t2',
      diagnosedAt: '2019-06-04',
      status: 'active',
      managingProviderId: endo,
      notes: 'Diet-controlled for the first two years, metformin added 2021.',
    },
    {
      userId,
      key: 'schizophrenia',
      diagnosedAt: '2012-11-20',
      status: 'active',
      managingProviderId: psych,
      notes: null,
    },
    {
      userId,
      key: 'hypertension',
      diagnosedAt: '2021-02-15',
      status: 'active',
      managingProviderId: pcp,
      notes: null,
    },
  ])

  const meds = await db
    .insert(schema.medications)
    .values([
      {
        userId,
        name: 'Metformin',
        dose: '1000 mg',
        form: 'tablet',
        schedule: {
          kind: 'fixed_times',
          times: ['08:00', '20:00'],
          intervalHours: null,
          daysOfWeek: [],
          cycleOnDays: null,
          cycleOffDays: null,
          withFood: true,
          instructions: 'Take with breakfast and dinner.',
        },
        purpose: 'Blood sugar control',
        prescriber: 'Dr. Ellis Nakamura',
        pharmacy: 'Riverside Pharmacy',
        startedAt: '2021-03-01',
        refillsRemaining: 2,
      },
      {
        userId,
        name: 'Aripiprazole',
        dose: '10 mg',
        form: 'tablet',
        schedule: {
          kind: 'fixed_times',
          times: ['08:00'],
          intervalHours: null,
          daysOfWeek: [],
          cycleOnDays: null,
          cycleOffDays: null,
          withFood: false,
          instructions: null,
        },
        purpose: 'Antipsychotic',
        prescriber: 'Dr. Priya Raman',
        pharmacy: 'Riverside Pharmacy',
        startedAt: '2016-08-14',
        refillsRemaining: 1,
      },
      {
        userId,
        name: 'Lisinopril',
        dose: '20 mg',
        form: 'tablet',
        schedule: {
          kind: 'fixed_times',
          times: ['08:00'],
          intervalHours: null,
          daysOfWeek: [],
          cycleOnDays: null,
          cycleOffDays: null,
          withFood: false,
          instructions: null,
        },
        purpose: 'Blood pressure',
        prescriber: 'Dr. Amara Osei',
        pharmacy: 'Riverside Pharmacy',
        startedAt: '2021-02-20',
        refillsRemaining: 4,
      },
      {
        userId,
        name: 'Atorvastatin',
        dose: '40 mg',
        form: 'tablet',
        schedule: {
          kind: 'fixed_times',
          times: ['21:00'],
          intervalHours: null,
          daysOfWeek: [],
          cycleOnDays: null,
          cycleOffDays: null,
          withFood: false,
          instructions: null,
        },
        purpose: 'Cholesterol',
        prescriber: 'Dr. Amara Osei',
        pharmacy: 'Riverside Pharmacy',
        startedAt: '2022-09-09',
        refillsRemaining: 0,
      },
    ])
    .returning({ id: schema.medications.id, name: schema.medications.name, schedule: schema.medications.schedule })

  // Adherence. Morning doses get missed noticeably more than evening ones, which
  // lines up with the sedation scores in the side-effect data.
  const adherenceRows: Array<typeof schema.adherenceEvents.$inferInsert> = []
  for (const med of meds) {
    const times = (med.schedule as { times: string[] }).times
    for (let day = DEMO_DAYS; day >= 0; day--) {
      for (const time of times) {
        const [h, m] = time.split(':').map(Number)
        const scheduledFor = new Date(now)
        scheduledFor.setDate(scheduledFor.getDate() - day)
        scheduledFor.setHours(h!, m!, 0, 0)
        if (scheduledFor > now) continue

        const morning = h! < 12
        const roll = rng()
        let status: string
        let reason: string | null = null

        if (morning && roll < 0.13) {
          status = roll < 0.06 ? 'missed' : 'skipped'
          reason = med.name === 'Aripiprazole' ? 'too groggy in the morning' : 'forgot'
        } else if (roll < 0.06) {
          status = 'late'
        } else {
          status = 'taken'
        }

        adherenceRows.push({
          userId,
          medicationId: med.id,
          status,
          scheduledFor,
          recordedAt: scheduledFor,
          reason,
        })
      }
    }
  }
  for (let i = 0; i < adherenceRows.length; i += 500) {
    await db.insert(schema.adherenceEvents).values(adherenceRows.slice(i, i + 500))
  }

  await db.insert(schema.appointments).values([
    {
      userId,
      title: 'Endocrinology follow-up',
      type: 'office_visit',
      providerId: endo,
      location: 'Metro Endocrine Associates, Suite 210',
      startsAt: at(-9, 10, now),
      endsAt: at(-9, 11, now),
      prepNotes: 'Bring glucose log for the last 90 days. Fasting labs the morning of.',
      visitNotes: null,
    },
    {
      userId,
      title: 'Psychiatry check-in',
      type: 'office_visit',
      providerId: psych,
      location: 'Lakeside Behavioral Health',
      startsAt: at(-23, 14, now),
      endsAt: at(-23, 15, now),
      prepNotes: 'Ask about morning sedation and whether dose timing can move to evening.',
      visitNotes: null,
    },
    {
      userId,
      title: 'A1C and lipid panel',
      type: 'lab',
      providerId: endo,
      location: 'Riverside Labs',
      startsAt: at(-2, 8, now),
      endsAt: at(-2, 9, now),
      prepNotes: 'Fasting — nothing but water after midnight.',
      visitNotes: null,
    },
    {
      userId,
      title: 'Annual physical',
      type: 'office_visit',
      providerId: pcp,
      location: 'Riverside Family Medicine',
      startsAt: at(34, 9, now),
      endsAt: at(34, 10, now),
      prepNotes: null,
      visitNotes: 'BP running high at 138/88. Increase lisinopril discussed, holding for now.',
    },
    {
      userId,
      title: 'Psychiatry check-in',
      type: 'office_visit',
      providerId: psych,
      location: 'Lakeside Behavioral Health',
      startsAt: at(67, 14, now),
      endsAt: at(67, 15, now),
      prepNotes: null,
      visitNotes: 'Stable. Continue current dose. Follow up in 3 months.',
    },
  ])

  // Questionnaire history, spaced two weeks apart, tracking the rough patch.
  const phqAnswerSets = [4, 6, 11, 13, 8, 5, 6]
  const gadAnswerSets = [3, 5, 9, 11, 7, 4, 5]
  const questionnaireRows: Array<typeof schema.questionnaireResponses.$inferInsert> = []
  const scoreMetrics: GeneratedMetric[] = []

  phqAnswerSets.forEach((target, i) => {
    const daysAgo = DEMO_DAYS - i * 14
    if (daysAgo < 0) return
    const answers = spreadScore(PHQ9.questions.map((q) => q.id), target)
    const scored = scoreQuestionnaire(PHQ9, answers)
    questionnaireRows.push({
      userId,
      questionnaireKey: PHQ9.key,
      answers,
      score: scored.total,
      band: scored.band?.label ?? null,
      criticalTriggered: scored.criticalTriggered,
      completedAt: at(daysAgo, 18, now),
    })
    scoreMetrics.push({
      type: 'questionnaire_score',
      value: scored.total,
      valueSecondary: null,
      unit: 'points',
      recordedAt: at(daysAgo, 18, now),
      source: 'questionnaire',
      context: 'phq9',
      note: null,
    })
  })

  gadAnswerSets.forEach((target, i) => {
    const daysAgo = DEMO_DAYS - i * 14
    if (daysAgo < 0) return
    const answers = spreadScore(GAD7.questions.map((q) => q.id), target)
    const scored = scoreQuestionnaire(GAD7, answers)
    questionnaireRows.push({
      userId,
      questionnaireKey: GAD7.key,
      answers,
      score: scored.total,
      band: scored.band?.label ?? null,
      criticalTriggered: scored.criticalTriggered,
      completedAt: at(daysAgo, 18, now),
    })
    scoreMetrics.push({
      type: 'questionnaire_score',
      value: scored.total,
      valueSecondary: null,
      unit: 'points',
      recordedAt: at(daysAgo, 18, now),
      source: 'questionnaire',
      context: 'gad7',
      note: null,
    })
  })

  await db.insert(schema.questionnaireResponses).values(questionnaireRows)

  const allMetrics: GeneratedMetric[] = [
    ...generateGlucose(rng, now),
    ...generateVitals(rng, now),
    ...generateSubjective(rng, now),
    ...generateSideEffects(rng, now),
    ...scoreMetrics,
  ]

  const metricRows = allMetrics.map((m) => ({
    userId,
    type: m.type,
    value: m.value.toString(),
    valueSecondary: m.valueSecondary?.toString() ?? null,
    unit: m.unit,
    recordedAt: m.recordedAt,
    source: m.source,
    context: m.context,
    note: m.note,
  }))

  for (let i = 0; i < metricRows.length; i += 500) {
    await db.insert(schema.metrics).values(metricRows.slice(i, i + 500))
  }

  return { userId, metrics: metricRows.length }
}

/** Distributes a target total across questions as 0-3 answers. */
function spreadScore(questionIds: string[], target: number): Record<string, number> {
  const answers: Record<string, number> = {}
  let remaining = target
  for (const id of questionIds) {
    const take = Math.max(0, Math.min(3, Math.round(remaining / 3)))
    answers[id] = take
    remaining -= take
  }
  // Push any rounding remainder onto the first question that has headroom.
  for (const id of questionIds) {
    if (remaining <= 0) break
    const room = 3 - (answers[id] ?? 0)
    const add = Math.min(room, remaining)
    answers[id] = (answers[id] ?? 0) + add
    remaining -= add
  }
  return answers
}
