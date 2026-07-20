# Phase 5 — Intelligence

**Goal:** Questionnaire engine, standardized instruments, scheduled check-ins, weekly
digest, trend analysis, condition modules with red-flag thresholds.

**Status:** Not started (questionnaire definitions and red-flag logic exist in packages;
engine and UI do not)

## Deliverables

### Questionnaire engine

A generic engine, not hardcoded forms. A questionnaire is a JSON definition:

- Questions with types: scale, multi-choice, free text, numeric
- Branching logic and scoring rules
- Interpretation bands (e.g. PHQ-9 mild / moderate / severe)

Definitions live in `packages/shared/src/questionnaires.ts`. Responses stored in
`questionnaire_responses`; scores also written as metrics so they trend on charts.

### Standardized instruments

Scheduled by condition module:

| Instrument | Condition | Frequency |
|------------|-----------|-----------|
| PHQ-9 | Depression / anxiety | Biweekly |
| GAD-7 | Anxiety | Biweekly |
| AUDIT-C | Alcohol | Quarterly |
| Diabetes distress scale | Diabetes | Monthly |
| Med adherence (ARMS) | All with meds | Monthly |
| Side-effect checklist (GASS) | Antipsychotics | Monthly |
| Sleep quality | Schizophrenia, general | Weekly |

### Intake questionnaire

- Once at signup (~15 min, resumable)
- Demographics, conditions, meds, allergies, family history, lifestyle, care team
- Output: initial profile; sets `onboardedAt`
- Gates the rest of the app until complete

### Adaptive check-ins

- Short conversational daily/weekly prompts generated from condition modules
- Not a fixed script — content adapts to recent metrics and adherence patterns
- Delivered via the Phase 3 assistant

### Weekly digest

- Background job (`MODEL_ANALYZE`) summarizing the past 7 days
- Trends, adherence rates, questionnaire score changes, red-flag occurrences
- Delivered in-app and optionally via email or Calendar event

### Trend analysis

- Cross-metric pattern detection (e.g. PHQ-9 climbing from 6 to 14 over six weeks)
- Condition-module red flags with occurrence counting over time windows
- Proactive surfacing when bands worsen — not generic referrals, specific actionable content

### Red-flag system (full)

Phase 1 checks single-reading thresholds on write. Phase 5 adds:

- Multi-reading rules (e.g. 3 hypos in 7 days)
- Questionnaire band triggers (e.g. PHQ-9 ≥ 15)
- Scheduled re-evaluation jobs over rolling windows
- Alert history and acknowledgment

## Exit criteria

- [ ] Intake questionnaire completes and gates the app
- [ ] At least PHQ-9 and diabetes distress instruments schedulable and scorable
- [ ] Scores stored as metrics and visible on charts
- [ ] Weekly digest job runs and delivers a summary
- [ ] Adaptive check-ins generated from active condition modules
- [ ] Multi-reading red flags fire correctly (tested)
- [ ] Questionnaire critical-item triggers surface immediately

## Reference

- [SPEC.md §5](../../SPEC.md) — questionnaire engine design
- [packages/shared/src/questionnaires.ts](../../packages/shared/src/questionnaires.ts) — definitions
- [packages/conditions/](../../packages/conditions/) — per-condition scheduling and red flags
- [tests/domain.test.ts](../../tests/domain.test.ts) — scoring and merge tests
