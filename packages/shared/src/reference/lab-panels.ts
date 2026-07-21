/**
 * Standard lab panels — component lists, LOINC codes, and aliases for normalization
 * when parsing portal trend PDFs (e.g. MyChart "Result Trends") and single reports.
 */

export interface LabPanelComponent {
  loinc: string
  name: string
  aliases: string[]
  defaultUnit: string
}

export interface LabPanelDefinition {
  key: string
  name: string
  aliases: string[]
  components: LabPanelComponent[]
}

/** Basic Metabolic Panel — template from patient-portal trend exports. */
export const BASIC_METABOLIC_PANEL: LabPanelDefinition = {
  key: 'bmp',
  name: 'Basic Metabolic Panel',
  aliases: ['BMP', 'Basic Metabolic Panel', 'Basic metabolic panel'],
  components: [
    {
      loinc: '2951-2',
      name: 'Sodium',
      aliases: ['Sodium', 'Na', 'Sodium, Serum'],
      defaultUnit: 'mmol/L',
    },
    {
      loinc: '3094-0',
      name: 'Urea Nitrogen',
      aliases: ['Urea Nitrogen', 'BUN', 'Blood urea nitrogen', 'Urea nitrogen (BUN)'],
      defaultUnit: 'mg/dL',
    },
    {
      loinc: '17861-6',
      name: 'Calcium',
      aliases: ['Calcium', 'Calcium, Serum'],
      defaultUnit: 'mg/dL',
    },
    {
      loinc: '2823-3',
      name: 'Potassium',
      aliases: ['Potassium', 'K', 'Potassium, Serum'],
      defaultUnit: 'mmol/L',
    },
    {
      loinc: '2075-0',
      name: 'Chloride',
      aliases: ['Chloride', 'Cl', 'Chloride, Serum'],
      defaultUnit: 'mmol/L',
    },
    {
      loinc: '2028-9',
      name: 'Total CO2',
      aliases: ['Total CO2', 'CO2', 'Bicarbonate', 'HCO3', 'Carbon dioxide, total'],
      defaultUnit: 'mmol/L',
    },
    {
      loinc: '1863-0',
      name: 'Anion Gap',
      aliases: ['Anion Gap', 'Anion gap'],
      defaultUnit: 'mmol/L',
    },
    {
      loinc: '2345-7',
      name: 'Glucose',
      aliases: ['Glucose', 'Glucose, Serum', 'Blood glucose'],
      defaultUnit: 'mg/dL',
    },
    {
      loinc: '2160-0',
      name: 'Creatinine',
      aliases: ['Creatinine', 'Creatinine, Serum'],
      defaultUnit: 'mg/dL',
    },
    {
      loinc: '33914-3',
      name: 'Estimated GFR',
      aliases: ['Estimated GFR', 'eGFR', 'GFR', 'eGFR (estimated)'],
      defaultUnit: 'mL/min/1.73m²',
    },
    {
      loinc: '33914-3',
      name: 'GFR Additional Information',
      aliases: ['GFR Additional Information', 'GFR comment'],
      defaultUnit: '',
    },
  ],
}

/** Comprehensive Metabolic Panel — BMP plus liver proteins and enzymes. */
export const COMPREHENSIVE_METABOLIC_PANEL: LabPanelDefinition = {
  key: 'cmp',
  name: 'Comprehensive Metabolic Panel',
  aliases: ['CMP', 'Comprehensive Metabolic Panel', 'Comprehensive metabolic panel'],
  components: [
    ...BASIC_METABOLIC_PANEL.components.filter((c) => c.name !== 'GFR Additional Information'),
    {
      loinc: '1751-7',
      name: 'Albumin',
      aliases: ['Albumin', 'Albumin, Serum'],
      defaultUnit: 'g/dL',
    },
    {
      loinc: '6768-6',
      name: 'Alkaline Phosphatase',
      aliases: ['Alkaline Phosphatase', 'ALP', 'Alk Phos'],
      defaultUnit: 'U/L',
    },
    {
      loinc: '1742-6',
      name: 'ALT',
      aliases: ['ALT', 'Alanine aminotransferase', 'SGPT'],
      defaultUnit: 'U/L',
    },
    {
      loinc: '1920-8',
      name: 'AST',
      aliases: ['AST', 'Aspartate aminotransferase', 'SGOT'],
      defaultUnit: 'U/L',
    },
    {
      loinc: '1975-2',
      name: 'Total Bilirubin',
      aliases: ['Total Bilirubin', 'Bilirubin, total'],
      defaultUnit: 'mg/dL',
    },
  ],
}

export const LAB_PANELS: LabPanelDefinition[] = [
  BASIC_METABOLIC_PANEL,
  COMPREHENSIVE_METABOLIC_PANEL,
]

const norm = (s: string) => s.trim().toLowerCase()

export function resolvePanelFromTitle(title: string): LabPanelDefinition | undefined {
  const q = norm(title)
  return LAB_PANELS.find(
    (p) =>
      norm(p.name) === q ||
      p.aliases.some((a) => norm(a) === q || q.includes(norm(a))),
  )
}

export function resolvePanelComponent(testName: string): LabPanelComponent | undefined {
  const q = norm(testName)
  for (const panel of LAB_PANELS) {
    for (const c of panel.components) {
      if (
        norm(c.name) === q ||
        c.aliases.some((a) => norm(a) === q || q.includes(norm(a)) || norm(a).includes(q))
      ) {
        return c
      }
    }
  }
  return undefined
}

export function panelForComponent(testName: string): LabPanelDefinition | undefined {
  const q = norm(testName)
  return LAB_PANELS.find((p) =>
    p.components.some(
      (c) =>
        norm(c.name) === q ||
        c.aliases.some((a) => norm(a) === q || q.includes(norm(a)) || norm(a).includes(q)),
    ),
  )
}
