/**
 * Lab test reference — what each test measures, typical reference ranges, and what
 * out-of-range values often mean. Ranges are educational defaults; the lab report and
 * your doctor's targets are authoritative (especially for diabetes, CKD, pregnancy).
 */

export type LabFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal'

export interface LabReferenceRange {
  low?: number
  high?: number
  /** e.g. "Fasting", "Non-fasting may be higher" */
  note?: string
}

export interface LabTestReference {
  /** LOINC when known — for normalization across labs. */
  loinc?: string
  name: string
  aliases: string[]
  whatItMeasures: string
  whyItIsOrdered: string
  unit: string
  /** Default adult range; sex-specific overrides when clinically standard. */
  ranges: {
    default?: LabReferenceRange
    female?: LabReferenceRange
    male?: LabReferenceRange
  }
  lowMeans: string
  highMeans: string
  disclaimer: string
}

export const LAB_GLOSSARY_DISCLAIMER =
  'Reference ranges vary by laboratory, age, sex, and health conditions. Your printed lab report and doctor interpret your results — this is education to help you ask better questions, not a diagnosis.'

export const LAB_GLOSSARY: LabTestReference[] = [
  {
    loinc: '4548-4',
    name: 'Hemoglobin A1C',
    aliases: ['A1C', 'HbA1c', 'Glycated hemoglobin'],
    whatItMeasures:
      'Average blood sugar over roughly the past 2–3 months by measuring how much glucose is attached to hemoglobin in red blood cells.',
    whyItIsOrdered:
      'Diabetes diagnosis and monitoring; shows long-term control beyond a single fingerstick.',
    unit: '%',
    ranges: {
      default: { low: 4.0, high: 5.6, note: 'Below 5.7% is typically normal; diabetes often ≥6.5% on repeat testing' },
    },
    lowMeans:
      'Very low A1C can reflect frequent lows, certain anemias, or overtreatment — discuss with your care team if you have diabetes.',
    highMeans:
      'Higher A1C suggests poorer average glucose control over months. Your doctor sets a personal target (often <7% for many adults with diabetes, but individualized).',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '2339-0',
    name: 'Glucose (blood sugar)',
    aliases: ['Blood glucose', 'Fasting glucose', 'Plasma glucose'],
    whatItMeasures: 'Amount of sugar in the blood at the time of the draw.',
    whyItIsOrdered: 'Diabetes screening, monitoring, and evaluating symptoms.',
    unit: 'mg/dL',
    ranges: {
      default: { low: 70, high: 99, note: 'Fasting; non-fasting values are interpreted differently' },
    },
    lowMeans:
      'Below 70 mg/dL is hypoglycemia for most people with diabetes — treat per your care plan. Severe lows need urgent help.',
    highMeans:
      'Fasting ≥126 mg/dL on repeat testing may indicate diabetes. Random highs with symptoms also warrant evaluation. Your targets may differ if you are already treated.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '2093-3',
    name: 'Total Cholesterol',
    aliases: ['Cholesterol, total'],
    whatItMeasures: 'Total amount of cholesterol in the blood (LDL, HDL, and other fractions combined).',
    whyItIsOrdered: 'Cardiovascular risk assessment; part of a lipid panel.',
    unit: 'mg/dL',
    ranges: {
      default: { high: 200, note: 'Desirable is often <200 mg/dL; targets are individualized' },
    },
    lowMeans: 'Very low cholesterol is uncommon; context matters — discuss with your doctor.',
    highMeans:
      'Higher levels increase long-term heart and stroke risk. Treatment depends on LDL, HDL, triglycerides, and overall risk — not this number alone.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '2089-1',
    name: 'LDL Cholesterol',
    aliases: ['LDL', 'Bad cholesterol'],
    whatItMeasures: 'Low-density lipoprotein — particles that can deposit in artery walls.',
    whyItIsOrdered: 'Primary target for cholesterol treatment in many guidelines.',
    unit: 'mg/dL',
    ranges: {
      default: { high: 100, note: 'Optimal often <100; lower targets if you have heart disease or diabetes' },
    },
    lowMeans: 'Usually desirable when achieved with treatment — confirm with your prescriber.',
    highMeans: 'Higher LDL raises atherosclerosis risk. Statins and lifestyle are common approaches.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '2160-0',
    name: 'Creatinine',
    aliases: ['Serum creatinine'],
    whatItMeasures:
      'Waste product from muscle metabolism filtered by the kidneys — a marker of kidney function.',
    whyItIsOrdered: 'Kidney function (with eGFR), medication dosing, before contrast procedures.',
    unit: 'mg/dL',
    ranges: {
      male: { low: 0.7, high: 1.3 },
      female: { low: 0.6, high: 1.1 },
    },
    lowMeans: 'Low muscle mass or malnutrition can lower creatinine; not usually concerning alone.',
    highMeans:
      'Rising creatinine suggests reduced kidney filtration. Many meds need adjustment in kidney disease — tell all providers your latest results.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '33914-3',
    name: 'eGFR',
    aliases: ['Estimated GFR', 'Glomerular filtration rate'],
    whatItMeasures: 'Estimated rate at which kidneys filter blood, calculated from creatinine, age, and sex.',
    whyItIsOrdered: 'Stages chronic kidney disease and guides medication choices.',
    unit: 'mL/min/1.73m²',
    ranges: {
      default: { low: 90, note: '≥90 normal; 60–89 mild decrease; <60 may indicate CKD — staging by doctor' },
    },
    lowMeans:
      'Lower eGFR means reduced kidney function. Trend over time matters more than one number.',
    highMeans: 'Above 90 is generally normal in adults without kidney disease.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '718-7',
    name: 'Hemoglobin',
    aliases: ['Hgb', 'Hb'],
    whatItMeasures: 'Protein in red blood cells that carries oxygen.',
    whyItIsOrdered: 'Anemia screening, fatigue workup, before surgery.',
    unit: 'g/dL',
    ranges: {
      male: { low: 13.5, high: 17.5 },
      female: { low: 12.0, high: 15.5 },
    },
    lowMeans:
      'Anemia — causes include iron deficiency, chronic disease, bleeding, or B12/folate deficiency. Further tests determine why.',
    highMeans: 'Can reflect dehydration, lung disease, or bone marrow disorders — needs clinical context.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
  {
    loinc: '3016-3',
    name: 'TSH',
    aliases: ['Thyroid stimulating hormone'],
    whatItMeasures:
      'Pituitary hormone that regulates the thyroid. High TSH often means underactive thyroid; low TSH may mean overactive.',
    whyItIsOrdered: 'Thyroid screening and monitoring levothyroxine dose.',
    unit: 'mIU/L',
    ranges: {
      default: { low: 0.4, high: 4.0, note: 'Reference intervals vary by lab; pregnancy ranges differ' },
    },
    lowMeans: 'May indicate hyperthyroidism or overtreatment with thyroid hormone.',
    highMeans: 'May indicate hypothyroidism or need for higher levothyroxine dose.',
    disclaimer: LAB_GLOSSARY_DISCLAIMER,
  },
]

export function getLabReference(nameOrLoinc: string): LabTestReference | undefined {
  const q = nameOrLoinc.trim().toLowerCase()
  return LAB_GLOSSARY.find(
    (t) =>
      t.loinc === q ||
      t.name.toLowerCase() === q ||
      t.aliases.some((a) => a.toLowerCase() === q),
  )
}

/**
 * Compare a numeric result to glossary ranges for patient-friendly flagging.
 * Lab-printed reference range wins when provided on the result row.
 */
export function interpretLabValue(
  test: LabTestReference,
  value: number,
  sexAtBirth?: 'female' | 'male' | null,
  reportRange?: { low?: number; high?: number },
): { flag: LabFlag; explanation: string } {
  const range =
    reportRange ??
    (sexAtBirth === 'female' ? test.ranges.female : sexAtBirth === 'male' ? test.ranges.male : undefined) ??
    test.ranges.default

  if (!range?.low && !range?.high) {
    return { flag: 'abnormal', explanation: test.disclaimer }
  }

  if (range.low != null && value < range.low) {
    return { flag: 'low', explanation: test.lowMeans }
  }
  if (range.high != null && value > range.high) {
    return { flag: 'high', explanation: test.highMeans }
  }
  return { flag: 'normal', explanation: `Within typical reference range for ${test.name}. ${test.disclaimer}` }
}
