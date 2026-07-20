# Phase 1 — Foundation

**Goal:** Monorepo, Postgres schema, Google OAuth login, user profile CRUD, deploy to
Railway. Nothing smart yet — prove the pipes.

**Status:** In progress

## Deliverables

### Monorepo structure

```
apps/
  api/         Fastify API
  web/         Next.js frontend
packages/
  shared/      Domain types, Zod schemas, questionnaires
  conditions/  Condition modules (diabetes, schizophrenia)
tests/         Scoring and condition-merge tests
```

### Database

- PostgreSQL schema via Drizzle ORM with migration support
- Core tables: users, profiles, care team, conditions, metrics, medications, adherence,
  appointments, questionnaire responses, conversations, google accounts
- Sensitive columns encrypted at rest (Google refresh tokens via AES-256-GCM)

### Authentication

- Google OAuth as the sole login method
- Session-based auth with encrypted refresh token storage
- Incremental scope definitions for later Workspace integration (not requested at login)
- Endpoints: `/auth/google`, `/auth/google/callback`, `/auth/logout`, `/auth/me`

### API foundation

- Fastify with schema validation, session plugin, CORS
- Health check at `/health` reporting database, Google, and OpenRouter config status
- Config module validates env vars at startup

### Condition modules (data layer)

- `packages/conditions` — plug-in modules declaring metrics, questionnaires, and red flags
- `packages/shared` — shared types, metric normalization, questionnaire definitions
- Metric ingestion with condition-aware threshold detection on write

### AI client (no agent yet)

- Thin OpenRouter client with task-class routing (`chat`, `extract`, `analyze`)
- Model selection via env vars; fallback chain support
- Not wired to a conversational interface in this phase

### Deployment

- Railway config for `api` and `web` services
- API runs migrations on deploy; healthcheck on `/health`
- Documented env vars in `.env.example`

## Exit criteria

- [x] Monorepo builds and typechecks
- [x] Database schema migrated; core tables exist
- [x] Google OAuth login flow works end-to-end
- [x] Metric POST with red-flag checking
- [x] OpenRouter client callable (config-gated)
- [x] Deployable to Railway with Postgres + Redis
- [ ] Profile CRUD API and basic settings UI
- [ ] Intake questionnaire flow (sets `onboardedAt`)
- [ ] Care team and condition assignment endpoints

## What's explicitly out of scope

- Conversational AI / chat UI
- Charts and dashboard
- Google Calendar, Drive, Gmail, Tasks
- BullMQ worker service
- Questionnaire UI

## Reference

- [SPEC.md §3](../../SPEC.md) — stack choices
- [SPEC.md §8](../../SPEC.md) — deployment
- [README.md](../../README.md) — local setup
