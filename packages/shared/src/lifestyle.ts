import { z } from 'zod'

/**
 * Diet, exercise, and related lifestyle data — separate from point-in-time metrics
 * because they are event-based (a meal, a workout) with richer structure than a single
 * number. Steps and sleep_hours may still duplicate into `metrics` for charting.
 */

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const mealEntrySchema = z.object({
  description: z.string().min(1).max(500),
  mealType: z.enum(MEAL_TYPES).nullable().default(null),
  eatenAt: z.coerce.date(),
  /** Grams of carbohydrate — high value for diabetes. */
  carbsG: z.number().min(0).max(2000).nullable().default(null),
  calories: z.number().int().min(0).max(20000).nullable().default(null),
  proteinG: z.number().min(0).max(500).nullable().default(null),
  fatG: z.number().min(0).max(500).nullable().default(null),
  fiberG: z.number().min(0).max(200).nullable().default(null),
  sodiumMg: z.number().min(0).max(50000).nullable().default(null),
  /** e.g. "ate out", "homemade", "skipped lunch" */
  note: z.string().max(1000).nullable().default(null),
  /** Optional link to a glucose reading taken around this meal. */
  relatedMetricId: z.string().uuid().nullable().default(null),
})
export type MealEntry = z.infer<typeof mealEntrySchema>

export const DIETARY_PATTERNS = [
  'no_restrictions',
  'diabetes_carb_aware',
  'low_sodium',
  'low_carb',
  'mediterranean',
  'vegetarian',
  'vegan',
  'gluten_free',
  'renal_diet',
  'other',
] as const
export type DietaryPattern = (typeof DIETARY_PATTERNS)[number]

export const dietaryProfileSchema = z.object({
  patterns: z.array(z.enum(DIETARY_PATTERNS)).default([]),
  /** Daily targets set by user or care team — not prescribed by the app. */
  dailyCarbTargetG: z.number().min(0).max(1000).nullable().default(null),
  dailyCalorieTarget: z.number().int().min(0).max(20000).nullable().default(null),
  dailyWaterTargetMl: z.number().int().min(0).max(10000).nullable().default(null),
  allergiesAndAvoids: z.array(z.string().max(200)).default([]),
  notes: z.string().max(2000).nullable().default(null),
})
export type DietaryProfile = z.infer<typeof dietaryProfileSchema>

export const EXERCISE_TYPES = [
  'walk',
  'run',
  'cycle',
  'swim',
  'strength',
  'yoga',
  'stretching',
  'physical_therapy',
  'sports',
  'housework',
  'other',
] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

export const EXERCISE_INTENSITIES = ['light', 'moderate', 'vigorous'] as const
export type ExerciseIntensity = (typeof EXERCISE_INTENSITIES)[number]

export const exerciseSessionSchema = z.object({
  activityType: z.enum(EXERCISE_TYPES),
  /** Free label when type is other, e.g. "water aerobics". */
  label: z.string().max(200).nullable().default(null),
  startedAt: z.coerce.date(),
  durationMinutes: z.number().int().min(1).max(1440),
  intensity: z.enum(EXERCISE_INTENSITIES).nullable().default(null),
  /** Device-reported or estimated. */
  steps: z.number().int().min(0).max(200000).nullable().default(null),
  distanceKm: z.number().min(0).max(500).nullable().default(null),
  /** Perceived exertion 1–10, optional. */
  exertion: z.number().int().min(1).max(10).nullable().default(null),
  note: z.string().max(1000).nullable().default(null),
})
export type ExerciseSession = z.infer<typeof exerciseSessionSchema>

export const exerciseGoalSchema = z.object({
  /** e.g. 150 moderate minutes per week (common guideline — user/doctor sets target). */
  weeklyMinutesTarget: z.number().int().min(0).max(2000).nullable().default(null),
  weeklyActiveDaysTarget: z.number().int().min(0).max(7).nullable().default(null),
  dailyStepsTarget: z.number().int().min(0).max(100000).nullable().default(null),
  notes: z.string().max(1000).nullable().default(null),
})
export type ExerciseGoal = z.infer<typeof exerciseGoalSchema>

export const SLEEP_SESSION_QUALITIES = ['poor', 'fair', 'good', 'excellent'] as const
export type SleepSessionQuality = (typeof SLEEP_SESSION_QUALITIES)[number]

export const sleepSessionSchema = z.object({
  bedTime: z.coerce.date(),
  wakeTime: z.coerce.date(),
  quality: z.enum(SLEEP_SESSION_QUALITIES).nullable().default(null),
  /** Interruptions, dreams, CPAP use, etc. */
  note: z.string().max(1000).nullable().default(null),
  /** Derived or entered; hours asleep (excluding wake periods if known). */
  hoursAsleep: z.number().min(0).max(24).nullable().default(null),
})
export type SleepSession = z.infer<typeof sleepSessionSchema>

export const SUBSTANCE_TYPES = ['alcohol', 'tobacco', 'caffeine', 'cannabis', 'other'] as const
export type SubstanceType = (typeof SUBSTANCE_TYPES)[number]

/** Optional lifestyle log — AUDIT-C covers screening; this is granular when user chooses. */
export const substanceUseEntrySchema = z.object({
  substance: z.enum(SUBSTANCE_TYPES),
  recordedAt: z.coerce.date(),
  /** Drinks, cigarettes, cups of coffee, etc. — unit in context. */
  amount: z.number().min(0).max(100).nullable().default(null),
  unit: z.string().max(50).nullable().default(null),
  note: z.string().max(500).nullable().default(null),
})
export type SubstanceUseEntry = z.infer<typeof substanceUseEntrySchema>

export const supplementSchema = z.object({
  name: z.string().min(1).max(200),
  dose: z.string().max(100).nullable().default(null),
  schedule: z.string().max(200).nullable().default(null),
  reason: z.string().max(300).nullable().default(null),
  isActive: z.boolean().default(true),
})
export type Supplement = z.infer<typeof supplementSchema>

export const BODY_MEASUREMENT_TYPES = [
  'weight',
  'waist_circumference',
  'hip_circumference',
  'body_fat_percent',
] as const
export type BodyMeasurementType = (typeof BODY_MEASUREMENT_TYPES)[number]

export const bodyMeasurementSchema = z.object({
  type: z.enum(BODY_MEASUREMENT_TYPES),
  value: z.number().positive(),
  unit: z.string().min(1).max(20),
  measuredAt: z.coerce.date(),
  note: z.string().max(500).nullable().default(null),
})
export type BodyMeasurement = z.infer<typeof bodyMeasurementSchema>

/** Weekly rollups the assistant can cite without re-scanning every row. */
export interface LifestyleSummary {
  periodDays: number
  mealCount: number
  avgDailyCarbsG: number | null
  avgDailyCalories: number | null
  exerciseSessionCount: number
  totalExerciseMinutes: number
  avgDailySteps: number | null
  avgSleepHours: number | null
  activeDays: number
}

export function summarizeExerciseMinutes(sessions: readonly Pick<ExerciseSession, 'durationMinutes' | 'startedAt'>[], periodDays: number): Pick<LifestyleSummary, 'exerciseSessionCount' | 'totalExerciseMinutes' | 'activeDays'> {
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000
  const recent = sessions.filter((s) => s.startedAt.getTime() >= cutoff)
  const days = new Set(recent.map((s) => s.startedAt.toISOString().slice(0, 10)))
  return {
    exerciseSessionCount: recent.length,
    totalExerciseMinutes: recent.reduce((sum, s) => sum + s.durationMinutes, 0),
    activeDays: days.size,
  }
}
