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

// Default target bands where the app has an opinion; everything else charts with
// no band. Any metric type can still be viewed — this only affects the shading.
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

// Always offer these so a new user has a populated dropdown before logging.
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
]

export default function MetricsPage() {
  const toast = useToast()
  const [types, setTypes] = useState<TypeInfo[]>([])
  const [type, setType] = useState('')
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState<MetricRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [logging, setLogging] = useState(false)

  // Which metric types this user actually has data for. Refetched after logging
  // so a brand-new metric type appears in the dropdown immediately.
  useEffect(() => {
    let cancelled = false
    apiGet<{ types: TypeInfo[] }>('/api/metrics/types')
      .then((d) => {
        if (cancelled) return
        setTypes(d.types)
        // On first load, open on the metric with the most readings so the user
        // sees their own data — not an empty default.
        setType((cur) => {
          if (cur) return cur
          const best = [...d.types].sort((a, b) => b.count - a.count)[0]
          return best?.type ?? 'blood_glucose'
        })
      })
      .catch(() => {
        if (!cancelled) setType((cur) => cur || 'blood_glucose')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // Readings for the selected type + window.
  useEffect(() => {
    if (!type) return
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

  // The dropdown: every type the user has (with counts), then any common
  // defaults they haven't logged yet — so nothing recorded is ever hidden.
  const options = useMemo(() => {
    const counts = new Map(types.map((t) => [t.type, t.count]))
    const withData = [...types].sort((a, b) => b.count - a.count).map((t) => t.type)
    const rest = DEFAULT_TYPES.filter((t) => !counts.has(t))
    return [...withData, ...rest].map((t) => ({ type: t, count: counts.get(t) ?? 0 }))
  }, [types])

  const target = TARGETS[type] ?? { targetMin: null, targetMax: null }
  const points = (rows ?? []).map((r) => ({ t: +new Date(r.recordedAt), v: r.value }))
  const label = METRIC_LABELS[type] ?? type

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
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {options.map((o) => (
                <option key={o.type} value={o.type}>
                  {METRIC_LABELS[o.type] ?? o.type}
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
            <p className="hint">Try a longer range, or log one with “+ Log reading”.</p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="card">
              <LineChart
                points={points}
                targetMin={target.targetMin}
                targetMax={target.targetMax}
                unit={rows[0]?.unit ?? null}
              />
              {(target.targetMin !== null || target.targetMax !== null) && (
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
                      <td className="hint">{r.source.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && <p className="hint">Showing the 100 most recent of {rows.length}.</p>}
          </>
        )}

        <Modal open={logging} title="Log a reading" onClose={() => setLogging(false)} wide>
          <MetricEntryForm
            defaultType={type || 'blood_glucose'}
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
