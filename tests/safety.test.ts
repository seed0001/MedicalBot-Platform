import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PHQ9, scoreQuestionnaire, screenForEmergency } from '@medbot/shared'
import { mergedMetrics, mergedRedFlags, modulesFor } from '@medbot/conditions'

/**
 * These cover the paths where a bug is a safety problem rather than a bug:
 * emergency detection, PHQ-9 critical-item escalation, and the target-band
 * merge for users with more than one condition.
 */

describe('emergency screening', () => {
  const shouldFire: Array<[string, string]> = [
    ['cardiac', 'I have crushing chest pain right now'],
    // Linking verbs used to slip past these; keep both phrasings covered.
    ['cardiac', 'my chest is tight and my left arm is numb'],
    ['cardiac', 'my chest hurts really bad'],
    ['stroke', 'my face is drooping'],
    ['stroke', 'my face is drooping and I have slurred speech'],
    ['severe_hypoglycemia', 'my blood sugar is 48'],
    ['severe_hypoglycemia', 'sugar was 51 and I feel shaky'],
    ['self_harm', 'I want to kill myself'],
    ['self_harm', 'lately I just do not want to live'],
    ['dka', 'throwing up and my ketones are high'],
    ['anaphylaxis', 'my throat is closing after eating peanuts'],
    ['overdose', 'I think I took too many pills'],
    ['psychiatric_crisis', 'the voices are telling me to hurt someone'],
  ]

  for (const [expected, message] of shouldFire) {
    it(`flags ${expected}: "${message}"`, () => {
      const result = screenForEmergency(message)
      assert.equal(result.isEmergency, true)
      assert.equal(result.category, expected)
      assert.ok(result.response && result.response.length > 0)
    })
  }

  const shouldNotFire = [
    'my blood sugar was 142 before dinner',
    'I weighed in at 185 this morning',
    'took my metformin at 8am',
    'can you show me my glucose trend for the last two weeks',
    'I had a headache yesterday but it went away',
    // Durations and carb counts share the shape of a low reading.
    'I check my sugar 30 minutes after eating',
    'I ate 45 grams of carbs at lunch',
    'I walked for 20 minutes today',
  ]

  for (const message of shouldNotFire) {
    it(`stays quiet on routine logging: "${message}"`, () => {
      const result = screenForEmergency(message)
      assert.equal(result.isEmergency, false)
      assert.equal(result.response, null)
    })
  }

  it('gives real crisis numbers in the self-harm response', () => {
    const result = screenForEmergency('I am suicidal')
    assert.match(result.response!, /988/)
    assert.match(result.response!, /741741/)
  })

  it('prefers the more time-critical category when several match', () => {
    // Cardiac is ordered ahead of overdose in PATTERNS.
    const result = screenForEmergency('chest pain after I took too many pills')
    assert.equal(result.category, 'cardiac')
  })
})

describe('PHQ-9 scoring', () => {
  const allZero = Object.fromEntries(PHQ9.questions.map((q) => [q.id, 0]))

  it('bands a minimal score', () => {
    const result = scoreQuestionnaire(PHQ9, allZero)
    assert.equal(result.total, 0)
    assert.equal(result.band?.label, 'Minimal')
    assert.deepEqual(result.criticalTriggered, [])
  })

  it('bands a severe score', () => {
    const answers = Object.fromEntries(PHQ9.questions.map((q) => [q.id, 3]))
    const result = scoreQuestionnaire(PHQ9, answers)
    assert.equal(result.total, 27)
    assert.equal(result.band?.severity, 'severe')
  })

  it('escalates on item 9 even when the total is minimal', () => {
    // This is the case that matters: a low overall score can still contain a
    // self-harm answer, and the total alone would hide it.
    const result = scoreQuestionnaire(PHQ9, { ...allZero, q9: 1 })
    assert.equal(result.total, 1)
    assert.equal(result.band?.label, 'Minimal')
    assert.deepEqual(result.criticalTriggered, ['q9'])
  })
})

describe('condition module merging', () => {
  const modules = modulesFor(['diabetes_t2', 'schizophrenia'])

  it('loads both modules', () => {
    assert.equal(modules.length, 2)
  })

  it('takes the stricter glucose ceiling across conditions', () => {
    // Diabetes allows up to 180; the schizophrenia metabolic watch caps at 140.
    const glucose = mergedMetrics(modules).find((m) => m.type === 'blood_glucose')
    assert.equal(glucose?.targetMax, 140)
    assert.equal(glucose?.targetMin, 80)
  })

  it('keeps the higher prompt frequency', () => {
    const glucose = mergedMetrics(modules).find((m) => m.type === 'blood_glucose')
    assert.equal(glucose?.dailyPrompts, 2)
  })

  it('preserves red flags from both modules', () => {
    const flags = mergedRedFlags(modules)
    assert.ok(flags.some((f) => f.id === 'severe_hypo'))
    assert.ok(flags.some((f) => f.id === 'sleep_collapse'))
  })

  it('returns nothing for a condition with no module yet', () => {
    assert.deepEqual(modulesFor(['copd']), [])
  })
})
