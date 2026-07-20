# Assistant Personas

The MedicalBot assistant is **not a generic AI companion**. It is a health logging
assistant with a **personality the user chooses** — tone, formality, warmth, and how they
are addressed. Safety rules (no dosing advice, no diagnosis) are fixed in code and always
override persona instructions.

Presets live in `packages/shared/src/personas.ts` and are the single source of truth for
marketing copy, the onboarding picker, and Phase 3 system prompts.

---

## Product behavior (Phase 3)

### Onboarding / settings flow

1. User picks one of **five sample personas** or **Create your own**
2. Optional **customize** step: short free-text tweaks (how to address them, shorter
   replies, more formal, etc.) — max 2,000 characters
3. Persona stored on the user profile (`personaId` + `personaCustom` optional)
4. User can change persona anytime in Settings; chat history is kept

### Custom persona

When the user selects **Create your own**, they describe the assistant in plain language:

> "Female, empathetic, informal. Call me Pat. Keep answers to one or two sentences
> because I use voice on my phone."

We do not generate a persona for them without consent — they describe it, we follow it.

### What persona controls

| Controls | Does not control |
|----------|------------------|
| Tone (warm, direct, professional) | Whether to log a reading |
| Formality and sentence length | Medication doses or advice |
| Name and how user is addressed | Diagnosis or treatment recommendations |
| Encouragement level | Red-flag thresholds on recorded data |
| Voice-friendly phrasing (no markdown) | Which tools the assistant may call |

---

## The five sample personas

| ID | Name | Tagline | Best for |
|----|------|---------|----------|
| `maya` | Maya | Warm, empathetic, informal | Voice users, friendly daily check-ins |
| `jordan` | Jordan | Calm, clear, professional | Users who want clarity without chat |
| `sam` | Sam | Direct and efficient | Busy users, minimal conversation |
| `dorothy` | Dorothy | Gentle, patient, plain-spoken | Slower pace, plain language, older adults |
| `alex` | Alex | Encouraging coach | Habit-building, adherence, streaks |

Each preset includes `customizationHints` shown in the UI as examples of what users can
tweak without writing a full custom persona.

---

## Marketing copy

Use anywhere we describe the assistant: landing page, App Store, signup, Phase 3 preview.

**Headline:** An assistant with a personality you choose

**Subhead:** Not a generic chatbot. Pick a voice that fits how you like to be spoken to —
warm, direct, professional, or your own.

**Differentiator paragraph:**

> Most health apps bolt on a faceless AI. MedicalBot lets you choose who you're talking to:
> a warm friend like Maya, a no-nonsense helper like Sam, or someone you describe yourself.
> You're logging personal health data — the conversation should feel personal too.

**Bullets:**

- Five ready-made personas to start from
- Tweak tone, formality, and how you're addressed
- Or describe a brand-new assistant from scratch
- Safety rules always apply — personality never changes medical boundaries

**FAQ — Is this just ChatGPT?**

> No. The assistant is built for health logging with fixed tools, fixed safety rules, and
> a personality you configure. It cannot prescribe, change doses, or improvise new
> capabilities — it logs, reminds, and summarizes within boundaries you can read in our
> Terms.

---

## Reference: medbot

The [medbot](https://github.com/seed0001/medbot) prototype ships a single persona ("Amy")
with an optional admin-wide persona textarea. MedicalBot generalizes that to **per-user**
presets plus custom instructions, stored on the profile instead of site-wide settings.
