/**
 * Patient-education reference for medications. Keyed by generic name (lowercase).
 * Expand over time; resolve user entries to RxNorm (rxcui) when possible.
 */

export interface MedicationReference {
  genericName: string
  brandNames: string[]
  drugClass: string
  whatItDoes: string
  howItIsUsuallyTaken: string
  commonSideEffects: string[]
  whenToContactYourCareTeam: string[]
  generalNotes: string
  disclaimer: string
}

export const MEDICATION_GLOSSARY_DISCLAIMER =
  'General information only. Take medications exactly as your prescriber directed. Do not start, stop, or change doses based on this app — including anything the assistant says.'

export const MEDICATION_GLOSSARY: Record<string, MedicationReference> = {
  metformin: {
    genericName: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    drugClass: 'Biguanide (diabetes medication)',
    whatItDoes:
      'Lowers blood sugar primarily by reducing how much glucose your liver releases and improving how your body responds to insulin. Often the first medication for type 2 diabetes.',
    howItIsUsuallyTaken:
      'Typically with meals to reduce stomach upset. Extended-release forms are often once daily with the evening meal. Your prescriber sets the dose.',
    commonSideEffects: [
      'Nausea, diarrhea, or stomach upset (often improves over weeks)',
      'Metallic taste',
      'Rare: lactic acidosis (seek care for severe weakness, unusual muscle pain, trouble breathing)',
    ],
    whenToContactYourCareTeam: [
      'Severe or persistent stomach problems',
      'Before any procedure involving contrast dye (kidney-related precautions)',
      'If you become dehydrated or very ill',
    ],
    generalNotes:
      'Does not cause low blood sugar by itself, but risk increases if combined with insulin or sulfonylureas.',
    disclaimer: MEDICATION_GLOSSARY_DISCLAIMER,
  },

  lisinopril: {
    genericName: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    drugClass: 'ACE inhibitor (blood pressure / heart / kidney protection)',
    whatItDoes:
      'Relaxes blood vessels and lowers blood pressure. Also used after heart attack and to protect kidneys in diabetes.',
    howItIsUsuallyTaken: 'Usually once daily, with or without food. Same time each day helps adherence.',
    commonSideEffects: [
      'Dry cough (common reason to switch to another class)',
      'Dizziness, especially when standing up quickly',
      'Elevated potassium on blood tests',
    ],
    whenToContactYourCareTeam: [
      'Swelling of face, lips, or tongue (allergic reaction — urgent)',
      'Persistent cough that bothers you',
      'Dizziness or fainting',
    ],
    generalNotes: 'Avoid potassium supplements or salt substitutes unless your doctor approves.',
    disclaimer: MEDICATION_GLOSSARY_DISCLAIMER,
  },

  sertraline: {
    genericName: 'Sertraline',
    brandNames: ['Zoloft'],
    drugClass: 'SSRI antidepressant',
    whatItDoes:
      'Increases serotonin activity in the brain to help improve mood, anxiety, and related symptoms. Full effect may take several weeks.',
    howItIsUsuallyTaken:
      'Usually once daily, morning or evening. Can be taken with or without food.',
    commonSideEffects: [
      'Nausea, diarrhea, or sleep changes in the first weeks',
      'Sexual side effects',
      'Headache',
    ],
    whenToContactYourCareTeam: [
      'Worsening mood or new suicidal thoughts (especially when starting or changing dose)',
      'Rash or agitation',
      'Before stopping — many SSRIs need a gradual taper',
    ],
    generalNotes:
      'Many drug interactions — tell your doctor and pharmacist everything you take, including supplements.',
    disclaimer: MEDICATION_GLOSSARY_DISCLAIMER,
  },

  risperidone: {
    genericName: 'Risperidone',
    brandNames: ['Risperdal'],
    drugClass: 'Antipsychotic (atypical)',
    whatItDoes:
      'Helps reduce hallucinations, delusions, and disorganized thinking in schizophrenia and related conditions. Also used for bipolar mania and irritability in some cases.',
    howItIsUsuallyTaken:
      'Once or twice daily as prescribed. Consistent timing matters for stable blood levels.',
    commonSideEffects: [
      'Weight gain and increased appetite',
      'Drowsiness',
      'Movement stiffness or restlessness',
      'Elevated prolactin (discuss with prescriber)',
    ],
    whenToContactYourCareTeam: [
      'Fever with muscle stiffness (rare but serious)',
      'New uncontrollable movements',
      'Missed doses — do not double up without guidance',
    ],
    generalNotes:
      'Adherence is one of the strongest predictors of staying well. Track sleep and side effects alongside doses.',
    disclaimer: MEDICATION_GLOSSARY_DISCLAIMER,
  },

  atorvastatin: {
    genericName: 'Atorvastatin',
    brandNames: ['Lipitor'],
    drugClass: 'Statin (cholesterol-lowering)',
    whatItDoes:
      'Lowers LDL ("bad") cholesterol and reduces cardiovascular risk in people with high cholesterol or existing heart disease.',
    howItIsUsuallyTaken: 'Usually once daily, often in the evening. Can be taken with or without food.',
    commonSideEffects: [
      'Muscle aches (report persistent or severe pain)',
      'Headache',
      'Digestive upset',
    ],
    whenToContactYourCareTeam: [
      'Unexplained muscle pain, tenderness, or weakness',
      'Before starting if you are pregnant or planning pregnancy',
      'Significant liver problems (unusual fatigue, yellowing skin)',
    ],
    generalNotes: 'Periodic liver enzymes and lipids are commonly checked.',
    disclaimer: MEDICATION_GLOSSARY_DISCLAIMER,
  },
}

export function getMedicationReference(name: string): MedicationReference | undefined {
  const key = name.trim().toLowerCase().split(/\s+/)[0] ?? ''
  if (!key) return undefined
  return MEDICATION_GLOSSARY[key]
}
