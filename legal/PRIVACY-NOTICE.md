# MedicalBot Platform — Privacy Notice

**Version:** 1.0  
**Effective date:** July 19, 2026

This notice explains what MedicalBot collects, where it goes, and what control you have.
It supplements the [Terms of Use](TERMS-OF-USE.md).

---

## The short version

- **Your data is yours.** We help you organize it; we don't sell it.
- **We're not HIPAA-covered.** See Terms §3 for what that means and what we do anyway.
- **Some data goes to AI providers** when you use the assistant — that's how chat works.
- **You can export and delete** your data on request.

---

## What we collect

| Data | Why |
|------|-----|
| Google account (email, name) | Sign-in and account identity |
| Health metrics, meds, appointments | The core product |
| Chat messages | Conversation history and AI context |
| Questionnaire responses | Scoring and trends |
| Google OAuth tokens (encrypted) | Calendar, Drive, Gmail, Tasks — only if you connect them |
| Usage logs (no PHI content) | Debugging and reliability |

We do **not** intentionally log the content of your health entries or chat in server logs.

---

## Where your data is stored

- **Our database** (PostgreSQL, hosted on Railway) — your health records and profile
- **Redis** (Railway) — sessions, job queues, rate limits
- **Google** (your account) — calendar events, Drive files, and drafts we create when you
  connect those services
- **OpenRouter / AI providers** — message content and relevant health context sent when
  you use the assistant

We do not sell your personal information or health data to advertisers or data brokers.

---

## What leaves the system when you use the AI

When you chat with the assistant, we send a context bundle to OpenRouter (and its
downstream model providers) that typically includes:

- Your recent messages
- A summary of your profile, conditions, and medications
- Recent relevant metrics
- Memories the assistant has saved (allergies, doctor names, preferences)

We use separate models for extraction and analysis tasks; those may include specific
entries (e.g., parsing "sugar was 142 before dinner" into a glucose row).

You will be asked to consent to this before using the assistant.

---

## Gmail and untrusted input

If you connect Gmail, we search for appointment confirmations and similar messages to
**suggest** entries you can approve. Parsed email content is never passed directly to the
AI as instructions. You always confirm before anything is saved.

---

## Security measures (non-HIPAA)

- HTTPS everywhere
- Encrypted Google refresh tokens at rest (AES-256-GCM)
- Session cookies (httpOnly, secure in production)
- PHI redaction in application logs
- Incremental Google OAuth scopes

No system is perfectly secure. Use a strong Google account and report suspected issues
promptly.

---

## Your rights

- **Access** — view your data in the app
- **Export** — request a full export (JSON/CSV)
- **Delete** — request hard deletion of your account and data
- **Disconnect** — revoke Google integrations from settings or your Google account

Contact: [contact email — add before launch]

---

## Children

MedicalBot is not intended for users under 18.

---

## Changes

We will update this notice when practices change and prompt you to review material updates.
