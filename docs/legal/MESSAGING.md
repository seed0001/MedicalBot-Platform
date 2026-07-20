# Messaging Guide — Transparent Trust Without HIPAA

How to talk about MedicalBot honestly: not HIPAA-certified, not your doctor, but worth
using anyway. Use this for landing pages, onboarding, press, and support macros.

**Principle:** Lead with what we *are*, disclose what we're *not* in plain language, then
show what we do to earn trust anyway. Never imply HIPAA compliance. Never hide the AI
data path.

---

## Positioning statement

> **MedicalBot is your personal health notebook — organized, searchable, and always on
> your side.** It tracks what matters, spots patterns you'd miss, and helps you walk into
> appointments prepared. It is not your doctor, not a medical device, and not a
> HIPAA-covered record system. It is a tool you run for yourself, built to respect your
> data either way.

---

## The three truths (always visible)

Use these everywhere: signup, login banner, footer, App Store description.

### 1. Not HIPAA-certified

**Short (login banner):**
> MedicalBot is a personal tool, not a HIPAA-covered health record. Your clinic's portal
> is for their chart; this is for yours.

**Medium (signup modal):**
> We are not a "covered entity" under HIPAA and do not offer Business Associate
> Agreements. If you need a system your hospital provides for official medical records,
> use their patient portal. MedicalBot is the organized copy you keep for yourself.

**Long (FAQ):**
> HIPAA applies to healthcare providers, insurers, and their vendors — not to a personal
> app you choose to use. We tell you this upfront because "health app" often implies
> compliance that isn't there. We still encrypt sensitive data, avoid logging your entries,
> and let you export or delete everything.

### 2. Not a replacement for your doctor

**Short:**
> We track and summarize. Your care team diagnoses, prescribes, and treats.

**Medium:**
> MedicalBot will never recommend a dose, change a prescription, or tell you what condition
> you have. When a reading is dangerous, we say so — because that's why you logged it —
> but your doctor makes the decisions.

### 3. What we are

**Short:**
> Your health log, with an assistant that never forgets a reading.

**Medium:**
> Track glucose, meds, mood, sleep, and appointments. Chat to log in plain English. See
> trends. Get reminders on your phone calendar. Walk into visits with a 90-day summary
> already printed.

**Bullet list (marketing):**
- A single place for the numbers and notes you already jot on paper
- An assistant that logs what you say and shows you patterns over weeks — **with a personality you choose**, not a generic chatbot
- Five ready-made personas (warm, direct, professional, gentle, coach) plus custom
- Amy keeps your full health record and explains conditions, meds, and labs via built-in glossaries
- Reminders that land on your real calendar, not buried in email
- Questionnaires (PHQ-9, GAD-7) trended like any other metric
- Export anytime — your data is portable
- No ads, no selling your health data

---

## AI personality (not a generic companion)

**Principle:** The assistant is a **health logger with character**, not ChatGPT in a hospital
skin. Users pick who they're talking to; safety rules stay fixed.

### Headline

> **An assistant with a personality you choose**

### Subhead

> Not a generic chatbot. Pick a voice that fits how you like to be spoken to — warm,
> direct, professional, gentle, or entirely your own.

### Short (feature card)

> Choose Maya for warm and informal, Sam for direct and efficient, Dorothy for patient
> plain language — or describe your own. Tweak how you're addressed and how chatty it is.
> Medical boundaries never change.

### Medium (landing section)

> Most health apps bolt on a faceless AI. MedicalBot lets you choose who you're talking to:
> a warm friend, a calm professional, a no-nonsense helper, or someone you describe
> yourself. You're logging personal health data — the conversation should feel personal
> too. Personality shapes tone only; the assistant still never diagnoses, prescribes, or
> changes doses.

### The five personas (marketing table)

| Name | Vibe | One-liner |
|------|------|-----------|
| **Maya** | Warm, empathetic, informal | Like a patient friend — great for voice |
| **Jordan** | Calm, clear, professional | Organized and respectful, minimal small talk |
| **Sam** | Direct, efficient | Logs fast, confirms in one line |
| **Dorothy** | Gentle, patient, plain-spoken | Slow pace, no jargon, double-checks details |
| **Alex** | Encouraging coach | Notices streaks and progress without guilt |

Plus **Create your own**: describe tone, gender presentation, formality, and how you want
to be addressed (e.g. "female, empathetic, informal — call me Pat, keep it short").

### FAQ — Is this just ChatGPT?

> No. Fixed tools, fixed safety rules, and a personality you configure. It logs, reminds,
> and summarizes — it doesn't improvise medical advice or new capabilities.

### What not to say

| Avoid | Say instead |
|-------|-------------|
| "AI companion" / "AI friend" | "Health assistant with a personality you choose" |
| "Talk to anyone you want" | "Pick a tone that fits you — five presets or custom" |
| "The AI becomes whoever you need" | "You set style and tone; medical boundaries stay fixed" |

Full product spec: [docs/product/ASSISTANT-PERSONAS.md](../product/ASSISTANT-PERSONAS.md)

---

## Trust builders (without claiming HIPAA)

These are true today or planned. Use only what is shipped.

| Claim | Why it matters |
|-------|----------------|
| "Your data is yours — export or delete anytime" | Ownership beats compliance badges for many users |
| "We don't sell your data" | Explicit; rare in health tech |
| "Google tokens encrypted at rest" | Technical credibility |
| "We don't log your health entries" | Reduces fear of leaks |
| "AI only sees what you send it — we'll show you exactly what" | Transparency on the scary part |
| "No dose changes, ever — enforced in code, not just a disclaimer" | Differentiator vs. sketchy "AI doctor" apps |
| "Gmail suggestions require your approval" | Shows we don't auto-act on email |
| "Open source spec and build phases" | Auditable intent for technical users |
| "Built for one person: you" | Personal tool framing avoids enterprise HIPAA expectations |
| "Personality you choose — not a generic chatbot" | Differentiates from faceless AI wrappers |
| "Five personas or describe your own" | Concrete, memorable product hook |

---

## What not to say

| Avoid | Say instead |
|-------|-------------|
| "HIPAA compliant" / "HIPAA certified" | "Personal health tool — not HIPAA-covered" |
| "Medical-grade" | "Designed for personal tracking" |
| "AI doctor" / "your virtual physician" | "AI assistant that logs and organizes" |
| "Replaces your chart" | "Complements your care — your copy of the story" |
| "100% secure" | "Encrypted in transit and at rest; no system is perfect" |
| "We never share data" | "We don't sell data; AI providers process chat when you use the assistant" |

---

## Onboarding copy (signup modal)

**Title:** Before you continue

**Body:**
MedicalBot helps you track health metrics, medications, and appointments — and talk to an
assistant that keeps it all organized.

Please understand:

- **Not HIPAA-covered.** This is your personal notebook, not your hospital's record system.
- **Not medical advice.** We never diagnose, prescribe, or change doses.
- **AI uses your words.** Chat is processed by third-party AI models to log entries and reply.

We encrypt sensitive data, never sell your information, and let you export or delete
everything. [Full Terms] · [Privacy Notice]

**Checkbox:** I have read and agree to the Terms of Use and Privacy Notice.

**Button:** Continue with Google

---

## Login reminder (every session)

Short, non-blocking banner at top of app — no re-checkbox unless Terms version changed.

> **Reminder:** MedicalBot is a personal tracking tool, not HIPAA-certified and not a
> substitute for your care team. [Terms]

---

## Press / one-liner

> MedicalBot is a personal health assistant that helps adults organize their own metrics,
> medications, and appointments — with an AI that logs in plain English, **adapts to a
> personality you choose**, and sends Google Calendar reminders that actually reach their
> phone. It is deliberately not a HIPAA product: honest about what it is, rigorous about
> what it isn't.

---

## FAQ snippets

**Why should I trust you without HIPAA?**
Because you know what you're getting. HIPAA governs how hospitals handle your chart; it
doesn't automatically make consumer apps trustworthy. We encrypt credentials, don't sell
data, don't log your entries, and let you leave with everything you put in.

**Can my doctor use this instead of their EHR?**
No. Your doctor's electronic health record is the legal chart. MedicalBot is the organized
summary you bring to visits — or keep for yourself.

**Who sees my chat?**
When you use the assistant, your messages and relevant health context go to OpenRouter and
the model provider they route to. We don't use your chat to train models. See the Privacy
Notice for details.

---

## Versioning

When Terms or Privacy Notice versions change:

1. Increment `TERMS_VERSION` in `packages/shared/src/legal.ts`
2. Update the markdown files in `legal/`
3. Users see the full acknowledgment modal again on next login
4. Changelog note in release notes: "Updated Terms — summary of what changed"
