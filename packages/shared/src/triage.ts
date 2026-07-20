/**
 * Emergency triage.
 *
 * This runs on every inbound message BEFORE the conversational model sees it.
 * The deterministic matcher below is the floor, not the ceiling: a small
 * classifier model runs alongside it (see apps/api/src/ai/triage.ts) to catch
 * phrasing the keywords miss. Either one firing routes to a fixed response.
 *
 * Design rule: when this fires, the language model does not get to improvise.
 * The user gets hardcoded text with real phone numbers in it.
 */

export const EMERGENCY_CATEGORIES = [
  'cardiac',
  'stroke',
  'self_harm',
  'severe_hypoglycemia',
  'dka',
  'psychiatric_crisis',
  'anaphylaxis',
  'overdose',
] as const
export type EmergencyCategory = (typeof EMERGENCY_CATEGORIES)[number]

export interface TriageResult {
  isEmergency: boolean
  category: EmergencyCategory | null
  matched: string[]
  response: string | null
}

const PATTERNS: ReadonlyArray<readonly [EmergencyCategory, RegExp]> = [
  ['cardiac', /\b(chest\s+(is\s+|feels\s+)?(pain|pressure|tightness|tight|hurts|hurting)|crushing chest|heart attack|left arm.{0,20}(pain|numb))/i],
  ['stroke', /\b(face\s+(is\s+|started\s+)?(droop|drooping|numb)|slurred speech|slurring|sudden (numbness|weakness).{0,30}(one side|arm|leg)|can'?t (speak|move).{0,20}(arm|leg|side)|having a stroke)/i],
  ['self_harm', /\b(kill myself|suicidal|suicide|end my life|want to die|hurt myself|self.?harm|not want(ing)? to (be here|live)|better off dead)/i],
  // The digit branch deliberately excludes durations — "sugar 30 minutes after
  // eating" is routine logging, not a hypo report.
  ['severe_hypoglycemia', /\b(blood sugar\D{0,10}\b[0-5]?\d\b(?!\s*(min|hour|hr|day|week|month|unit|g\b|gram|carb|mg))|sugar\s+(is\s+|at\s+|was\s+)?[0-5]?\d\b(?!\s*(min|hour|hr|day|week|month|unit|g\b|gram|carb|mg))|severe(ly)? (low|hypo)|passing out.{0,20}sugar|glucagon)/i],
  ['dka', /\b(ketones?|fruity breath|dka|diabetic ketoacidosis|vomiting.{0,30}(high (sugar|blood sugar))|sugar.{0,15}(over|above) ?[45]\d\d)\b/i],
  ['psychiatric_crisis', /\b(voices? (telling|are telling) me|command hallucination|hearing voices.{0,30}(hurt|kill)|psychotic break|can'?t tell what'?s real)\b/i],
  // Linking verbs are optional throughout: users write "throat is closing" as
  // often as "throat closing".
  ['anaphylaxis', /\b(throat\s+(is\s+|feels\s+|started\s+)?(closing|swelling|tight)|can'?t breathe|trouble breathing|anaphyla|epi.?pen|face.{0,15}swelling.{0,20}(hives|rash))/i],
  ['overdose', /\b(overdose|took too (many|much)|od'?d|swallowed.{0,20}(pills|bottle))\b/i],
]

const EMERGENCY_HEADER =
  'This sounds like it could be a medical emergency. I am not able to help with this, and I do not want you to wait on me.'

const RESPONSES: Record<EmergencyCategory, string> = {
  cardiac: `${EMERGENCY_HEADER}\n\n**Call 911 now** (or your local emergency number). Chest pain can be a heart attack, and minutes matter. Do not drive yourself.`,
  stroke: `${EMERGENCY_HEADER}\n\n**Call 911 now.** Face drooping, arm weakness, or speech trouble are stroke signs, and stroke treatment is time-limited. Note what time symptoms started — the hospital will ask.`,
  self_harm: `I hear you, and I am glad you said something. I am not equipped to be your support here, but people are.\n\n**Call or text 988** (Suicide & Crisis Lifeline, US) — 24/7, free.\n**Text HOME to 741741** (Crisis Text Line).\n**Call 911** if you are in immediate danger.\n\nOutside the US: findahelpline.com`,
  severe_hypoglycemia: `${EMERGENCY_HEADER}\n\nIf your blood sugar is severely low: **take 15g of fast-acting sugar now** — juice, regular soda, or glucose tabs — and re-check in 15 minutes.\n\n**Call 911** if you are confused, cannot keep sugar down, or someone is having a seizure or is unresponsive. If you have glucagon and someone is with you, this is what it is for.`,
  dka: `${EMERGENCY_HEADER}\n\nHigh blood sugar with ketones, vomiting, or fruity breath can be **diabetic ketoacidosis**, which is life-threatening and gets worse fast.\n\n**Call your doctor immediately, or go to the ER.** Call 911 if you are vomiting repeatedly or having trouble breathing.`,
  psychiatric_crisis: `I want to make sure you get real support right now, and that is not something I can be.\n\n**Call or text 988** (Suicide & Crisis Lifeline, US) — they handle psychiatric crises, not just suicide.\n**Call your psychiatrist or crisis team** if you have one.\n**Call 911** if you or someone else is in danger.`,
  anaphylaxis: `${EMERGENCY_HEADER}\n\n**Use your epinephrine auto-injector if you have one, then call 911.** Call 911 even if the injector helps — symptoms can return.`,
  overdose: `${EMERGENCY_HEADER}\n\n**Call 911 now.**\n**Poison Control (US): 1-800-222-1222** — free, 24/7, and they will tell you exactly what to do.\n\nDo not wait to see if symptoms develop.`,
}

const NO_EMERGENCY: TriageResult = {
  isEmergency: false,
  category: null,
  matched: [],
  response: null,
}

/**
 * Keyword-based emergency screen. Deliberately tuned to over-trigger: a false
 * positive costs the user one dismissible message, a false negative costs more.
 */
export function screenForEmergency(message: string): TriageResult {
  const matched: string[] = []
  let category: EmergencyCategory | null = null

  for (const [cat, pattern] of PATTERNS) {
    const hit = pattern.exec(message)
    if (hit) {
      matched.push(hit[0])
      // First match wins; PATTERNS is ordered by time-criticality.
      category ??= cat
    }
  }

  if (!category) return NO_EMERGENCY
  return { isEmergency: true, category, matched, response: RESPONSES[category] }
}

/**
 * Topics the assistant must not produce output on, regardless of how the user
 * phrases the request. Checked against drafted responses, not just inputs.
 */
export const OUT_OF_SCOPE_GUIDANCE = `You surface data and patterns. You do not diagnose, \
do not recommend or adjust doses, do not tell the user to start or stop a medication, and \
do not interpret results as a clinician would. When the user asks for any of those, say \
plainly that it is a question for their prescriber, then offer what you CAN do: pull the \
relevant trend, draft the question for their next visit, or check when they last saw that \
provider.`
