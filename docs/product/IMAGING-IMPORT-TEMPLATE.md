# Imaging Import Template — Transthoracic Echocardiogram

Template derived from **Scan - Echo Transthoracic Complete** (UCLA Health / DTLA Cardiac Imaging).
Use when extending parsers and the `imaging_reports` table.

Types: `packages/shared/src/imaging.ts`

---

## Document metadata

| Field | Example from template |
|-------|----------------------|
| `documentType` | `imaging_report` |
| `imagingModality` | `echo` |
| `reportTitle` | `TRANSTHORACIC ECHOCARDIOGRAM REPORT` |
| `documentDate` / `examAt` | `2026-05-29` |
| `signedAt` | `2026-06-03` |
| `provider` / `facility` | Downtown Los Angeles Cardiac Imaging |
| `referringPhysician` | DARKO VUCICEVIC |
| `readingPhysician` | Nidhi Thareja MD |
| `indication` | Hypertrophic cardiomyopathy |
| `comparisonNote` | Compared to prior study on 4/11/2025… |

---

## Diagnoses

| Name | ICD-10 |
|------|--------|
| Hypertrophic cardiomyopathy | I42.2 |

Stored in `imaging_reports.diagnoses` JSON array.

---

## Header vitals (also in `vitals` array)

| Type | Value |
|------|-------|
| `blood_pressure` | 120/83 mmHg |
| `weight` | 250 lbs |

Height (69 in) and BSA (2.27 m²) go in `imagingMeasurements`.

---

## Measurements section

Structured numeric values — each becomes one `imagingMeasurements` row:

| Name | Value | Unit | Index | Category |
|------|-------|------|-------|----------|
| LVIDd (2D) | 5.28 | cm | 2.32 cm/m² | LEFT VENTRICLE |
| LVIDs (2D) | 3.92 | cm | 1.73 cm/m² | LEFT VENTRICLE |
| IVSd (2D) | 1.49 | cm | — | LEFT VENTRICLE |
| LVPWd (2D) | 1.52 | cm | — | LEFT VENTRICLE |
| LV ejection fraction | 50 to 55 | % | — | LEFT VENTRICLE |
| LV stroke volume | 90.1 | ml | 39.7 ml/m² | LEFT VENTRICLE |
| MV E velocity | 0.33 | m/s | — | LEFT VENTRICLE |
| MV A velocity | 0.78 | m/s | — | LEFT VENTRICLE |
| E/A ratio | 0.42 | — | — | LEFT VENTRICLE |
| Lateral E/e' ratio | 5.2 | — | — | LEFT VENTRICLE |
| Medial E/e' ratio | 7.7 | — | — | LEFT VENTRICLE |
| Left atrium size (2D) | 4.70 | cm | — | LEFT ATRIUM |
| TAPSE | 22 | mm | — | RIGHT VENTRICLE |
| LVOT pressure gradient (rest) | 10 | mmHg | — | LEFT VENTRICLE |
| LVOT pressure gradient (Valsalva) | 42 | mmHg | — | LEFT VENTRICLE |
| IVC diameter | 1.55 | cm | — | IVC |
| Sinus of Valsalva | 40 | mm | 18 mm/m² | AORTA |

Numeric measurements are also mirrored to `lab_results` + `metrics` for trending.

---

## Findings sections

One row per anatomic header in the FINDINGS block:

- LEFT VENTRICLE — hypertrophy, SAM, EF, diastolic function, stroke volume…
- LEFT ATRIUM — mildly dilated
- RIGHT VENTRICLE — normal, device lead in RV
- MITRAL VALVE — trace regurg, SAM
- AORTIC VALVE — no stenosis/regurg
- TRICUSPID / PULMONIC / AORTA / IVC / PERICARDIUM

Stored in `imaging_reports.findings` as `{ section, text }`.

---

## Conclusions (numbered list)

Eight conclusion lines from this report, including:

1. Normal LV size
2. Moderate concentric LV hypertrophy
3. LVEF 50–55%, low-normal systolic function
4. Dynamic LVOT obstruction (10 → 42 mmHg with Valsalva)
5. Mildly dilated LA
6. Indeterminate diastolic function
7. Normal RV size and function
8. Comparison to prior study

Stored in `imaging_reports.conclusions` as string array.

---

## Import UI sections

After upload, the review screen shows:

1. **Diagnoses** — ICD-coded conditions from the report header
2. **Imaging measurements** — structured values with section
3. **Findings** — narrative per chamber/valve
4. **Conclusions** — numbered impression lines
5. **Vitals** — BP, weight from header

User checks/unchecks each item before save.

---

## Related

- [Lab import template](./LAB-IMPORT-TEMPLATE.md) — BMP trend PDFs
- [Health record model](./HEALTH-RECORD.md) — `imaging_results` domain
