import type { ConditionKey, MetricType } from '@medbot/shared'

/**
 * A condition module is the platform's extensibility seam. It declares what a
 * given diagnosis means operationally: what to track, how often to ask, and
 * what counts as concerning. Adding CHF or epilepsy is a new module here, not a
 * change to the core.
 */

export interface TrackedMetric {
  type: MetricType
  /** Times per day the user is nudged. 0 = track opportunistically, never nudge. */
  dailyPrompts: number
  /** Inclusive target band. Personalized per user later; these are defaults. */
  targetMin: number | null
  targetMax: number | null
  /** Meal contexts to ask for, when the metric is context-sensitive. */
  contexts?: readonly string[]
}

export interface RedFlag {
  id: string
  metric: MetricType
  /** Fires when a reading is outside this band. */
  operator: 'lt' | 'gt'
  threshold: number
  /** How many readings in the window before it escalates. 1 = immediate. */
  occurrences: number
  windowHours: number
  severity: 'notice' | 'urgent' | 'emergency'
  message: string
}

export interface TrendRule {
  id: string
  description: string
  /** Human-readable so the analysis model can reason over it. */
  detect: string
}

export interface ConditionModule {
  key: ConditionKey
  label: string
  /** Short line the AI layer gets in its context when the user has this. */
  summary: string
  metrics: readonly TrackedMetric[]
  questionnaireKeys: readonly string[]
  redFlags: readonly RedFlag[]
  trends: readonly TrendRule[]
  /** Extra guardrails appended to the system prompt for this condition. */
  promptGuidance: string
}
