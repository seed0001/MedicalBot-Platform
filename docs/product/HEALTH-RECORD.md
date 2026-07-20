# Health Record — What Amy Knows

Amy (or whichever persona the user chooses) maintains a **structured health record** —
not just chat memory. Every domain below is stored in the database, surfaced in the UI,
and available to the assistant through tools and context assembly.

**Educational glossaries** explain conditions, medications, and lab tests in plain
language. The assistant uses these to answer "what does this mean?" without diagnosing.

---

## Data domains

### Already in schema (Phase 1)

| Domain | Table / package | What it holds |
|--------|-----------------|---------------|
| **Profile** | `profiles` | Demographics, allergies, emergency contact, pharmacy |
| **Care team** | `care_team` | Doctors, therapists, pharmacists, contact info |
| **Conditions** | `conditions` + `@medbot/conditions` modules | Active diagnoses, status, managing provider |
| **Prescriptions** | `medications` | Name, dose, schedule, prescriber, refills, active/stopped |
| **Adherence** | `adherence_events` | Taken / skipped / late per dose slot |
| **Daily metrics** | `metrics` | Glucose, BP, weight, mood, sleep, symptoms, etc. |
| **Appointments** | `appointments` | Upcoming and past visits (type, provider, prep, notes) |
| **Assessments** | `questionnaire_responses` | PHQ-9, GAD-7, scores over time |
| **Chat** | `conversations` | Message history |

### Planned extensions

| Domain | Purpose | Example |
|--------|---------|---------|
| **Lab results** | Structured panels with LOINC, flags, reference ranges | A1C 7.2%, LDL 142 |
| **Imaging results** | Summary + link to report in Drive | "Chest CT: no acute findings" |
| **Care visits** | Past visit narrative (may link to completed appointment) | Endocrinology follow-up 3/12 |
| **Care orders** | Doctor's orders — referrals, labs to get, restrictions | "Repeat A1C in 3 months" |
| **Procedures / surgeries** | Historical and scheduled | Knee arthroscopy 2019; cataract surgery 8/15 |
| **Immunizations** | Vaccine, date, lot if known | Flu 2025, COVID booster |
| **Side effects** | Linked to a specific medication | "Metformin → nausea" |
| **Symptoms** | Named symptom + severity over time | Headache 6/10 |
| **Family history** | Relation + condition | Father — heart attack at 58 |
| **Devices** | CGM, pump, CPAP, home BP cuff | Dexcom G7 since Jan 2025 |
| **Documents** | Drive files — labs, imaging, visit summaries | PDF from cardiology |
| **Insurance** | Carrier, member ID (encrypted), prior auth refs | Optional |
| **Care goals** | User + provider agreed targets | "A1C under 7", "Walk 20 min daily" |

### Lifestyle & wellness (planned)

Types in `packages/shared/src/lifestyle.ts`. Event-based rows (meals, workouts) plus
profile-level targets — separate from single-number `metrics` where richer structure helps.

| Domain | Purpose | Example fields |
|--------|---------|----------------|
| **Diet / meals** | What you ate, when, and macros | Description, meal type, carbs, calories, protein, note |
| **Dietary profile** | Patterns and daily targets | Low sodium, carb target g/day, water target |
| **Exercise** | Sessions with duration and intensity | Walk 30 min moderate; PT Tuesday |
| **Exercise goals** | Frequency and volume targets | 150 min/week, 8k steps/day |
| **Sleep** | Sessions beyond a single hours metric | Bed 10:30, up 6:15, quality fair |
| **Substance use** | Optional granular log | 1 glass wine; 2 coffees (AUDIT-C still scheduled) |
| **Supplements** | OTC vitamins, minerals, herbals | Vitamin D 2000 IU daily |
| **Body measurements** | Beyond weight on the scale | Waist 38 in, body fat % |
| **Stress** | Daily or event stress level | Work deadline — stress 7/10 |
| **Menstrual cycle** | Period tracking where relevant | Cycle day, flow, symptoms (glucose/mood links) |
| **Social history** | Baseline lifestyle factors | Smoking status, alcohol pattern, occupation activity level |

`steps`, `sleep_hours`, `water_intake`, `mood`, and `weight` remain in **metrics** for
charts; lifestyle tables hold the detail Amy cites in conversation ("you walked 4 of the
last 7 days").

### Other data points worth tracking

| Domain | Why include it |
|--------|----------------|
| **Hospitalizations** | Subtype of care visit — admit/discharge dates, reason |
| **Emergency visits** | ER/urgent care episodes and outcome |
| **Prior surgeries** | `procedures` with history flag — affects meds and labs |
| **Implanted devices** | Pacemaker, joint replacement — MRI safety, antibiotics |
| **Advance directives** | DNR, healthcare proxy — document link only |
| **Prior auth / referrals** | Status of insurance approvals |
| **Pharmacy fills** | Pickup dates, days supply remaining (if user logs) |
| **Home monitoring orders** | "Check BP twice daily" as active `care_order` |
| **Pain journal** | Flares with triggers, relief, linked to conditions |
| **Mental health episodes** | Mood episodes, therapy homework — complements PHQ-9 |
| **Falls / injuries** | Safety events, especially older adults |
| **Travel / timezone** | Explains glucose or sleep disruption |
| **Pregnancy / breastfeeding** | Alters med and lab reference ranges |
| **Vaccination reactions** | Link to `immunizations` row |
| **Caregiver notes** | If shared access is ever built — opt-in only |

Not every user needs every domain. **Condition modules** suggest which lifestyle domains
to emphasize (diabetes → diet + exercise; schizophrenia → sleep + substance use).

---

## Glossaries and reference tables

Patient education lives in `packages/shared/src/reference/`. The UI shows a **Glossary**
tab; the assistant calls lookup tools.

### Conditions (`condition-glossary.ts`)

For each condition key (diabetes, schizophrenia, hypertension, …):

- Plain-language **summary** and **what it means**
- **Common symptoms** (not a checklist for self-diagnosis)
- **Why tracking matters** for this condition
- **Commonly discussed** topics with your doctor
- **Questions for your doctor**
- Links to **trusted sources** (CDC, NIMH, ADA)
- Fixed **disclaimer**: education only, not medical advice

Starter entries: type 2 diabetes, schizophrenia, hypertension, depression. Expand to
cover all `CONDITION_KEYS`.

### Medications (`medication-glossary.ts`)

Keyed by generic name (resolve to RxNorm `rxcui` when possible):

- **Drug class** and **what it does**
- **How it is usually taken** (general — user's prescription wins)
- **Common side effects**
- **When to contact your care team**
- **General notes** (interactions, monitoring)
- Disclaimer: never change dose based on the app

Starter entries: metformin, lisinopril, sertraline, risperidone, atorvastatin.

### Lab tests (`lab-glossary.ts`)

Keyed by LOINC and aliases:

- **What it measures** and **why it is ordered**
- **Typical reference ranges** (default + sex-specific where standard)
- **What low means** / **what high means** in patient language
- `interpretLabValue()` compares a result to glossary or **lab-printed range** (report wins)
- Disclaimer: lab and doctor are authoritative

Starter entries: A1C, glucose, lipids, creatinine, eGFR, hemoglobin, TSH.

---

## How Amy uses the record

### Context assembly (every chat turn)

Ordered bundle — see `CONTEXT_ASSEMBLY_ORDER` in `health-record.ts`:

1. Profile, allergies, active conditions (with module targets)
2. Current medications + recent adherence
3. **Active care orders** (what the doctor told you to do)
4. Upcoming appointments and surgeries
5. Recent lab results with flags + glossary snippets
6. Last 7 days of metrics **plus diet and exercise summaries** (meals, active minutes, steps)
7. Sleep patterns, supplements, substance use if logged
8. Recent visits, procedures, symptoms, questionnaire scores
9. Episodic memory for older conversations

### Assistant tools (Phase 3 — additions)

| Tool | Action |
|------|--------|
| `lookup_condition_info` | Return glossary entry for a condition |
| `lookup_medication_info` | Return glossary entry for a drug |
| `explain_lab_result` | Match result to glossary + interpret flag |
| `add_lab_result` | Store structured lab row (confirm first) |
| `add_care_order` | Record doctor's order from visit or chat |
| `add_care_visit` | Summarize a completed appointment |
| `add_procedure` | Record surgery or procedure |
| `list_care_orders` | Active orders due soon |
| `list_upcoming_care` | Appointments + scheduled procedures |
| `log_meal` | Record food with optional carbs/calories |
| `log_exercise` | Record activity session (type, duration, intensity) |
| `log_sleep_session` | Bed/wake times and quality |
| `get_lifestyle_summary` | Rolling diet + exercise + sleep rollups |
| `update_dietary_profile` | Patterns and daily targets |
| `update_exercise_goals` | Weekly minutes / steps targets |

Existing tools (`log_metric`, `create_appointment`, etc.) remain. Port `log_meal` from
[medbot](https://github.com/seed0001/medbot).

### UI surfaces

| Screen | Content |
|--------|---------|
| **Health Record** | Timeline of all domains |
| **Glossary** | Browse conditions, meds, labs — searchable |
| **Labs** | Results table with flag colors + "What does this mean?" |
| **Orders** | Active doctor's orders with due dates |
| **Visits** | Past appointments with visit notes |
| **Upcoming** | Appointments, surgeries, prep checklists |
| **Food & activity** | Meal log, exercise sessions, weekly totals vs. goals |
| **Sleep** | Session history and averages |

---

## Doctor's orders vs. prescriptions

| | Prescription | Doctor's order |
|---|-------------|----------------|
| **Examples** | Metformin 500 mg twice daily | "Get A1C in 3 months", "See cardiology", "Low sodium diet" |
| **Who executes** | User takes med; pharmacy fills | User schedules lab, books referral, follows diet |
| **Amy's role** | Log adherence, explain med glossary | Track status, remind before due date, never "complete" medical actions |

Medication **changes** are recorded as orders (`medication_change`) but Amy never executes them.

---

## Test results flow

```
Lab report uploaded or entered
        ↓
Parse → LOINC match → lab_results row
        ↓
Flag vs. report range (or glossary default)
        ↓
UI: value + flag + "What does this mean?" panel
        ↓
Amy: explain_lab_result, trend vs. prior, suggest questions for doctor
```

Critical flags surface prominently; Amy cites glossary text and reminds user that
treatment decisions belong to the care team.

---

## Marketing line

> **Amy keeps the whole picture** — conditions, prescriptions, meals, exercise, visit notes,
> lab results, doctor's orders, and what's coming up. Tap any condition or medication for
> a plain-English glossary entry. Every lab result explains what it measures and what
> typical ranges mean — so you walk into appointments informed, not anxious.

---

## Implementation phases

| Phase | Work |
|-------|------|
| **2** | UI for conditions, meds, appointments; link glossary from each row |
| **3** | Context assembly + lookup/explain tools; lab result entry |
| **4** | Parse lab PDFs from Drive; Gmail lab-notification suggestions |
| **5** | Orders and visits from intake; trend lab + questionnaire together |
| **6** | Visit prep packet pulls all domains for last 90 days |

---

## Code references

- Domain list: `packages/shared/src/health-record.ts`
- Lifestyle types: `packages/shared/src/lifestyle.ts`
- Glossaries: `packages/shared/src/reference/`
- Condition modules (operational targets): `packages/conditions/`
- DB schema: `apps/api/src/db/schema.ts`
