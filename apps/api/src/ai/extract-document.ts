import { complete, type ChatMessage, type ContentPart } from './openrouter.js'

/**
 * Reads an uploaded health document (lab report, prescription, visit summary,
 * scan) with a vision-capable model and returns STRUCTURED CANDIDATES only.
 * Nothing here writes to the record — the user reviews and confirms first. Parsed
 * content is untrusted (SPEC §6): it becomes suggestions, never actions.
 */

export interface ExtractedLab {
  testName: string
  value: string
  unit: string | null
  referenceText: string | null
  flag: string | null
  panelName: string | null
  loinc: string | null
  collectedAt: string | null
}

export interface ExtractedMed {
  name: string
  dose: string | null
  form: string | null
  frequency: string | null
  purpose: string | null
}

export interface ExtractedVital {
  type: string
  value: number | null
  valueSecondary: number | null
  unit: string | null
  at: string | null
}

export interface ExtractedDocument {
  documentType: string
  documentDate: string | null
  provider: string | null
  labResults: ExtractedLab[]
  medications: ExtractedMed[]
  vitals: ExtractedVital[]
  notes: string | null
}

const SYSTEM = `You extract structured data from a personal health document (a lab report, prescription, visit summary, imaging report, or immunization record). You do not diagnose or interpret — you transcribe what is printed, accurately.

Return ONLY a single JSON object, no prose and no code fences, in exactly this shape:
{
  "documentType": "lab_report" | "prescription" | "visit_summary" | "imaging_report" | "immunization" | "other",
  "documentDate": string | null,            // ISO date if a report/collection date is printed
  "provider": string | null,                // ordering provider or clinic, if printed
  "labResults": [
    { "testName": string, "value": string, "unit": string | null,
      "referenceText": string | null,       // reference range exactly as printed, e.g. "70-99 mg/dL"
      "flag": "normal"|"low"|"high"|"critical_low"|"critical_high"|"abnormal"|null,
      "panelName": string | null,           // e.g. "Comprehensive Metabolic Panel"
      "loinc": string | null,
      "collectedAt": string | null }        // ISO datetime if printed
  ],
  "medications": [
    { "name": string, "dose": string | null, "form": string | null,
      "frequency": string | null, "purpose": string | null }
  ],
  "vitals": [
    { "type": string, "value": number | null, "valueSecondary": number | null,
      "unit": string | null, "at": string | null }
  ],
  "notes": string | null
}

Rules:
- For "vitals.type" use one of: blood_pressure, heart_rate, weight, temperature, spo2, blood_glucose. For blood_pressure put systolic in "value" and diastolic in "valueSecondary".
- Only include items that are actually present in the document. Empty arrays are fine.
- Never invent values. If a field is not printed, use null.
- Do not include interpretation, advice, or a diagnosis anywhere.`

const INSTRUCTION =
  'Extract the structured data from this document as JSON, following the schema and rules exactly.'

export async function extractDocument(input: {
  filename: string
  mimeType: string
  dataUrl: string
}): Promise<ExtractedDocument> {
  const isPdf = input.mimeType === 'application/pdf'
  const filePart: ContentPart = isPdf
    ? { type: 'file', file: { filename: input.filename, file_data: input.dataUrl } }
    : { type: 'image_url', image_url: { url: input.dataUrl } }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: [{ type: 'text', text: INSTRUCTION }, filePart] },
  ]

  const res = await complete({ task: 'vision', messages, temperature: 0, maxTokens: 4096 })
  return normalize(parseJson(res.content))
}

/** Tolerant JSON parse — strips code fences and grabs the outermost object. */
function parseJson(raw: string): Record<string, unknown> {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
      } catch {
        /* fall through */
      }
    }
    throw new Error('Model did not return valid JSON')
  }
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v.trim() && Number.isFinite(Number(v))
      ? Number(v)
      : null

function normalize(d: Record<string, unknown>): ExtractedDocument {
  return {
    documentType: str(d.documentType) ?? 'other',
    documentDate: str(d.documentDate),
    provider: str(d.provider),
    notes: str(d.notes),
    labResults: arr(d.labResults)
      .map((r) => r as Record<string, unknown>)
      .filter((r) => str(r.testName))
      .map((r) => ({
        testName: str(r.testName)!,
        value: str(r.value) ?? (num(r.value) !== null ? String(num(r.value)) : ''),
        unit: str(r.unit),
        referenceText: str(r.referenceText),
        flag: str(r.flag),
        panelName: str(r.panelName),
        loinc: str(r.loinc),
        collectedAt: str(r.collectedAt),
      })),
    medications: arr(d.medications)
      .map((r) => r as Record<string, unknown>)
      .filter((r) => str(r.name))
      .map((r) => ({
        name: str(r.name)!,
        dose: str(r.dose),
        form: str(r.form),
        frequency: str(r.frequency),
        purpose: str(r.purpose),
      })),
    vitals: arr(d.vitals)
      .map((r) => r as Record<string, unknown>)
      .filter((r) => str(r.type) && num(r.value) !== null)
      .map((r) => ({
        type: str(r.type)!,
        value: num(r.value),
        valueSecondary: num(r.valueSecondary),
        unit: str(r.unit),
        at: str(r.at),
      })),
  }
}
