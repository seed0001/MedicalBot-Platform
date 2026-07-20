# Phase 2 — Tracking

**Goal:** Metrics model + manual entry UI + charts. Medications with schedules. Adherence
logging. This alone is a usable product — no AI required.

**Status:** Not started (schema and metric API exist from Phase 1)

## Deliverables

### Metrics

- Manual entry UI for all metric types (glucose, weight, BP, mood, sleep, etc.)
- Meal context selector for glucose (fasting, pre-meal, post-meal, bedtime)
- Trend charts (Recharts) over 7 / 30 / 90 days with condition-module target bands
- Metric list and edit views
- Source tagging: manual, chat extraction, device import, lab upload, questionnaire

### Medications

- Medication list CRUD (name, dose, form, schedule, prescriber, pharmacy)
- Structured schedule model (not freetext) — times, frequency, days of week
- Adherence logging: taken / skipped / late with optional reason
- Adherence history view and simple adherence rate per medication

### Appointments (app-only)

- Create, list, edit, cancel appointments
- Fields: type, provider, location, start/end time, prep notes, visit notes
- `googleEventId` column stays null until Phase 4

### Profile and conditions

- Profile editor (demographics, allergies, emergency contact, pharmacy, timezone)
- Care team management (provider name, specialty, contact, managed conditions)
- Condition assignment UI loading the correct module per diagnosis
- **Glossary links** on each condition and medication row (patient education)

### Labs, orders, and visits (starter)

- Structured lab result entry with flag vs. reference range
- "What does this mean?" panel from `reference/lab-glossary.ts`
- Care orders list (referrals, labs due, lifestyle instructions)
- Past visit notes linked to completed appointments

### Frontend

- Dashboard shell with navigation: Metrics, Medications, Appointments, Profile
- Mobile-responsive layout (Tailwind + shadcn/ui)
- Red-flag alerts surfaced inline when thresholds fire

## Exit criteria

- [ ] User can log metrics manually and see trends on charts
- [ ] User can manage medications and record adherence
- [ ] User can manage appointments without Google Calendar
- [ ] User can complete profile, care team, and condition setup
- [ ] Condition target bands visible on charts
- [ ] Product is usable day-to-day without the AI assistant

## Reference implementation

The [medbot](https://github.com/seed0001/medbot) prototype covers glucose, meds, meals,
appointments, and SVG charts in a single-page app. Use it for UX patterns; the platform
generalizes to multiple conditions and a proper metric model.

## What's explicitly out of scope

- AI chat and natural-language extraction
- Google Workspace sync
- Questionnaire engine and scheduled assessments
- Email or calendar reminders (Phase 4)
