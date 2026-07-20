import type { ConditionModule } from './types.js'

/**
 * Schizophrenia / schizoaffective. Deliberately the opposite shape from the
 * diabetes module: little numeric data, and the signal that matters is
 * adherence, sleep, and subjective state. Relapse is usually preceded by days
 * of degraded sleep and missed doses, which is exactly what this tracks.
 *
 * Tone matters more here than anywhere else in the product. The module never
 * frames check-ins as surveillance, and never asks the user to litigate whether
 * their experiences are real.
 */
export const schizophrenia: ConditionModule = {
  key: 'schizophrenia',
  label: 'Schizophrenia',
  summary:
    'Tracks medication adherence, sleep, mood, and antipsychotic side effects. Watches for early relapse signals.',
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
    // Antipsychotics carry metabolic risk, so these are tracked even without a
    // diabetes diagnosis.
    { type: 'weight', dailyPrompts: 0, targetMin: null, targetMax: null },
    { type: 'blood_glucose', dailyPrompts: 0, targetMin: 70, targetMax: 140 },
  ],
  questionnaireKeys: ['med_adherence', 'gass_side_effects', 'sleep_quality', 'phq9'],
  redFlags: [
    {
      id: 'sleep_collapse',
      metric: 'sleep_hours',
      operator: 'lt',
      threshold: 4,
      occurrences: 2,
      windowHours: 72,
      severity: 'urgent',
      message:
        'Two nights of very little sleep in three days. Sleep loss is one of the earliest relapse signals — this is worth a call to your psychiatrist or case manager.',
    },
    {
      id: 'sleep_decline',
      metric: 'sleep_hours',
      operator: 'lt',
      threshold: 5,
      occurrences: 4,
      windowHours: 168,
      severity: 'notice',
      message: 'Sleep has been short most of this week. Worth mentioning at your next appointment.',
    },
    {
      id: 'severe_side_effect',
      metric: 'side_effect_severity',
      operator: 'gt',
      threshold: 7,
      occurrences: 1,
      windowHours: 24,
      severity: 'urgent',
      message:
        'A side effect you rated this severe should be reported to your prescriber. Do not stop the medication on your own — stopping abruptly carries its own risks.',
    },
    {
      id: 'mood_drop',
      metric: 'mood',
      operator: 'lt',
      threshold: 3,
      occurrences: 3,
      windowHours: 168,
      severity: 'notice',
      message: 'Mood has been low several days this week.',
    },
  ],
  trends: [
    {
      id: 'prodrome',
      description: 'Early relapse signature',
      detect:
        'Declining sleep hours combined with dropping adherence rate over 5-10 days. This combination precedes relapse more reliably than either alone.',
    },
    {
      id: 'adherence_decay',
      description: 'Adherence slipping',
      detect: 'Weekly adherence rate declining across 3+ consecutive weeks, even if still above 80%.',
    },
    {
      id: 'side_effect_driven_nonadherence',
      description: 'Side effects driving missed doses',
      detect:
        'Skipped doses with reasons citing side effects, correlated with rising side-effect severity scores. This is actionable — a different agent or dose timing often fixes it.',
    },
    {
      id: 'metabolic_drift',
      description: 'Antipsychotic metabolic effects',
      detect: 'Steady weight gain or rising glucose since an antipsychotic start or switch date.',
    },
  ],
  promptGuidance: `The user has schizophrenia. Adherence and sleep are the highest-value \
things you track — treat a missed-dose report as information to record, never as something \
to scold. If they mention hearing voices or unusual experiences, do not argue about whether \
those experiences are real and do not play along as if you can perceive them; acknowledge \
what they told you, note it, and ask how they are doing. Route command hallucinations or \
anything suggesting danger to the crisis path immediately. Never suggest stopping or \
changing an antipsychotic — abrupt discontinuation carries real relapse risk — but do help \
them document side effects clearly enough to bring to their prescriber.`,
}
