'use client'

import { useState } from 'react'
import { AppGate } from '../components/AppGate'
import { useToast } from '../components/Toast'
import { apiPost, ApiError } from '@/lib/api'
import { METRIC_LABELS } from '@/lib/format'

interface Lab {
  testName: string
  value: string
  unit: string | null
  referenceText: string | null
  flag: string | null
  panelName: string | null
  loinc: string | null
  collectedAt: string | null
  include: boolean
}
interface Med {
  name: string
  dose: string | null
  form: string | null
  frequency: string | null
  purpose: string | null
  include: boolean
}
interface Vital {
  type: string
  value: number | null
  valueSecondary: number | null
  unit: string | null
  at: string | null
  include: boolean
}

interface Parsed {
  documentType: string
  documentDate: string | null
  provider: string | null
  notes: string | null
  labResults: Omit<Lab, 'include'>[]
  medications: Omit<Med, 'include'>[]
  vitals: Omit<Vital, 'include'>[]
}

type Phase = 'idle' | 'parsing' | 'review' | 'committing'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

export default function ImportPage() {
  const toast = useToast()
  const [phase, setPhase] = useState<Phase>('idle')
  const [filename, setFilename] = useState('')
  const [meta, setMeta] = useState<Pick<Parsed, 'documentType' | 'documentDate' | 'provider' | 'notes'> | null>(null)
  const [labs, setLabs] = useState<Lab[]>([])
  const [meds, setMeds] = useState<Med[]>([])
  const [vitals, setVitals] = useState<Vital[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setFilename(file.name)
    setPhase('parsing')
    try {
      const dataUrl = await readAsDataUrl(file)
      const parsed = await apiPost<Parsed>('/api/import/parse', {
        filename: file.name,
        mimeType: file.type,
        dataUrl,
      })
      setMeta({
        documentType: parsed.documentType,
        documentDate: parsed.documentDate,
        provider: parsed.provider,
        notes: parsed.notes,
      })
      setLabs(parsed.labResults.map((l) => ({ ...l, include: true })))
      setMeds(parsed.medications.map((m) => ({ ...m, include: true })))
      setVitals(parsed.vitals.map((v) => ({ ...v, include: true })))
      setPhase('review')
      const total = parsed.labResults.length + parsed.medications.length + parsed.vitals.length
      if (total === 0) toast.show('No records found in that document.', 'info')
    } catch (err) {
      setPhase('idle')
      if (err instanceof ApiError && err.status === 503) {
        setNotConfigured(true)
      } else {
        setError('Could not read that document. Try a clearer scan or a different file.')
      }
    }
  }

  async function commit() {
    setPhase('committing')
    try {
      const res = await apiPost<{ labsAdded: number; medsAdded: number; vitalsAdded: number }>(
        '/api/import/commit',
        {
          sourceDocument: filename,
          labResults: labs.filter((l) => l.include).map(({ include, ...rest }) => rest),
          medications: meds.filter((m) => m.include).map(({ include, ...rest }) => rest),
          vitals: vitals.filter((v) => v.include).map(({ include, ...rest }) => rest),
        },
      )
      toast.show(
        `Saved ${res.labsAdded} lab result(s), ${res.medsAdded} medication(s), ${res.vitalsAdded} vital(s).`,
      )
      reset()
    } catch {
      setPhase('review')
      toast.show('Could not save those records.', 'err')
    }
  }

  function reset() {
    setPhase('idle')
    setMeta(null)
    setLabs([])
    setMeds([])
    setVitals([])
    setFilename('')
  }

  const selectedCount =
    labs.filter((l) => l.include).length +
    meds.filter((m) => m.include).length +
    vitals.filter((v) => v.include).length

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <div>
            <h1>Import a document</h1>
            <p className="muted">
              Upload a lab report, prescription, or visit summary. We read it and pull out your
              data for you to review before anything is saved.
            </p>
          </div>
        </div>

        {notConfigured && (
          <div className="callout danger">
            <strong>Import not enabled.</strong>
            <p>
              Set <code>OPENROUTER_API_KEY</code> on the API service to turn on document reading.
            </p>
          </div>
        )}

        {phase === 'idle' && (
          <div className="card">
            <label className="btn-primary" style={{ cursor: 'pointer' }}>
              Choose a PDF or image
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={onFile}
                style={{ display: 'none' }}
              />
            </label>
            <p className="help-text">PDF, PNG, JPG, or WebP · up to 15 MB.</p>
            {error && <p className="field-error">{error}</p>}
            <p className="hint" style={{ marginTop: '1rem' }}>
              Nothing is saved automatically — you'll review and confirm every item. This reads
              your document with an AI model; it does not diagnose or interpret results.
            </p>
          </div>
        )}

        {phase === 'parsing' && (
          <div className="card">
            <p className="hint">Reading {filename}… this can take a few seconds.</p>
          </div>
        )}

        {(phase === 'review' || phase === 'committing') && meta && (
          <>
            <div className="card">
              <div className="row-between">
                <div>
                  <strong>{filename}</strong>
                  <p className="hint">
                    {meta.documentType.replace(/_/g, ' ')}
                    {meta.documentDate && ` · ${meta.documentDate}`}
                    {meta.provider && ` · ${meta.provider}`}
                  </p>
                </div>
                <button type="button" className="btn-ghost btn-sm" onClick={reset}>
                  Start over
                </button>
              </div>
            </div>

            {labs.length === 0 && meds.length === 0 && vitals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📄</span>
                <h3>Nothing to import</h3>
                <p>We couldn't find labs, medications, or vitals in that document.</p>
              </div>
            ) : (
              <p className="hint">
                Review what we found, fix anything that looks off, and untick anything you don't
                want. Nothing is saved until you press “Save selected”.
              </p>
            )}

            {labs.length > 0 && (
              <section>
                <h2>Lab results ({labs.length})</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Add</th>
                        <th>Test</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Reference</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labs.map((l, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              type="checkbox"
                              checked={l.include}
                              onChange={(e) =>
                                setLabs((p) => p.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={l.testName}
                              onChange={(e) =>
                                setLabs((p) => p.map((x, j) => (j === i ? { ...x, testName: e.target.value } : x)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={l.value}
                              onChange={(e) =>
                                setLabs((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                              }
                              style={{ maxWidth: '6rem' }}
                            />
                          </td>
                          <td>
                            <input
                              value={l.unit ?? ''}
                              onChange={(e) =>
                                setLabs((p) => p.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
                              }
                              style={{ maxWidth: '5rem' }}
                            />
                          </td>
                          <td className="hint">{l.referenceText ?? '—'}</td>
                          <td>
                            {l.flag && l.flag !== 'normal' ? (
                              <span className="badge badge-warn">{l.flag.replace(/_/g, ' ')}</span>
                            ) : (
                              <span className="hint">normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {meds.length > 0 && (
              <section>
                <h2>Medications ({meds.length})</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Add</th>
                        <th>Name</th>
                        <th>Dose</th>
                        <th>Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map((m, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              type="checkbox"
                              checked={m.include}
                              onChange={(e) =>
                                setMeds((p) => p.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={m.name}
                              onChange={(e) =>
                                setMeds((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={m.dose ?? ''}
                              onChange={(e) =>
                                setMeds((p) => p.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))
                              }
                              style={{ maxWidth: '7rem' }}
                            />
                          </td>
                          <td className="hint">{m.frequency ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {vitals.length > 0 && (
              <section>
                <h2>Vitals ({vitals.length})</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Add</th>
                        <th>Type</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals.map((v, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              type="checkbox"
                              checked={v.include}
                              onChange={(e) =>
                                setVitals((p) => p.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))
                              }
                            />
                          </td>
                          <td>{METRIC_LABELS[v.type] ?? v.type}</td>
                          <td>
                            {v.value}
                            {v.valueSecondary != null ? `/${v.valueSecondary}` : ''} {v.unit ?? ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(labs.length > 0 || meds.length > 0 || vitals.length > 0) && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={commit}
                  disabled={phase === 'committing' || selectedCount === 0}
                >
                  {phase === 'committing' ? 'Saving…' : `Save selected (${selectedCount})`}
                </button>
                <button type="button" className="btn-secondary" onClick={reset} disabled={phase === 'committing'}>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AppGate>
  )
}
