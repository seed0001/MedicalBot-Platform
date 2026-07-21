import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PHQ9, enrichLabResult, parseReferenceRange, scoreQuestionnaire } from '@medbot/shared'
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

describe('lab import (BMP template)', () => {
  it('parses portal reference ranges', () => {
    const sodium = parseReferenceRange('135 - 146 mmol/L')
    assert.equal(sodium?.low, 135)
    assert.equal(sodium?.high, 146)
    assert.equal(sodium?.unit, 'mmol/L')

    const creatinine = parseReferenceRange('0.60 - 1.30 mg/dL')
    assert.equal(creatinine?.low, 0.6)
    assert.equal(creatinine?.high, 1.3)
  })

  it('enriches BMP rows with LOINC and flags', () => {
    const row = enrichLabResult({
      testName: 'Urea Nitrogen',
      value: '37',
      referenceText: '7 - 22 mg/dL',
      panelName: 'Basic Metabolic Panel',
      collectedAt: '2026-04-21',
    })
    assert.equal(row.loinc, '3094-0')
    assert.equal(row.flag, 'high')
    assert.equal(row.referenceLow, 7)
    assert.equal(row.referenceHigh, 22)
    assert.equal(row.unit, 'mg/dL')
  })

  it('handles qualitative GFR comment rows', () => {
    const row = enrichLabResult({
      testName: 'GFR Additional Information',
      value: 'See Comment',
      referenceText: 'See GFR Additional Information',
      panelName: 'Basic Metabolic Panel',
      collectedAt: '2026-07-14',
    })
    assert.equal(row.flag, 'abnormal')
    assert.equal(row.note, 'See comment on lab report')
  })
})
