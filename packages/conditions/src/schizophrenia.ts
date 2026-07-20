import type { ConditionModule } from './types.js'

/**
 * Schizophrenia / schizoaffective.
 *
 * Same posture as the diabetes module: record the data, show the trends, leave
 * the conclusions to the user and their prescriber. Sleep, mood, and side
 * effects are the things that are hard to reconstruct accurately at an
 * appointment three months later, so those are what this keeps.
 *
 * The one thing here that is genuinely easy to miss without tracking is the
 * metabolic effect of antipsychotics, which is why weight and glucose are in
 * the list even without a diabetes diagnosis.
 */
export const schizophrenia: ConditionModule = {
  key: 'schizophrenia',
  label: 'Schizophrenia',
  summary:
    'Tracks sleep, mood, medication adherence, antipsychotic side effects, and metabolic markers.',
  metrics: [
    { type: 'sleep_hours', dailyPrompts: 1, targetMin: 6, targetMax: 10 },
    { type: 'sleep_quality', dailyPrompts: 1, targetMin: 5, targetMax: 10 },
    { type: 'mood', dailyPrompts: 1, targetMin: 4, targetMax: 10 },
    { type: 'anxiety', dailyPrompts: 1, targetMin: 0, targetMax: 5 },
    {
      type: 'side_effect_severity',
      dailyPrompts: 0,
      targetMin: 0,
      targetMax: 3,
      contexts: ['sedation', 'restlessness', 'stiffness', 'tremor', 'weight_gain', 'dry_mouth'],
    },
    { type: 'weight', dailyPrompts: 0, targetMin: null, targetMax: null },
    { type: 'blood_glucose', dailyPrompts: 0, targetMin: 70, targetMax: 140 },
  ],
  questionnaireKeys: ['med_adherence', 'gass_side_effects', 'sleep_quality'],
  /**
   * Physiological thresholds only, matching how the diabetes module works. Sleep
   * and mood have no flags here on purpose — you already know how you slept, and
   * the only thing a threshold could add is an interpretation you did not ask
   * for. Those metrics still chart.
   */
  redFlags: [
    {
      id: 'severe_side_effect',
      metric: 'side_effect_severity',
      operator: 'gt',
      threshold: 7,
      occurrences: 1,
      windowHours: 24,
      severity: 'notice',
      message:
        'Logged as severe. Side effects at this level are usually worth raising with your prescriber — a different agent or a change in timing often resolves them.',
    },
    {
      id: 'metabolic_glucose',
      metric: 'blood_glucose',
      operator: 'gt',
      threshold: 200,
      occurrences: 2,
      windowHours: 336,
      severity: 'notice',
      message:
        'Glucose has come back high more than once recently. Antipsychotics can affect blood sugar, and this is the kind of thing worth a lab check.',
    },
  ],
  trends: [
    {
      id: 'adherence_pattern',
      description: 'Adherence over time',
      detect: 'Weekly adherence rate trending up or down across 3+ consecutive weeks.',
    },
    {
      id: 'side_effect_driven_nonadherence',
      description: 'Side effects lining up with missed doses',
      detect:
        'Skipped doses with reasons citing side effects, correlated with rising side-effect severity scores. Useful to bring to a prescriber — timing or agent changes often address it.',
    },
    {
      id: 'metabolic_drift',
      description: 'Antipsychotic metabolic effects',
      detect: 'Steady weight gain or rising glucose since an antipsychotic start or switch date.',
    },
  ],
  promptGuidance: `The user has schizophrenia. When they report a side effect, capture which \
medication it relates to and how severe it was — that link is what makes the log useful at \
an appointment months later. Sleep and mood entries are data to record, not prompts for \
commentary.`,
}
