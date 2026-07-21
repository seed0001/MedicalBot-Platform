'use client'

import { useEffect, useMemo, useState } from 'react'
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

interface TypeInfo {
  type: string
  count: number
  latest: string | null
}

interface LabAnalyte {
  name: string
  count: number
  latest: string | null
  unit: string | null
}

/** Dropdown value: plain metric type, or `lab:Analyte name` for imported labs. */
function parseSelection(value: string): { type: string; context?: string } {
  if (value.startsWith('lab:')) {
    return { type: 'lab_value', context: value.slice(4) }
  }
  return { type: value }
}

function selectionKey(type: string, context?: string | null): string {
  if (type === 'lab_value' && context) return `lab:${context}`
  return type
}

const TARGETS: Record<string, { targetMin: number | null; targetMax: number | null }> = {
  blood_glucose: { targetMin: 80, targetMax: 180 },
  blood_pressure: { targetMin: null, targetMax: 130 },
  sleep_hours: { targetMin: 6, targetMax: 10 },
  mood: { targetMin: 4, targetMax: 10 },
  anxiety: { targetMin: 0, targetMax: 5 },
  side_effect_severity: { targetMin: 0, targetMax: 3 },
  a1c: { targetMin: null, targetMax: 7 },
  heart_rate: { targetMin: 60, targetMax: 100 },
  spo2: { targetMin: 95, targetMax: 100 },
}

const DEFAULT_TYPES = [
  'blood_glucose',
  'blood_pressure',
  'weight',
  'pain',
  'mood',
  'sleep_hours',
  'heart_rate',
]

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
  { days: 0, label: 'All time' },
]

export default function MetricsPage() {
  const toast = useToast()
  const [types, setTypes] = useState<TypeInfo[]>([])
  const [labAnalytes, setLabAnalytes] = useState<LabAnalyte[]>([])
  const [selection, setSelection] = useState('')
  const [days, setDays] = useState(0)
  const [rows, setRows] = useState<MetricRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [logging, setLogging] = useState(false)

  const { type, context } = parseSelection(selection)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      apiGet<{ types: TypeInfo[] }>('/api/metrics/types'),
      apiGet<{ analytes: LabAnalyte[] }>('/api/metrics/lab-analytes'),
    ])
      .then(([typeRes, labRes]) => {
        if (cancelled) return
        setTypes(typeRes.types)
        setLabAnalytes(labRes.analytes)
        setSelection((cur) => {
          if (cur) return cur
          const topLab = labRes.analytes[0]
          if (topLab) return selectionKey('lab_value', topLab.name)
          const best = [...typeRes.types]
            .filter((t) => t.type !== 'lab_value')
            .sort((a, b) => b.count - a.count)[0]
          return best?.type ?? 'blood_glucose'
        })
      })
      .catch(() => {
        if (!cancelled) setSelection((cur) => cur || 'blood_glucose')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    if (!selection) return
    let cancelled = false
    setRows(null)
    setError(null)
    const params = new URLSearchParams({
      type,
      days: String(days),
      limit: '2000',
    })
    if (context) params.set('context', context)
    apiGet<{ metrics: MetricRow[] }>(`/api/metrics?${params}`)
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
  }, [selection, type, context, days, reloadKey])

  const options = useMemo(() => {
    const counts = new Map(types.map((t) => [t.type, t.count]))
    const metrics = [...types]
      .filter((t) => t.type !== 'lab_value')
      .sort((a, b) => b.count - a.count)
      .map((t) => ({
        value: t.type,
        label: METRIC_LABELS[t.type] ?? t.type,
        count: t.count,
      }))
    const labs = labAnalytes.map((a) => ({
      value: selectionKey('lab_value', a.name),
      label: a.name,
      count: a.count,
    }))
    const seen = new Set([...metrics, ...labs].map((o) => o.value))
    const rest = DEFAULT_TYPES.filter((t) => !counts.has(t) && !seen.has(t)).map((t) => ({
      value: t,
      label: METRIC_LABELS[t] ?? t,
      count: 0,
    }))
    return [...metrics, ...labs, ...rest]
  }, [types, labAnalytes])

  const target = TARGETS[type] ?? { targetMin: null, targetMax: null }
  const points = (rows ?? []).map((r) => ({ t: +new Date(r.recordedAt), v: r.value }))
  const bpSeries =
    type === 'blood_pressure' && rows
      ? [
          {
            id: 'systolic',
            label: 'Systolic',
            tone: 'primary' as const,
            points: rows.map((r) => ({ t: +new Date(r.recordedAt), v: r.value })),
          },
          {
            id: 'diastolic',
            label: 'Diastolic',
            tone: 'secondary' as const,
            points: rows
              .filter((r) => r.valueSecondary !== null)
              .map((r) => ({ t: +new Date(r.recordedAt), v: r.valueSecondary! })),
          },
        ]
      : undefined
  const label =
    type === 'lab_value' && context ? context : (METRIC_LABELS[type] ?? type)

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <div>
            <h1>Metrics</h1>
            <p className="muted">Every reading you record, charted on its own scale.</p>
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
            <select value={selection} onChange={(e) => setSelection(e.target.value)}>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                  {o.count > 0 ? ` (${o.count})` : ''}
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
            <p>No {label.toLowerCase()} readings in this window.</p>
            <p className="hint">
              Try &ldquo;All time&rdquo; for imported lab trends, or log one with &ldquo;+ Log reading&rdquo;.
            </p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="card">
              <LineChart
                series={bpSeries}
                points={bpSeries ? undefined : points}
                targetMin={target.targetMin}
                targetMax={target.targetMax}
                unit={rows[0]?.unit ?? null}
              />
              {type === 'blood_pressure' && target.targetMax !== null && (
                <p className="hint">Shaded band is the systolic target (up to {target.targetMax} mmHg).</p>
              )}
              {type !== 'blood_pressure' &&
                (target.targetMin !== null || target.targetMax !== null) && (
                <p className="hint">
                  Shaded band is the target range
                  {target.targetMin !== null && target.targetMax !== null
                    ? ` (${target.targetMin}–${target.targetMax})`
                    : target.targetMax !== null
                      ? ` (up to ${target.targetMax})`
                      : ''}
                  .
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
                    {!context && <th>Context</th>}
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.id}>
                      <td>{formatDateTime(r.recordedAt)}</td>
                      <td>
                        <strong>{formatMetric(r.type, r.value, r.valueSecondary)}</strong>{' '}
                        <span className="hint">{r.unit}</span>
                      </td>
                      {!context && (
                        <td>{r.context ? (CONTEXT_LABELS[r.context] ?? r.context) : '—'}</td>
                      )}
                      <td className="hint">{r.source.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 200 && (
              <p className="hint">Showing the 200 most recent of {rows.length}.</p>
            )}
          </>
        )}

        <Modal open={logging} title="Log a reading" onClose={() => setLogging(false)} wide>
          <MetricEntryForm
            defaultType={type === 'lab_value' ? 'blood_glucose' : type || 'blood_glucose'}
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
