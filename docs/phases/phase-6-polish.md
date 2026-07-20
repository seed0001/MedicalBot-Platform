# Phase 6 — Polish

**Goal:** Doctor-visit prep packets, data export, PWA/mobile, device integrations.

**Status:** Not started

## Deliverables

### Doctor-visit prep packets

Auto-generated summary of the last 90 days to hand a clinician:

- Metric trends with target-band compliance (time in range for glucose, etc.)
- Medication list with adherence rates
- Questionnaire score trends (PHQ-9, GAD-7, etc.)
- Red-flag events and how they were resolved
- Open questions the user wants to raise

Output formats:

- Printable HTML (print → save as PDF)
- CSV exports per data table
- Saved to Google Drive (Phase 4) or downloadable

Modeled on [medbot/src/report.js](https://github.com/seed0001/medbot/blob/main/src/report.js).

### Data export and deletion

- Full data export on request (JSON + CSV bundle)
- Hard delete of all user data including Google tokens, Drive files, and Calendar events
  the app created
- Explicit consent screen covering what leaves the system and where it goes

### PWA / mobile

- Progressive Web App with offline-capable shell
- Capacitor wrapper for Android (and optionally iOS)
- Voice input via speech recognition (medbot's Capacitor integration is the reference)
- Push notifications for reminders (Calendar alarms as primary; push as supplement)

### Device integrations (optional / stretch)

- Apple Health / Google Fit import
- Dexcom / Libre CGM API
- Smart scale and BP cuff integrations via standard health data APIs

Prioritize based on user hardware; none are required for a shippable v1.

### Performance and reliability

- API response time budgets for chat turns
- Worker job retry and dead-letter handling
- Staging environment mirroring production (never test against real health data)
- Load testing on metric ingestion and chat endpoints

### Admin and operations

- Structured logging with PHI redaction (already in Fastify logger config)
- Error monitoring integration
- Database backup verification
- Runbook for token rotation, key rotation, and incident response

## Exit criteria

- [ ] Visit prep packet generates correctly for a 90-day window
- [ ] CSV and PDF export work for all core data tables
- [ ] Full export and hard-delete complete successfully
- [ ] PWA installable on mobile with basic offline support
- [ ] Voice input works for metric logging on Android
- [ ] At least one device import path functional (stretch)

## What's explicitly out of scope for v1

- Multi-user / provider portal (see open decisions in SPEC.md §11)
- HIPAA BAA compliance (decide product direction first)
- Insurance or billing integration
- Telehealth or video visit scheduling

## Reference

- [SPEC.md §7](../../SPEC.md) — external medical data sources
- [SPEC.md §9](../../SPEC.md) — safety, privacy, compliance
- [medbot](https://github.com/seed0001/medbot) — report generation, Capacitor Android app,
  voice UX
