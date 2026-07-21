# MedicalBot — Application UI Map

The full front-end application: what every screen is, what it does, and the API behind it.
The app is a Next.js App Router project exported as static files and served by the API on one
origin. Every page is a client component that fetches at runtime.

## Navigation & shell

A sticky top bar (`Nav`) is shown on every signed-in page (hidden on the marketing, legal, and
intake screens). It carries the section links, a global **+ Log** quick action (opens the metric
logger from anywhere), and **Sign out**. It collapses to a menu on small screens.

Cross-cutting pieces:

- **AppGate** wraps every signed-in page — one place that handles loading, "not signed in", and
  the soft onboarding gate (a user without `onboardedAt` is redirected to intake).
- **Toast** notifications confirm saves app-wide.
- **Modal** backs every add/edit flow.
- **MetricEntryForm** is the shared logger used by the nav, the dashboard, and the metrics page.

## Screens

### 1. Landing & auth (`/`)
Marketing page + Google sign-in with the Terms pre-consent flow. Unauthenticated entry point.

### 2. Onboarding / intake (`/onboarding`)
Minimal signup intake: confirm name, optional DOB/sex, and pick at least one condition. Stamps
`onboardedAt`. Soft-gates the rest of the app. (Built earlier.)

### 3. Dashboard (`/dashboard`)
The landing view after sign-in. Greeting, a **quick-actions** row (log a reading, take an
assessment, medications, appointments, assistant), last-7-days metric tiles, 30-day adherence,
and upcoming appointments. **+ Log reading** opens the logger inline and refetches.
API: `GET /api/dashboard`, `POST /api/metrics`.

### 4. Assistant (`/assistant`)
Persona-driven chat interface. Choose from five personas (persisted to `localStorage`, shared
with Settings). The conversational AI backend is Phase 3, so the chat is a clearly-labeled
preview that stays honest and points to what works today. Shell is production-quality.
Data: `@medbot/shared` personas.

### 5. Metrics (`/metrics`)
Per-metric trend chart with a target band merged from the user's conditions, a range switcher
(7/30/90 days), and the full readings table. **+ Log reading** adds data and refetches.
API: `GET /api/metrics`, `POST /api/metrics`.

### 6. Medications (`/medications`)
Cards per medication with 30-day adherence, schedule, refills, and prescriber. **+ Add
medication** (structured schedule builder). Per-card one-tap dose logging (Taken / Late /
Skipped) and mark-inactive.
API: `GET /api/medications`, `POST /api/medications`, `PATCH /api/medications/:id`,
`POST /api/medications/:id/adherence`.

### 7. Assessments (`/assessments`)
The questionnaire engine surfaced. **Take** a standardized instrument (PHQ-9, GAD-7) — one
question per block, progress bar, and an immediate scored result with its severity band. Scores
are stored as metrics, so **History** trends them on a chart alongside everything else.
API: `GET /api/assessments/catalog`, `GET /api/assessments/:key`, `POST /api/assessments`,
`GET /api/questionnaires`.

### 8. Conditions (`/conditions`)
Each active condition, its module (tracked metrics, red-flag thresholds, watch-for trends), and
patient-education content from the condition glossary. **+ Add condition** and remove.
API: `GET /api/conditions`, `POST /api/conditions`, `DELETE /api/conditions/:key`.

### 9. Appointments (`/appointments`)
Upcoming and past visits. **+ Add appointment**, and post-visit notes editing on past ones.
Calendar sync is a later phase and labeled as such.
API: `GET /api/appointments`, `POST /api/appointments`, `PATCH /api/appointments/:id`.

### 10. Records (`/records`)
A read-only health summary / doctor-visit prep view aggregating profile, active conditions,
current medications, recent labs, and care team — with a print/PDF button.
API: `GET /api/profile`, `/api/conditions`, `/api/medications`, `/api/metrics?type=lab_value`.

### 11. Profile (`/profile`)
View and edit the medical profile (demographics, height, pharmacy, emergency contact), manage
allergies as chips, and manage the care team (add/remove providers).
API: `GET /api/profile`, `PATCH /api/profile`, `POST /api/care-team`, `DELETE /api/care-team/:id`.

### 12. Settings (`/settings`)
Preferences (time zone, assistant persona) plus the demo-mode controls (regenerate mock data,
master reset) when `DEMO_MODE` is on.
API: `PATCH /api/profile`, demo endpoints.

### 13. Legal (`/terms`, `/privacy`)
Terms of Use and privacy notice, rendered bare.

## Write API surface added for this UI

`PATCH /api/profile`, care-team `POST`/`DELETE`, conditions `POST`/`DELETE`, medications `POST`/
`PATCH` + adherence `POST`, appointments `POST`/`PATCH`, assessments catalog/definition/`POST`
(scored, and mirrored into a `questionnaire_score` metric). All scoped to the session user.

## Boundaries kept in the UI

Tracks and surfaces patterns; never diagnoses, prescribes, or changes doses. No message
screening. Google Workspace sync and the live assistant are labeled as later phases rather than
implied to work today.
