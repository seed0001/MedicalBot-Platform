# Build Phases Overview

Six phases, each building on the last. Phases are ordered so that every step produces
something usable on its own.

```
Phase 1  Foundation     ──►  pipes, auth, schema, deploy
         │
Phase 2  Tracking       ──►  manual entry, charts, meds — usable without AI
         │
Phase 3  Assistant      ──►  chat becomes the primary interface
         │
Phase 4  Workspace      ──►  Calendar, Drive, Gmail, Tasks
         │
Phase 5  Intelligence   ──►  questionnaires, digests, condition red flags
         │
Phase 6  Polish         ──►  visit prep, export, mobile, devices
```

## Phase summary

| # | Name | Goal | Depends on |
|---|------|------|------------|
| 1 | [Foundation](phase-1-foundation.md) | Prove the pipes | — |
| 2 | [Tracking](phase-2-tracking.md) | Usable health log | Phase 1 |
| 3 | [Assistant](phase-3-assistant.md) | Natural-language interface | Phase 2 |
| 4 | [Workspace](phase-4-workspace.md) | Google Calendar, Drive, Gmail | Phase 1 (OAuth); best after Phase 3 |
| 5 | [Intelligence](phase-5-intelligence.md) | Scheduled assessments and trends | Phases 2–3 |
| 6 | [Polish](phase-6-polish.md) | Clinician handoff and mobile | Phases 2–5 |

## Principles (all phases)

- **No diagnosis, no prescribing, no dose changes.** Enforced in code via tool allowlists
  and condition-module guardrails — not just disclaimers.
- **Condition thresholds fire on recorded data**, not on message text. A glucose reading
  of 48 triggers a specific, actionable alert because the user chose to track glucose.
- **Gmail content is untrusted input.** Parsed email never reaches the tool-calling agent
  directly; it becomes structured suggestions the user approves.
- **Google OAuth scopes are incremental.** Login asks only for identity; Calendar, Drive,
  Gmail, and Tasks are granted later from settings.

## Open decisions

These affect multiple phases. Resolve before building past Phase 2.

1. **Single-user or multi-user?** Drives HIPAA posture, hosting, and model routing.
2. **Launch condition modules?** Diabetes and schizophrenia are in place; both exercise
   opposite ends of the design (numeric data vs. adherence and subjective state).
3. **Shared read access?** Cheaper to design for now than bolt on later.
4. **Offline entry?** Blood sugar gets logged without signal.

See [SPEC.md §11](../../SPEC.md) for full context.
