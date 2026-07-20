/**
 * Patient-education snippets for lifestyle tracking — not meal plans or exercise prescriptions.
 */

export interface LifestyleTopicReference {
  id: string
  title: string
  summary: string
  whyTrack: string
  disclaimer: string
}

export const LIFESTYLE_GLOSSARY_DISCLAIMER =
  'General wellness information only. Diet and activity targets come from you and your care team — not from this app.'

export const LIFESTYLE_TOPICS: LifestyleTopicReference[] = [
  {
    id: 'carb_awareness',
    title: 'Carbohydrate awareness (diabetes)',
    summary:
      'Carbohydrates raise blood sugar more than protein or fat. Logging carbs with meals helps you and your doctor see patterns between food and glucose readings.',
    whyTrack:
      'Pairing meals with pre- and post-meal glucose shows how different foods affect you — everyone is different.',
    disclaimer: LIFESTYLE_GLOSSARY_DISCLAIMER,
  },
  {
    id: 'exercise_moderate',
    title: 'Moderate-intensity activity',
    summary:
      'Moderate activity raises your heart rate and breathing but you can still hold a conversation — brisk walking, water aerobics, cycling on level ground.',
    whyTrack:
      'Regular activity supports heart health, mood, weight, and blood sugar. Many guidelines discuss ~150 minutes per week of moderate activity for adults — your doctor sets your target.',
    disclaimer: LIFESTYLE_GLOSSARY_DISCLAIMER,
  },
  {
    id: 'steps',
    title: 'Daily steps',
    summary:
      'Step count is a simple proxy for overall movement. Targets like 7,000–10,000 steps are common talking points but should be individualized.',
    whyTrack: 'Trends matter more than one day — a drop during illness or travel is worth noting.',
    disclaimer: LIFESTYLE_GLOSSARY_DISCLAIMER,
  },
  {
    id: 'sleep_hygiene',
    title: 'Sleep and health',
    summary:
      'Sleep affects mood, blood pressure, glucose, and medication side effects (especially psychiatric meds). Most adults need 7–9 hours, but individual needs vary.',
    whyTrack:
      'A week of poor sleep before symptom flares is a pattern worth bringing to your care team.',
    disclaimer: LIFESTYLE_GLOSSARY_DISCLAIMER,
  },
]

export function getLifestyleTopic(id: string): LifestyleTopicReference | undefined {
  return LIFESTYLE_TOPICS.find((t) => t.id === id)
}
