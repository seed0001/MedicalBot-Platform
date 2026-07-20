import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PHQ9, scoreQuestionnaire } from '@medbot/shared'
import { mergedMetrics, mergedRedFlags, modulesFor } from '@medbot/conditions'

describe('PHQ-9 scoring', () => {
  const allZero = Object.fromEntries(PHQ9.questions.map((q) => [q.id, 0]))

  it('bands a minimal score', () => {
    const result = scoreQuestionnaire(PHQ9, allZero)
    assert.equal(result.total, 0)
    assert.equal(result.band?.label, 'Minimal')
  })

  it('bands a severe score', () => {
    const answers = Object.fromEntries(PHQ9.questions.map((q) => [q.id, 3]))
    const result = scoreQuestionnaire(PHQ9, answers)
    assert.equal(result.total, 27)
    assert.equal(result.band?.severity, 'severe')
  })

  it('flags item 9 separately from the total', () => {
    // Item 9 is part of the published instrument. This surfaces it as data on
    // the result — it does not trigger any interstitial or canned response.
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
    assert.ok(flags.some((f) => f.id === 'severe_side_effect'))
  })

  it('returns nothing for a condition with no module yet', () => {
    assert.deepEqual(modulesFor(['copd']), [])
  })
})
