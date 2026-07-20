/**
 * Legal document version. Bump when TERMS-OF-USE.md or PRIVACY-NOTICE.md change
 * materially — users must re-accept before continuing.
 */
export const TERMS_VERSION = '1.0'

export const LEGAL_PATHS = {
  terms: '/legal/TERMS-OF-USE.md',
  privacy: '/legal/PRIVACY-NOTICE.md',
} as const

/** Shown in the signup acknowledgment modal (scrollable summary). */
export const TERMS_SUMMARY = {
  title: 'Before you continue',
  intro:
    'MedicalBot helps you track health metrics, medications, and appointments — and talk to an assistant that keeps it all organized.',
  sections: [
    {
      heading: 'Not HIPAA-covered',
      body:
        'This is your personal health notebook, not your hospital\'s medical record system. We are not a HIPAA "covered entity" and do not offer Business Associate Agreements.',
    },
    {
      heading: 'Not a replacement for your care team',
      body:
        'We track and summarize. We never diagnose, prescribe, or change medication doses. Your doctor, pharmacist, and other licensed providers make treatment decisions.',
    },
    {
      heading: 'What we are',
      body:
        'A personal assistant that logs readings in plain English, shows trends over time, syncs reminders to your calendar, and helps you prepare for visits. Your data is exportable and deletable.',
    },
    {
      heading: 'AI and your data',
      body:
        'When you use the assistant, your messages and relevant health context are sent to third-party AI providers to generate responses and extract structured entries. We do not sell your data.',
    },
    {
      heading: 'Emergencies',
      body:
        'MedicalBot is not for emergencies. If you think you are having a medical emergency, call 911 or your local emergency number immediately.',
    },
  ],
  checkboxLabel:
    'I have read and agree to the Terms of Use and Privacy Notice, and I understand MedicalBot is not HIPAA-certified and is not a substitute for professional medical care.',
} as const

/** Short banner shown on every login when terms are current. */
export const LOGIN_REMINDER =
  'MedicalBot is a personal tracking tool — not HIPAA-certified and not a substitute for your care team.'
