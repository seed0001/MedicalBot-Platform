# Lab Import Template — Patient Portal Trend Reports

Template derived from **Result Trends — Basic Metabolic Panel** exports (e.g. MyChart).
Use this when extending parsers, glossaries, and the `lab_results` schema.

Canonical panel definitions: `packages/shared/src/reference/lab-panels.ts`  
Enrichment helpers: `packages/shared/src/labs.ts`

---

## Document shape

| Field | Example | Stored as |
|-------|---------|-----------|
| Report title | `Result Trends - BASIC METABOLIC PANEL - Jul 21, 2026` | `reportTitle` (parse) · filename fallback |
| Document type | Multi-date grid | `lab_trends` |
| Results window | `Feb 1, 2023 – Jul 14, 2026` | `resultsFrom`, `resultsTo` |
| Panel name | `Basic Metabolic Panel` | `panelName` on each row |
| Patient DOB | Printed in header | optional `notes` only — not required for import |
| Table pagination | `Table 1 of 4` | informational; extractor must read all pages |

- **Lab trend reports** fan out to **one `lab_results` row per test × collection date**, not one row per test.
- **`collectedAt` is required** on every row — use the column header date (ISO `YYYY-MM-DD`). Without it, results cannot be charted.

---

## BMP components (this template)

| Component | LOINC | Unit | Typical range (adult) |
|-----------|-------|------|------------------------|
| Sodium | 2951-2 | mmol/L | 135 – 146 |
| Urea Nitrogen (BUN) | 3094-0 | mg/dL | 7 – 22 |
| Calcium | 17861-6 | mg/dL | 8.6 – 10.4 |
| Potassium | 2823-3 | mmol/L | 3.6 – 5.3 |
| Chloride | 2075-0 | mmol/L | 96 – 106 |
| Total CO2 (bicarbonate) | 2028-9 | mmol/L | 20 – 30 |
| Anion Gap | 1863-0 | mmol/L | 8 – 19 |
| Glucose | 2345-7 | mg/dL | 65 – 99 (fasting on this lab) |
| Creatinine | 2160-0 | mg/dL | 0.60 – 1.30 |
| Estimated GFR | 33914-3 | mL/min/1.73m² | See GFR comment / staging |
| GFR Additional Information | — | — | Qualitative (`See Comment`) |

CMP extends BMP with albumin, ALP, ALT, AST, and total bilirubin — see `COMPREHENSIVE_METABOLIC_PANEL`.

---

## Per-result row (database)

Each extracted cell maps to:

```ts
{
  testName: string           // normalized via panel + glossary
  loinc: string | null
  value: string              // numeric or "See Comment"
  unit: string | null
  collectedAt: datetime      // column header date
  referenceText: string      // "135 - 146 mmol/L" as printed
  referenceLow: number | null   // parsed from referenceText
  referenceHigh: number | null
  flag: LabFlag              // high | low | normal | abnormal
  panelName: string          // "Basic Metabolic Panel"
  note: string | null        // footnotes, "See comment on lab report"
  sourceDocument: string     // original filename
}
```

Numeric rows are also mirrored into `metrics` (`type: lab_value`, `context: testName`) for trending charts.

---

## Flags and edge cases

| Printed | Handling |
|---------|----------|
| `High` / `Low` under a value | `flag: high` or `low` |
| Value above reference high | infer `high` if flag missing |
| `See Comment` | `value` as printed, `flag: abnormal`, `note` set |
| `See GFR Additional Information` | non-numeric reference range; no low/high parse |
| Split units (`mL/min/` + `1.73m2`) | join to `mL/min/1.73m²` |
| Multiple draws same day | separate columns → separate rows |

---

## Import flow

1. User uploads PDF on **Import** (`/import`).
2. Vision model extracts JSON (`extract-document.ts`) — trend-aware prompt.
3. User reviews table; toggles rows; commits.
4. `enrichLabResult()` fills LOINC, parses ranges, infers flags.
5. Rows land in `lab_results` + numeric mirror in `metrics`.

---

## Next panels to template

When you upload more documents, add panel definitions the same way:

- **Lipid panel** — Total cholesterol, LDL, HDL, triglycerides, non-HDL
- **CBC** — WBC, RBC, hemoglobin, hematocrit, platelets, differential
- **HbA1c** — single analyte, often its own trend export
- **Thyroid** — TSH, free T4, free T3
- **Urinalysis** — mixed qualitative + numeric
- **Liver panel** — if not full CMP

Drop new PDFs into this doc's component tables and extend `lab-panels.ts` + `lab-glossary.ts`.
