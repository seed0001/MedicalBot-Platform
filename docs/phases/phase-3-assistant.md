# Phase 3 — Assistant

**Goal:** OpenRouter integration, tool-calling agent, natural-language metric extraction,
context assembly. The chat becomes the primary interface.

**Status:** Not started (OpenRouter client exists from Phase 1)

## Deliverables

### Tool-calling agent

A tool-using agent, not a chat box. Write tools confirm with the user before committing.

| Tool | Purpose |
|------|---------|
| `log_metric` | Record a health observation from conversation |
| `log_medication_taken` | Record adherence event |
| `get_metric_history` | Query recent metrics for context |
| `get_medication_schedule` | Return current regimen |
| `create_appointment` | Add an appointment (app-only until Phase 4) |
| `list_upcoming_appointments` | Return upcoming visits |
| `start_questionnaire` | Begin a scheduled assessment (Phase 5 engine) |
| `get_profile_summary` | Assemble profile + conditions + meds |
| `update_profile` | Update profile fields |
| `search_health_notes` | Vector search over conversation history |
| `draft_message_to_provider` | Draft only — never sends |
| `lookup_condition_info` | Glossary entry for a condition |
| `lookup_medication_info` | Glossary entry for a prescription |
| `explain_lab_result` | What a test measures, flag, typical ranges |
| `add_lab_result` | Store structured lab result (confirm first) |
| `add_care_order` | Record a doctor's order |
| `add_care_visit` | Summarize a completed visit |
| `add_procedure` | Record surgery or procedure |
| `list_care_orders` | Active orders with due dates |

**Deliberately absent:** `change_medication_dose`. The assistant never alters prescriptions.

### Model routing

| Task class | Model env var | Use |
|------------|-------------|-----|
| Conversation | `MODEL_CHAT` | Check-ins, general chat — quality matters |
| Extraction | `MODEL_EXTRACT` | Parse "sugar was 142 before dinner" into a row |
| Analysis | `MODEL_ANALYZE` | Trend summaries, digests — runs in jobs |

Fallback chain per class so a provider outage degrades instead of breaking.

### Context construction

Every conversation turn assembles: profile summary + active conditions + current meds +
active care orders + upcoming appointments/procedures + recent lab results (with flags) +
last 7 days of relevant metrics + open questionnaire state + recent conversation.
Older history goes into a vector index (`pgvector`) and is retrieved on demand rather
than stuffed into every prompt.

See [HEALTH-RECORD.md](../product/HEALTH-RECORD.md) for all domains and glossary tools.

### Memory (optional in this phase)

Three layers, modeled on the medbot prototype:

- **Short-term** — recent message window
- **Long-term** — lasting facts (allergies, doctors, preferences)
- **Episodic** — summaries of aged-out conversation stretches

### Assistant persona

Not a generic companion — the user picks who they're talking to:

- **Five presets** in `packages/shared/src/personas.ts` (Maya, Jordan, Sam, Dorothy, Alex)
- **Customize** — short free-text tweaks on top of a preset (address, formality, length)
- **Create your own** — full custom instructions (max 2,000 chars)
- Stored on profile as `personaId` + optional `personaCustom`
- Persona shapes tone only; safety rules and tool allowlist are fixed

See [ASSISTANT-PERSONAS.md](../product/ASSISTANT-PERSONAS.md).

### Chat UI

- Primary interface in the web app
- Message history persisted to `conversations` table
- Tool call results shown as confirmations ("Logged 142 mg/dL, pre-meal")
- Voice input support (stretch — medbot's Capacitor integration is the reference)

### Scheduler integration

- BullMQ worker for deferred jobs (reminder scheduling, digest generation)
- Glucose follow-up reminders (modeled on medbot's 2-hour re-check pattern)
- Recurring reminders via chat message injection

## Exit criteria

- [ ] User can log metrics, meds, and appointments through natural language
- [ ] Extraction uses `MODEL_EXTRACT` with forced JSON schema
- [ ] Write tools confirm before committing
- [ ] Context includes profile, conditions, meds, and recent metrics
- [ ] Conversation history persists across sessions
- [ ] No dose-change or diagnosis tools exist in the allowlist
- [ ] System prompt includes per-condition guardrails from active modules

## Reference implementation

[medbot/src/ai.js](https://github.com/seed0001/medbot/blob/main/src/ai.js) — tool
definitions, system prompt, safety rules, and multi-round tool calling. Port the patterns,
not the code.

## What's explicitly out of scope

- Google Calendar / Drive / Gmail (Phase 4)
- Questionnaire engine UI (Phase 5)
- Doctor visit prep packets (Phase 6)
