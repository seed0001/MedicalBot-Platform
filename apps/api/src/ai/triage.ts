import { screenForEmergency, type TriageResult } from '@medbot/shared'
import { openRouterConfigured } from '../config.js'
import { complete } from './openrouter.js'

/**
 * Two-layer emergency screen. The keyword matcher in @medbot/shared is the
 * floor and always runs; the classifier catches phrasing keywords miss
 * ("I don't think I can keep going"). Either firing routes to a fixed response.
 *
 * The classifier is best-effort: if OpenRouter is down or slow, the keyword
 * result stands rather than blocking the user's message.
 */

const CLASSIFIER_PROMPT = `You classify inbound messages to a personal health assistant \
for medical or psychiatric emergencies. Respond with JSON only.

Emergency categories: cardiac, stroke, self_harm, severe_hypoglycemia, dka, \
psychiatric_crisis, anaphylaxis, overdose.

Set "emergency": true only when the message suggests the person needs help NOW — active \
symptoms, active intent, or a dangerous reading. Someone describing a past event, asking a \
general question, or logging a routine value is NOT an emergency.

Err toward flagging when genuinely uncertain about self-harm.`

const TIMEOUT_MS = 4000

const SCHEMA = {
  type: 'object',
  properties: {
    emergency: { type: 'boolean' },
    category: { type: ['string', 'null'] },
    reason: { type: 'string' },
  },
  required: ['emergency', 'category', 'reason'],
  additionalProperties: false,
} as const

export async function triageMessage(message: string): Promise<TriageResult> {
  const keywordResult = screenForEmergency(message)
  if (keywordResult.isEmergency) return keywordResult
  if (!openRouterConfigured) return keywordResult

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const result = await complete({
      task: 'triage',
      messages: [
        { role: 'system', content: CLASSIFIER_PROMPT },
        { role: 'user', content: message },
      ],
      maxTokens: 200,
      jsonSchema: { name: 'triage', schema: SCHEMA as unknown as Record<string, unknown> },
      signal: controller.signal,
    })

    const parsed = JSON.parse(result.content) as { emergency?: boolean; category?: string | null }
    if (!parsed.emergency || !parsed.category) return keywordResult

    // Re-run the keyword responses through the category the classifier picked so
    // the user always gets the vetted hardcoded text, never model-authored
    // emergency instructions.
    const canned = screenForEmergency(SYNTHETIC_PROBES[parsed.category] ?? '')
    if (canned.isEmergency) return { ...canned, matched: ['classifier'] }
    return keywordResult
  } catch {
    // Timeout, parse failure, or provider error — the keyword floor stands.
    return keywordResult
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Maps a classifier category back to the vetted response by feeding the keyword
 * matcher a phrase known to hit that branch. Keeps exactly one source of truth
 * for emergency copy.
 */
const SYNTHETIC_PROBES: Record<string, string> = {
  cardiac: 'chest pain',
  stroke: 'face drooping',
  self_harm: 'suicidal',
  severe_hypoglycemia: 'severe low',
  dka: 'ketones',
  psychiatric_crisis: 'voices telling me',
  anaphylaxis: 'throat closing',
  overdose: 'overdose',
}
