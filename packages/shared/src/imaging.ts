import { z } from 'zod'

export const IMAGING_MODALITIES = [
  'echo',
  'ct',
  'mri',
  'xray',
  'ultrasound',
  'mammogram',
  'dexa',
  'pet',
  'other',
] as const
export type ImagingModality = (typeof IMAGING_MODALITIES)[number]

/** One numeric or qualitative value from an imaging report (echo, CT, etc.). */
export const imagingMeasurementSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().nullish(),
  /** Indexed value when printed, e.g. "2.32 cm/m²". */
  indexValue: z.string().nullish(),
  indexUnit: z.string().nullish(),
  /** Anatomic section, e.g. "LEFT VENTRICLE", "MITRAL VALVE". */
  category: z.string().nullish(),
})
export type ImagingMeasurement = z.infer<typeof imagingMeasurementSchema>

export const imagingFindingSchema = z.object({
  section: z.string().min(1),
  text: z.string().min(1),
})
export type ImagingFinding = z.infer<typeof imagingFindingSchema>

export const extractedDiagnosisSchema = z.object({
  name: z.string().min(1),
  icdCode: z.string().nullish(),
})
export type ExtractedDiagnosis = z.infer<typeof extractedDiagnosisSchema>

export const imagingReportInputSchema = z.object({
  modality: z.enum(IMAGING_MODALITIES).default('other'),
  title: z.string().min(1),
  examAt: z.string().nullish(),
  signedAt: z.string().nullish(),
  facility: z.string().nullish(),
  referringPhysician: z.string().nullish(),
  readingPhysician: z.string().nullish(),
  indication: z.string().nullish(),
  comparisonNote: z.string().nullish(),
  measurements: z.array(imagingMeasurementSchema).default([]),
  findings: z.array(imagingFindingSchema).default([]),
  conclusions: z.array(z.string().min(1)).default([]),
  diagnoses: z.array(extractedDiagnosisSchema).default([]),
  sourceDocument: z.string().nullish(),
})
export type ImagingReportInput = z.infer<typeof imagingReportInputSchema>

/**
 * Common transthoracic echo measurements — guides extraction from TTE reports.
 * Template from UCLA Health / patient-portal echo PDFs.
 */
export const ECHO_MEASUREMENT_NAMES = [
  'LVIDd (2D)',
  'LVIDs (2D)',
  'IVSd (2D)',
  'LVPWd (2D)',
  'Left atrium size (2D)',
  'RA area',
  'RA volume',
  'RA volume index',
  'TAPSE',
  'RV free wall S\'',
  'RV basal diameter',
  'RV longitudinal diameter',
  'LVOT velocity',
  'Peak aortic valve velocity',
  'Sinus of Valsalva',
  'Proximal ascending aorta',
  'IVC diameter',
  'LV ejection fraction',
  'LV stroke volume',
  'MV deceleration time',
  'MV E velocity',
  'MV A velocity',
  'E/A ratio',
  'Lateral e\' velocity',
  'Medial e\' velocity',
  'Lateral E/e\' ratio',
  'Medial E/e\' ratio',
  'Averaged E/e\' ratio',
  'LVOT pressure gradient (rest)',
  'LVOT pressure gradient (Valsalva)',
  'Height',
  'Weight',
  'BSA',
  'Blood pressure',
] as const

export const ECHO_FINDING_SECTIONS = [
  'LEFT VENTRICLE',
  'LEFT ATRIUM',
  'RIGHT ATRIUM',
  'RIGHT VENTRICLE',
  'MITRAL VALVE',
  'AORTIC VALVE',
  'TRICUSPID VALVE',
  'PULMONIC VALVE',
  'AORTA',
  'PULMONARY ARTERY',
  'IVC',
  'PERICARDIUM',
] as const
