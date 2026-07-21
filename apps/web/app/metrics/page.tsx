'use client'

import { useEffect, useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { MetricEntryForm } from '../components/MetricEntryForm'
import { useToast } from '../components/Toast'
import { LineChart } from '../components/Chart'
import { apiGet, NotAuthenticated } from '@/lib/api'
import { CONTEXT_LABELS, METRIC_LABELS, formatDateTime, formatMetric } from '@/lib/format'

interface MetricRow {
  id: string
  type: string
  value: number
  valueSecondary: number | null
  unit: string
  recordedAt: string
  source: string
  context: string | null
  note: string | null
}

const SERIES = [
  { type: 'blood_glucose', targetMin: 80, targetMax: 180 },
  { type: 'weight', targetMin: null, targetMax: null },
  { type: 'blood_pressure', targetMin: null, targetMax: 130 },
  { type: 'sleep_hours', targetMin: 6, targetMax: 10 },
  { type: 'mood', targetMin: 4, targetMax: 10 },
  { type: 'anxiety', targetMin: 0, targetMax: 5 },
  { type: 'side_effect_severity', targetMin: 0, targetMax: 3 },
  { type: 'a1c', targetMin: null, targetMax: 7 },
]

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

export default function MetricsPage() {
  const toast = useToast()
  const [type, setType] = useState('blood_glucose')
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState<MetricRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError(null)
    apiGet<{ metrics: MetricRow[] }>(`/api/metrics?type=${type}&days=${days}&limit=500`)
      .then((d) => {
        if (!cancelled) setRows(d.metrics)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof NotAuthenticated ? 'Not signed in.' : 'Could not load metrics.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [type, days, reloadKey])

  const selected = SERIES.find((s) => s.type === type)!
  const points = (rows ?? []).map((r) => ({ t: +new Date(r.recordedAt), v: r.value }))

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <div>
            <h1>Metrics</h1>
            <p className="muted">Every reading recorded, charted on its own scale.</p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn-primary" onClick={() => setLogging(true)}>
              + Log reading
            </button>
          </div>
        </div>

        <div className="controls">
          <label>
            <span className="hint">Metric</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {SERIES.map((s) => (
                <option key={s.type} value={s.type}>
                  {METRIC_LABELS[s.type] ?? s.type}
                </option>
              ))}
            </select>
          </label>
          <div className="range-group">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={days === r.days ? 'chip chip-active' : 'chip'}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="card">{error}</div>}
        {!rows && !error && <p className="hint">Loading…</p>}

        {rows && rows.length === 0 && (
          <div className="card">
            <p>No {METRIC_LABELS[type]?.toLowerCase()} readings in this window.</p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="card">
              <LineChart
                points={points}
                targetMin={selected.targetMin}
                targetMax={selected.targetMax}
                unit={rows[0]?.unit ?? null}
              />
              {(selected.targetMin !== null || selected.targetMax !== null) && (
                <p className="hint">
                  Shaded band is the target range
                  {selected.targetMin !== null && selected.targetMax !== null
                    ? ` (${selected.targetMin}–${selected.targetMax})`
                    : selected.targetMax !== null
                      ? ` (up to ${selected.targetMax})`
                      : ''}
                  , merged from your active conditions.
                </p>
              )}
            </div>

            <h2>Readings ({rows.length})</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Value</th>
                    <th>Context</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r) => (
                    <tr key={r.id}>
                      <td>{formatDateTime(r.recordedAt)}</td>
                      <td>
                        <strong>{formatMetric(r.type, r.value, r.valueSecondary)}</strong>{' '}
                        <span className="hint">{r.unit}</span>
                      </td>
                      <td>{r.context ? (CONTEXT_LABELS[r.context] ?? r.context) : '—'}</td>
                      <td className="hint">{r.source.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <p className="hint">Showing the 100 most recent of {rows.length}.</p>
            )}
          </>
        )}

        <Modal open={logging} title="Log a reading" onClose={() => setLogging(false)} wide>
          <MetricEntryForm
            defaultType={type}
            onDone={() => {
              setLogging(false)
              setReloadKey((k) => k + 1)
              toast.show('Reading logged.')
            }}
          />
        </Modal>
      </main>
    </AppGate>
  )
}
