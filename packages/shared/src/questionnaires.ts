import { z } from 'zod'

/**
 * Generic questionnaire engine. Instruments are data, not code, so adding
 * AUDIT-C or a diabetes-distress scale is a new definition file rather than a
 * new form component.
 */

export const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  type: z.enum(['scale', 'single_choice', 'multi_choice', 'numeric', 'text', 'boolean']),
  /** For scale/choice types. `value` feeds scoring, `label` is what the user sees. */
  options: z
    .array(z.object({ value: z.number(), label: z.string() }))
    .default([]),
  required: z.boolean().default(true),
  /** Only ask this question when a prior answer matches. */
  showIf: z
    .object({ questionId: z.string(), equals: z.union([z.number(), z.string(), z.boolean()]) })
    .nullable()
    .default(null),
})
export type Question = z.infer<typeof questionSchema>

export const scoreBandSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string(),
  /** Drives whether a result is surfaced proactively or just logged. */
  severity: z.enum(['none', 'mild', 'moderate', 'severe']),
})
export type ScoreBand = z.infer<typeof scoreBandSchema>

export const questionnaireSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  /** How often the scheduler should re-offer it. 0 = one-time (intake). */
  cadenceDays: z.number().int().min(0).default(0),
  questions: z.array(questionSchema).min(1),
  scoring: z.enum(['sum', 'none']).default('sum'),
  bands: z.array(scoreBandSchema).default([]),
  /**
   * Question ids that, if answered above threshold, escalate regardless of the
   * total score. PHQ-9 item 9 (self-harm) is the canonical case.
   */
  criticalItems: z
    .array(z.object({ questionId: z.string(), atOrAbove: z.number() }))
    .default([]),
})
export type Questionnaire = z.infer<typeof questionnaireSchema>

export interface ScoredResult {
  total: number
  band: ScoreBand | null
  criticalTriggered: string[]
}

export function scoreQuestionnaire(
  def: Questionnaire,
  answers: Record<string, number>,
): ScoredResult {
  if (def.scoring === 'none') {
    return { total: 0, band: null, criticalTriggered: [] }
  }

  const total = Object.values(answers).reduce((sum, v) => sum + v, 0)
  const band = def.bands.find((b) => total >= b.min && total <= b.max) ?? null

  const criticalTriggered = def.criticalItems
    .filter((item) => (answers[item.questionId] ?? 0) >= item.atOrAbove)
    .map((item) => item.questionId)

  return { total, band, criticalTriggered }
}

const FREQ_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

const scaled = (id: string, prompt: string): Question =>
  questionSchema.parse({ id, prompt, type: 'scale', options: FREQ_OPTIONS })

/** PHQ-9 — depression severity. Public domain (Pfizer released it for free use). */
export const PHQ9: Questionnaire = questionnaireSchema.parse({
  key: 'phq9',
  title: 'PHQ-9 (Depression)',
  description: 'Over the last 2 weeks, how often have you been bothered by the following?',
  cadenceDays: 14,
  questions: [
    scaled('q1', 'Little interest or pleasure in doing things'),
    scaled('q2', 'Feeling down, depressed, or hopeless'),
    scaled('q3', 'Trouble falling or staying asleep, or sleeping too much'),
    scaled('q4', 'Feeling tired or having little energy'),
    scaled('q5', 'Poor appetite or overeating'),
    scaled('q6', 'Feeling bad about yourself, or that you are a failure'),
    scaled('q7', 'Trouble concentrating on things'),
    scaled('q8', 'Moving or speaking noticeably slowly, or being restless and fidgety'),
    scaled('q9', 'Thoughts that you would be better off dead, or of hurting yourself'),
  ],
  bands: [
    { min: 0, max: 4, label: 'Minimal', severity: 'none' },
    { min: 5, max: 9, label: 'Mild', severity: 'mild' },
    { min: 10, max: 14, label: 'Moderate', severity: 'moderate' },
    { min: 15, max: 19, label: 'Moderately severe', severity: 'severe' },
    { min: 20, max: 27, label: 'Severe', severity: 'severe' },
  ],
  criticalItems: [{ questionId: 'q9', atOrAbove: 1 }],
})

/** GAD-7 — anxiety severity. Public domain. */
export const GAD7: Questionnaire = questionnaireSchema.parse({
  key: 'gad7',
  title: 'GAD-7 (Anxiety)',
  description: 'Over the last 2 weeks, how often have you been bothered by the following?',
  cadenceDays: 14,
  questions: [
    scaled('q1', 'Feeling nervous, anxious, or on edge'),
    scaled('q2', 'Not being able to stop or control worrying'),
    scaled('q3', 'Worrying too much about different things'),
    scaled('q4', 'Trouble relaxing'),
    scaled('q5', 'Being so restless that it is hard to sit still'),
    scaled('q6', 'Becoming easily annoyed or irritable'),
    scaled('q7', 'Feeling afraid as if something awful might happen'),
  ],
  bands: [
    { min: 0, max: 4, label: 'Minimal', severity: 'none' },
    { min: 5, max: 9, label: 'Mild', severity: 'mild' },
    { min: 10, max: 14, label: 'Moderate', severity: 'moderate' },
    { min: 15, max: 21, label: 'Severe', severity: 'severe' },
  ],
})

export const BUILT_IN_QUESTIONNAIRES: Record<string, Questionnaire> = {
  [PHQ9.key]: PHQ9,
  [GAD7.key]: GAD7,
}
