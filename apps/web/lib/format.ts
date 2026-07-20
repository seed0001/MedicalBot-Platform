export const METRIC_LABELS: Record<string, string> = {
  blood_glucose: 'Blood glucose',
  weight: 'Weight',
  blood_pressure: 'Blood pressure',
  heart_rate: 'Heart rate',
  a1c: 'A1C',
  temperature: 'Temperature',
  spo2: 'Oxygen saturation',
  sleep_hours: 'Sleep',
  sleep_quality: 'Sleep quality',
  mood: 'Mood',
  anxiety: 'Anxiety',
  pain: 'Pain',
  steps: 'Steps',
  water_intake: 'Water',
  symptom_severity: 'Symptom severity',
  side_effect_severity: 'Side effects',
  questionnaire_score: 'Assessment score',
  lab_value: 'Lab value',
}

export const CONTEXT_LABELS: Record<string, string> = {
  fasting: 'Fasting',
  pre_meal: 'Before a meal',
  post_meal: 'After a meal',
  bedtime: 'Bedtime',
  random: 'Random',
  hypo_event: 'Low event',
  sedation: 'Sedation',
  restlessness: 'Restlessness',
  stiffness: 'Stiffness',
  tremor: 'Tremor',
  weight_gain: 'Weight gain',
  dry_mouth: 'Dry mouth',
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
}

/** Blood pressure is the only metric that renders two numbers. */
export function formatMetric(
  type: string,
  value: number | null,
  secondary: number | null = null,
): string {
  if (value === null) return '—'
  if (type === 'blood_pressure' && secondary !== null) return `${value}/${secondary}`
  return String(value)
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function titleCase(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
