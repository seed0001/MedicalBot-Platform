/**
 * Domains in the user's health record. The assistant (Amy / chosen persona) maintains
 * structured access to all of these via tools and context assembly — see
 * docs/product/HEALTH-RECORD.md.
 */

/** Every major bucket the assistant can read, write (with confirmation), or explain. */
export const HEALTH_RECORD_DOMAINS = [
  'profile',
  'care_team',
  'conditions',
  'medications',
  'adherence',
  'metrics',
  'lab_results',
  'imaging_results',
  'care_visits',
  'appointments',
  'procedures',
  'care_orders',
  'immunizations',
  'allergies',
  'family_history',
  'symptoms',
  'side_effects',
  'questionnaires',
  'documents',
  'insurance',
  'devices',
  'care_goals',
] as const

export type HealthRecordDomain = (typeof HEALTH_RECORD_DOMAINS)[number]

export const APPOINTMENT_TYPES = [
  'office_visit',
  'telehealth',
  'lab_draw',
  'imaging',
  'therapy',
  'injection',
  'procedure',
  'surgery',
  'hospital_stay',
  'follow_up',
  'other',
] as const
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number]

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

/** Past visit record — may link to a completed appointment or stand alone. */
export const careVisitSchema = {
  visitedAt: 'datetime',
  type: APPOINTMENT_TYPES,
  providerId: 'uuid?',
  location: 'string?',
  chiefComplaint: 'string?',
  summary: 'string', // what happened, in plain language
  diagnosesDiscussed: 'string[]',
  ordersPlaced: 'uuid[]', // care order ids
  followUpPlan: 'string?',
  visitNotes: 'string?',
} as const

/** Doctor's orders: referrals, labs to get, imaging, lifestyle, med changes (recorded, not executed). */
export const CARE_ORDER_TYPES = [
  'referral',
  'lab',
  'imaging',
  'procedure',
  'diet',
  'activity',
  'follow_up_visit',
  'medication_start',
  'medication_stop',
  'medication_change', // record only — assistant never executes
  'home_monitoring',
  'other',
] as const
export type CareOrderType = (typeof CARE_ORDER_TYPES)[number]

export const CARE_ORDER_STATUSES = ['active', 'completed', 'cancelled'] as const
export type CareOrderStatus = (typeof CARE_ORDER_STATUSES)[number]

/** Structured lab result (panel or single analyte). Links to lab glossary for education. */
export const labResultSchema = {
  loinc: 'string?', // LOINC code when known
  testName: 'string',
  value: 'number | string', // numeric or "positive", "<5", etc.
  unit: 'string',
  collectedAt: 'datetime',
  resultedAt: 'datetime?',
  referenceLow: 'number?',
  referenceHigh: 'number?',
  referenceText: 'string?', // as printed on report, e.g. "70-99 mg/dL"
  flag: 'normal | low | high | critical_low | critical_high | abnormal',
  orderingProvider: 'string?',
  performingLab: 'string?',
  panelName: 'string?', // e.g. "Comprehensive Metabolic Panel"
  note: 'string?',
} as const

export const IMAGING_MODALITIES = [
  'xray',
  'ct',
  'mri',
  'ultrasound',
  'mammogram',
  'dexa',
  'pet',
  'other',
] as const
export type ImagingModality = (typeof IMAGING_MODALITIES)[number]

export const PROCEDURE_TYPES = [
  'surgery',
  'endoscopy',
  'biopsy',
  'cardiac_catheterization',
  'dental',
  'other',
] as const
export type ProcedureType = (typeof PROCEDURE_TYPES)[number]

/** What the assistant injects when building context — ordered by clinical relevance. */
export const CONTEXT_ASSEMBLY_ORDER: HealthRecordDomain[] = [
  'profile',
  'allergies',
  'conditions',
  'medications',
  'care_orders',
  'appointments',
  'lab_results',
  'metrics',
  'care_visits',
  'procedures',
  'imaging_results',
  'symptoms',
  'side_effects',
  'questionnaires',
  'care_goals',
  'immunizations',
  'family_history',
  'devices',
  'documents',
  'insurance',
]
