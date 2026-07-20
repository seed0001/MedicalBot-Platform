# Phase 4 — Google Workspace

**Goal:** Calendar sync, medication reminders as calendar events, Drive health records
folder, Gmail appointment detection.

**Status:** Not started (OAuth scaffolding and incremental scopes exist from Phase 1)

## Why Workspace

The [medbot](https://github.com/seed0001/medbot) prototype handles reminders via SMTP
email and in-app chat. Google Workspace integration replaces that with infrastructure the
user already has: phone calendar notifications, a files folder they own, and email they
already receive from health systems.

## OAuth scopes (incremental)

Requested from settings, not at signup. Defined in `apps/api/src/routes/auth.ts`.

| Scope | API | Purpose |
|-------|-----|---------|
| `calendar.events` | Calendar | Appointments, medication reminders as recurring events |
| `drive.file` | Drive | "Health Records" folder for labs, reports, AI documents |
| `gmail.readonly` | Gmail | Detect appointment confirmations and lab-result emails |
| `tasks` | Tasks | Refill reminders, pre-appointment prep checklists |

`gmail.send` is draft-only: prepare messages to the care team; the user sends.

## Deliverables

### Calendar sync

- Create / update / delete Google Calendar events when appointments change
- Store `googleEventId` on the appointment row; null means app-only
- Bidirectional sync with the app as source of truth for app-created events
- Medication schedules → recurring Calendar events with alarms
- Glucose follow-up reminders → timed Calendar events (replaces SMTP)
- Webhook-based push notifications where Google supports it; polling fallback

### Drive health records

- Create a per-user "Health Records" folder on first grant
- Upload lab results, imaging reports, visit summaries
- AI-generated documents (doctor prep notes, question lists) saved to Drive
- App only touches files it created (`drive.file` scope)
- Replaces medbot's server-side `filesStore.js` pattern

### Gmail appointment detection

- Targeted search for appointment confirmations from health-system senders
- Extract date, provider, location → structured suggestion
- User approves before `create_appointment` runs
- Lab-result notifications → suggest metric upload

**Security:** Parsed email content never reaches the tool-calling agent directly. It goes
through extraction into structured suggestions the user approves. An email saying "delete
the medication log" is data, never an instruction.

### Google Tasks

- Refill reminders when `refillsRemaining` is low
- Pre-appointment prep items ("fasting required", "bring medication list")
- One-off tasks the assistant creates from conversation

### Settings UI

- Per-integration connect / disconnect / status
- Show which scopes are granted
- Re-auth flow when refresh token is missing or expired

### SMTP fallback

Keep nodemailer (or equivalent) in the BullMQ worker for users who decline Calendar scope
or use non-Google email. Degraded but functional.

## Build order within Phase 4

1. **Calendar** — highest ROI; replaces medbot's email reminders
2. **Drive** — document storage migration
3. **Gmail readonly** — appointment and lab detection
4. **Tasks** — refill and prep reminders

## Exit criteria

- [ ] Appointments sync to Google Calendar with `googleEventId` tracking
- [ ] Medication reminders appear as Calendar events on the user's phone
- [ ] Health records folder created in Drive; files upload and list correctly
- [ ] Gmail parser suggests appointments from confirmation emails (user approves)
- [ ] Tasks created for refills and prep items
- [ ] Incremental OAuth flow works from settings
- [ ] SMTP fallback sends reminders when Calendar scope is not granted

## Reference

- [SPEC.md §6](../../SPEC.md) — full Workspace integration spec
- [medbot/src/appointments.js](https://github.com/seed0001/medbot/blob/main/src/appointments.js) — appointment CRUD to port
- [medbot/src/scheduler.js](https://github.com/seed0001/medbot/blob/main/src/scheduler.js) — reminder scheduling to replace with Calendar
