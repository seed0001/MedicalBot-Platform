'use client'

import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { useToast } from './Toast'
import { METRIC_UNITS } from '@/lib/format'

interface Alert {
  id: string
  severity: string
  message: string
}

/** Metric types offered in the manual logger, in a sensible order. */
const LOGGABLE: Array<{ type: string; label: string }> = [
  { type: 'blood_glucose', label: 'Blood glucose' },
  { type: 'blood_pressure', label: 'Blood pressure' },
  { type: 'weight', label: 'Weight' },
  { type: 'heart_rate', label: 'Heart rate' },
  { type: 'sleep_hours', label: 'Sleep' },
  { type: 'mood', label: 'Mood' },
  { type: 'anxiety', label: 'Anxiety' },
  { type: 'pain', label: 'Pain' },
  { type: 'temperature', label: 'Temperature' },
  { type: 'spo2', label: 'Oxygen saturation' },
  { type: 'steps', label: 'Steps' },
  { type: 'water_intake', label: 'Water' },
  { type: 'a1c', label: 'A1C' },
  { type: 'side_effect_severity', label: 'Side effect severity' },
]

const GLUCOSE_CONTEXTS = [
  { value: 'fasting', label: 'Fasting' },
  { value: 'pre_meal', label: 'Before a meal' },
  { value: 'post_meal', label: 'After a meal' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'random', label: 'Random' },
  { value: 'hypo_event', label: 'Low event' },
]

function localNow(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function MetricEntryForm({
  defaultType = 'blood_glucose',
  onDone,
}: {
  defaultType?: string
  onDone?: () => void
}) {
  const toast = useToast()
  const [type, setType] = useState(defaultType)
  const [value, setValue] = useState('')
  const [secondary, setSecondary] = useState('')
  const [context, setContext] = useState('fasting')
  const [note, setNote] = useState('')
  const [recordedAt, setRecordedAt] = useState(localNow())
  const [busy, setBusy] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)

  const isBp = type === 'blood_pressure'
  const isGlucose = type === 'blood_glucose'
  const unit = METRIC_UNITS[type] ?? ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAlerts([])
    const num = Number(value)
    if (!value || Number.isNaN(num)) {
      setError('Enter a numeric value.')
      return
    }
    if (isBp && (!secondary || Number.isNaN(Number(secondary)))) {
      setError('Blood pressure needs both systolic and diastolic.')
      return
    }
    setBusy(true)
    try {
      const body: Record<string, unknown> = {
        type,
        value: num,
        recordedAt: new Date(recordedAt).toISOString(),
        note: note || null,
      }
      if (isBp) body.valueSecondary = Number(secondary)
      if (isGlucose) body.context = context
      const res = await apiPost<{ id: string; alerts: Alert[] }>('/api/metrics', body)
      if (res.alerts?.length) {
        setAlerts(res.alerts)
        toast.show('Logged — see the alert below.', 'info')
      } else {
        toast.show('Reading logged.', 'ok')
      }
      setValue('')
      setSecondary('')
      setNote('')
      onDone?.()
    } catch {
      setError('Could not save that reading. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Metric</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {LOGGABLE.map((m) => (
              <option key={m.type} value={m.type}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{isBp ? 'Systolic' : 'Value'}{unit ? ` (${unit})` : ''}</span>
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isBp ? '120' : ''}
            autoFocus
          />
        </label>

        {isBp && (
          <label className="field">
            <span>Diastolic (mmHg)</span>
            <input
              type="number"
              step="any"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="80"
            />
          </label>
        )}

        {isGlucose && (
          <label className="field">
            <span>Context</span>
            <select value={context} onChange={(e) => setContext(e.target.value)}>
              {GLUCOSE_CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span>When</span>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Note (optional)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything worth remembering about this reading"
        />
      </label>

      {error && <p className="field-error">{error}</p>}

      {alerts.map((a) => (
        <div key={a.id} className={`alert alert-${a.severity === 'emergency' ? 'emergency' : a.severity === 'urgent' ? 'urgent' : 'notice'}`}>
          <strong>{a.severity === 'emergency' ? 'Urgent — ' : ''}</strong>
          {a.message}
        </div>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Log reading'}
        </button>
      </div>
    </form>
  )
}
