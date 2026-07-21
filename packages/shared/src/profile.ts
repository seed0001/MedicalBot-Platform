import { z } from 'zod'

export const CONDITION_KEYS = [
  'diabetes_t1',
  'diabetes_t2',
  'prediabetes',
  'schizophrenia',
  'schizoaffective',
  'bipolar',
  'depression',
  'anxiety',
  'hypertension',
  'hyperlipidemia',
  'ckd',
  'copd',
  'asthma',
  'thyroid',
  'epilepsy',
  'chronic_pain',
  'obesity',
] as const
export type ConditionKey = (typeof CONDITION_KEYS)[number]

/**
 * Plain-language labels for every condition key. The intake picker offers the
 * full list, so every key needs a label — not just the ones that ship with a
 * condition module today.
 */
export const CONDITION_LABELS: Record<ConditionKey, string> = {
  diabetes_t1: 'Type 1 Diabetes',
  diabetes_t2: 'Type 2 Diabetes',
  prediabetes: 'Prediabetes',
  schizophrenia: 'Schizophrenia',
  schizoaffective: 'Schizoaffective Disorder',
  bipolar: 'Bipolar Disorder',
  depression: 'Depression',
  anxiety: 'Anxiety',
  hypertension: 'High Blood Pressure',
  hyperlipidemia: 'High Cholesterol',
  ckd: 'Chronic Kidney Disease',
  copd: 'COPD',
  asthma: 'Asthma',
  thyroid: 'Thyroid Disorder',
  epilepsy: 'Epilepsy',
  chronic_pain: 'Chronic Pain',
  obesity: 'Weight Management',
}

export const conditionSchema = z.object({
  key: z.enum(CONDITION_KEYS),
  diagnosedAt: z.coerce.date().nullable().default(null),
  status: z.enum(['active', 'remission', 'resolved']).default('active'),
  managingProviderId: z.string().uuid().nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
})
export type Condition = z.infer<typeof conditionSchema>

export const careTeamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum([
    'primary_care',
    'endocrinologist',
    'psychiatrist',
    'therapist',
    'cardiologist',
    'nephrologist',
    'neurologist',
    'pharmacist',
    'case_manager',
    'other',
  ]),
  organization: z.string().max(200).nullable().default(null),
  phone: z.string().max(40).nullable().default(null),
  email: z.string().email().nullable().default(null),
})
export type CareTeamMember = z.infer<typeof careTeamMemberSchema>

export const profileSchema = z.object({
  displayName: z.string().min(1).max(120),
  dateOfBirth: z.coerce.date().nullable().default(null),
  /** Recorded because several clinical reference ranges are sex-specific. */
  sexAtBirth: z.enum(['female', 'male', 'intersex', 'prefer_not_to_say']).nullable().default(null),
  heightCm: z.number().positive().max(280).nullable().default(null),
  timezone: z.string().default('America/New_York'),
  allergies: z.array(z.string().max(200)).default([]),
  emergencyContactName: z.string().max(200).nullable().default(null),
  emergencyContactPhone: z.string().max(40).nullable().default(null),
  preferredPharmacy: z.string().max(200).nullable().default(null),
})
export type Profile = z.infer<typeof profileSchema>

/**
 * Minimal signup intake (SPEC.md §5). The account itself is created by Google
 * OAuth; this collects only what the product needs to be useful on first load.
 * A condition is the one required field — with none, the dashboard has nothing
 * to track. Everything else (meds, allergies, care team, pharmacy, height) is
 * deferred to progressive profiling and editable later.
 */
export const intakeSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  dateOfBirth: z.coerce.date().nullable().default(null),
  sexAtBirth: z.enum(['female', 'male', 'intersex', 'prefer_not_to_say']).nullable().default(null),
  /** At least one — deduplicated so a double-tap can't create conflicting rows. */
  conditions: z
    .array(z.enum(CONDITION_KEYS))
    .min(1, 'Pick at least one condition to get started')
    .transform((keys) => [...new Set(keys)]),
})
export type IntakeSubmission = z.infer<typeof intakeSchema>

export function ageFrom(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear()
  const monthDelta = now.getMonth() - dateOfBirth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1
  }
  return age
}
