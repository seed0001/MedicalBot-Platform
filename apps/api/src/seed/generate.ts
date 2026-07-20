/**
 * Deterministic mock-data generator.
 *
 * Everything here is derived from a fixed seed so re-running produces identical
 * data — exploring the app twice shows the same charts, which makes it possible
 * to actually reason about what you are looking at.
 *
 * The shape of the data is meant to be realistic rather than tidy: glucose
 * drifts, some doses get missed, sleep is uneven. A demo where every number is
 * perfect tells you nothing about how the app handles real life.
 */

/** Mulberry32 — small, fast, and repeatable across runs. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_DAYS = 90

export interface GeneratedMetric {
  type: string
  value: number
  valueSecondary: number | null
  unit: string
  recordedAt: Date
  source: string
  context: string | null
  note: string | null
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))
const round = (n: number, dp = 0): number => Number(n.toFixed(dp))

function at(daysAgo: number, hour: number, minute = 0, now = new Date()): Date {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d
}

/**
 * Glucose with a mild upward drift over the window and a weekly rhythm, so the
 * trend view has something to actually show. Occasional lows and highs are
 * included because those are the readings the thresholds exist for.
 */
export function generateGlucose(rng: () => number, now: Date): GeneratedMetric[] {
  const out: GeneratedMetric[] = []

  for (let day = DEMO_DAYS; day >= 0; day--) {
    const progress = (DEMO_DAYS - day) / DEMO_DAYS
    // Slow drift upward, then a partial correction in the last few weeks.
    const drift = progress < 0.7 ? progress * 18 : 12.6 - (progress - 0.7) * 20
    const weekend = [0, 6].includes(at(day, 12, 0, now).getDay()) ? 8 : 0

    const readings: Array<[number, number, string]> = [
      [7, 30, 'fasting'],
      [12, 30, 'pre_meal'],
      [14, 0, 'post_meal'],
      [21, 30, 'bedtime'],
    ]

    for (const [hour, minute, context] of readings) {
      // Skip some readings — nobody logs four times a day for three months.
      if (rng() < 0.22) continue

      const base =
        context === 'fasting'
          ? 118
          : context === 'pre_meal'
            ? 126
            : context === 'post_meal'
              ? 172
              : 138

      const noise = (rng() - 0.5) * 34
      let value = base + drift + weekend + noise

      // Rare excursions, roughly matching how often they happen in practice.
      const roll = rng()
      if (roll < 0.018) value = 58 + rng() * 12
      else if (roll > 0.985) value = 255 + rng() * 60

      out.push({
        type: 'blood_glucose',
        value: round(clamp(value, 45, 380)),
        valueSecondary: null,
        unit: 'mg/dL',
        recordedAt: at(day, hour, minute, now),
        source: rng() < 0.25 ? 'chat_extraction' : 'manual',
        context,
        note: null,
      })
    }
  }

  return out
}

export function generateVitals(rng: () => number, now: Date): GeneratedMetric[] {
  const out: GeneratedMetric[] = []
  let weight = 96.4

  for (let day = DEMO_DAYS; day >= 0; day--) {
    // Weight most mornings, gently declining with day-to-day noise.
    if (rng() < 0.7) {
      weight += (rng() - 0.62) * 0.35
      out.push({
        type: 'weight',
        value: round(clamp(weight, 80, 120), 1),
        valueSecondary: null,
        unit: 'kg',
        recordedAt: at(day, 7, 0, now),
        source: 'manual',
        context: null,
        note: null,
      })
    }

    if (day % 3 === 0) {
      out.push({
        type: 'blood_pressure',
        value: round(128 + (rng() - 0.5) * 18),
        valueSecondary: round(81 + (rng() - 0.5) * 10),
        unit: 'mmHg',
        recordedAt: at(day, 8, 15, now),
        source: 'manual',
        context: null,
        note: null,
      })
    }
  }

  // Quarterly-ish A1C draws.
  for (const daysAgo of [DEMO_DAYS, 30]) {
    out.push({
      type: 'a1c',
      value: round(daysAgo === DEMO_DAYS ? 7.8 : 7.4, 1),
      valueSecondary: null,
      unit: '%',
      recordedAt: at(daysAgo, 9, 0, now),
      source: 'lab_upload',
      context: null,
      note: null,
    })
  }

  return out
}

/**
 * Sleep, mood, and anxiety. These carry a rough week-long rough patch in the
 * middle of the window so the trend charts are not flat lines, but nothing in
 * the app interprets them — they are just recorded.
 */
export function generateSubjective(rng: () => number, now: Date): GeneratedMetric[] {
  const out: GeneratedMetric[] = []

  for (let day = DEMO_DAYS; day >= 0; day--) {
    if (rng() < 0.12) continue

    const roughPatch = day > 38 && day < 47
    const sleepBase = roughPatch ? 5.1 : 7.0
    const moodBase = roughPatch ? 4.4 : 6.6

    out.push({
      type: 'sleep_hours',
      value: round(clamp(sleepBase + (rng() - 0.5) * 2.6, 2.5, 10.5), 1),
      valueSecondary: null,
      unit: 'h',
      recordedAt: at(day, 8, 0, now),
      source: 'manual',
      context: null,
      note: null,
    })

    out.push({
      type: 'mood',
      value: round(clamp(moodBase + (rng() - 0.5) * 2.4, 1, 10)),
      valueSecondary: null,
      unit: 'score_1_10',
      recordedAt: at(day, 20, 0, now),
      source: 'manual',
      context: null,
      note: null,
    })

    if (rng() < 0.8) {
      out.push({
        type: 'anxiety',
        value: round(clamp((roughPatch ? 6.2 : 3.6) + (rng() - 0.5) * 2.6, 0, 10)),
        valueSecondary: null,
        unit: 'score_1_10',
        recordedAt: at(day, 20, 5, now),
        source: 'manual',
        context: null,
        note: null,
      })
    }
  }

  return out
}

const SIDE_EFFECTS = ['sedation', 'restlessness', 'dry_mouth', 'tremor', 'weight_gain'] as const

export function generateSideEffects(rng: () => number, now: Date): GeneratedMetric[] {
  const out: GeneratedMetric[] = []

  for (let day = DEMO_DAYS; day >= 0; day -= 2) {
    for (const effect of SIDE_EFFECTS) {
      if (rng() < 0.55) continue
      // Sedation is the standout — it is what drives the missed morning doses
      // in the adherence data, which is the pattern worth spotting.
      const base = effect === 'sedation' ? 5.6 : effect === 'dry_mouth' ? 3.8 : 2.1
      out.push({
        type: 'side_effect_severity',
        value: round(clamp(base + (rng() - 0.5) * 3.4, 0, 10)),
        valueSecondary: null,
        unit: 'score_0_10',
        recordedAt: at(day, 19, 0, now),
        source: 'manual',
        context: effect,
        note: null,
      })
    }
  }

  return out
}
