'use client'

import { useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Loaded } from '../components/Loader'
import { apiPost, apiPatch } from '@/lib/api'
import { formatDate, MED_FORM_LABELS } from '@/lib/format'

interface Schedule {
  kind: string
  times: string[]
  withFood: boolean
  instructions: string | null
}

interface Medication {
  id: string
  name: string
  dose: string
  form: string
  schedule: Schedule
  purpose: string | null
  prescriber: string | null
  pharmacy: string | null
  startedAt: string | null
  refillsRemaining: number | null
  isActive: boolean
  adherence30d: number
  doseCount30d: number
  missed30d: number
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function describeSchedule(s: Schedule): string {
  if (s.kind === 'as_needed') return 'As needed'
  if (s.kind === 'interval_hours') return 'On an interval'
  if (!s.times?.length) return 'No times set'
  const times = s.times.join(', ')
  return `${s.times.length}× daily at ${times}${s.withFood ? ' · with food' : ''}`
}

function MedCard({ m, onChanged }: { m: Medication; onChanged: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const pct = Math.round(m.adherence30d * 100)
  const tone = pct >= 90 ? 'ok' : pct >= 75 ? 'warn' : 'low'

  async function logDose(status: 'taken' | 'late' | 'skipped') {
    if (busy) return
    setBusy(true)
    try {
      await apiPost(`/api/medications/${m.id}/adherence`, { status })
      toast.show(`Logged: ${status}.`, 'ok')
      onChanged()
    } catch {
      toast.show('Could not log that dose.', 'err')
    } finally {
      setBusy(false)
    }
  }

  async function markInactive() {
    if (busy) return
    if (!window.confirm(`Mark ${m.name} inactive? It stays in your history but stops being tracked.`)) return
    setBusy(true)
    try {
      await apiPatch(`/api/medications/${m.id}`, { isActive: false })
      toast.show(`${m.name} marked inactive.`, 'ok')
      onChanged()
    } catch {
      toast.show('Could not update that medication.', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`card${m.isActive ? '' : ' muted'}`}>
      <div className="card-head">
        <div>
          <h2>
            {m.name} <span className="muted">{m.dose}</span>
            {!m.isActive && <span className="badge"> Inactive</span>}
          </h2>
          <p className="hint">
            {describeSchedule(m.schedule)}
            {m.purpose && ` · ${m.purpose}`}
          </p>
        </div>
        <div className="stat-right">
          <span className={`big-stat ${tone}`}>{pct}%</span>
          <span className="hint">30-day adherence</span>
        </div>
      </div>

      <div className="meter" aria-hidden>
        <div className={`meter-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Doses tracked</dt>
          <dd>{m.doseCount30d}</dd>
        </div>
        <div>
          <dt>Missed or skipped</dt>
          <dd>{m.missed30d}</dd>
        </div>
        <div>
          <dt>Prescriber</dt>
          <dd>{m.prescriber ?? '—'}</dd>
        </div>
        <div>
          <dt>Refills left</dt>
          <dd>
            {m.refillsRemaining ?? '—'}
            {m.refillsRemaining === 0 && <span className="badge badge-warn">Needs refill</span>}
          </dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{m.startedAt ? formatDate(m.startedAt) : '—'}</dd>
        </div>
        <div>
          <dt>Pharmacy</dt>
          <dd>{m.pharmacy ?? '—'}</dd>
        </div>
      </dl>

      {m.schedule.instructions && <p className="hint">{m.schedule.instructions}</p>}

      {m.isActive && (
        <>
          <div className="btn-row">
            <span className="hint">Log a dose:</span>
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => logDose('taken')}>
              Taken
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => logDose('late')}>
              Late
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => logDose('skipped')}>
              Skipped
            </button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={markInactive}>
              Mark inactive
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MedicationForm({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [form, setForm] = useState('tablet')
  const [purpose, setPurpose] = useState('')
  const [prescriber, setPrescriber] = useState('')
  const [pharmacy, setPharmacy] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [refillsRemaining, setRefillsRemaining] = useState('')
  const [kind, setKind] = useState('fixed_times')
  const [timesRaw, setTimesRaw] = useState('08:00, 20:00')
  const [intervalHours, setIntervalHours] = useState('')
  const [withFood, setWithFood] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timesError, setTimesError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setTimesError(null)

    if (!name.trim()) {
      setError('A medication name is required.')
      return
    }
    if (!dose.trim()) {
      setError('A dose is required, e.g. "500mg".')
      return
    }

    const schedule: Record<string, unknown> = { kind }
    if (kind === 'fixed_times') {
      const times = timesRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (times.length === 0) {
        setTimesError('Enter at least one time, e.g. "08:00, 20:00".')
        return
      }
      if (!times.every((t) => TIME_RE.test(t))) {
        setTimesError('Use 24-hour HH:MM times separated by commas, e.g. "08:00, 20:00".')
        return
      }
      schedule.times = times
    }
    if (kind === 'interval_hours') {
      const hours = Number(intervalHours)
      if (!intervalHours || Number.isNaN(hours) || hours <= 0) {
        setError('Enter a positive number of hours for the interval.')
        return
      }
      schedule.intervalHours = hours
    }
    schedule.withFood = withFood
    if (instructions.trim()) schedule.instructions = instructions.trim()

    const body: Record<string, unknown> = {
      name: name.trim(),
      dose: dose.trim(),
      form,
      schedule,
    }
    if (purpose.trim()) body.purpose = purpose.trim()
    if (prescriber.trim()) body.prescriber = prescriber.trim()
    if (pharmacy.trim()) body.pharmacy = pharmacy.trim()
    if (startedAt) body.startedAt = startedAt
    if (refillsRemaining !== '' && !Number.isNaN(Number(refillsRemaining))) {
      body.refillsRemaining = Number(refillsRemaining)
    }

    setBusy(true)
    try {
      await apiPost('/api/medications', body)
      onDone()
    } catch {
      setError('Could not save that medication. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Metformin" autoFocus />
        </label>
        <label className="field">
          <span>Dose</span>
          <input type="text" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="500mg" />
        </label>
        <label className="field">
          <span>Form</span>
          <select value={form} onChange={(e) => setForm(e.target.value)}>
            {Object.entries(MED_FORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Purpose (optional)</span>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Blood sugar control" />
        </label>
        <label className="field">
          <span>Prescriber (optional)</span>
          <input type="text" value={prescriber} onChange={(e) => setPrescriber(e.target.value)} />
        </label>
        <label className="field">
          <span>Pharmacy (optional)</span>
          <input type="text" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)} />
        </label>
        <label className="field">
          <span>Started (optional)</span>
          <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Refills remaining (optional)</span>
          <input
            type="number"
            min="0"
            value={refillsRemaining}
            onChange={(e) => setRefillsRemaining(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Schedule</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="fixed_times">Fixed times</option>
            <option value="interval_hours">Every N hours</option>
            <option value="as_needed">As needed</option>
            <option value="cyclic">Cyclic</option>
          </select>
        </label>

        {kind === 'fixed_times' && (
          <label className="field">
            <span>Times</span>
            <input
              type="text"
              value={timesRaw}
              onChange={(e) => setTimesRaw(e.target.value)}
              placeholder="08:00, 20:00"
            />
            <span className="help-text">24-hour HH:MM, comma-separated.</span>
          </label>
        )}

        {kind === 'interval_hours' && (
          <label className="field">
            <span>Every (hours)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
              placeholder="8"
            />
          </label>
        )}
      </div>

      {timesError && <p className="field-error">{timesError}</p>}

      <label className="field">
        <span>
          <input type="checkbox" checked={withFood} onChange={(e) => setWithFood(e.target.checked)} /> Take with food
        </span>
      </label>

      <label className="field">
        <span>Instructions (optional)</span>
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Anything the label or your prescriber noted"
        />
      </label>

      {error && <p className="field-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add medication'}
        </button>
      </div>
    </form>
  )
}

export default function MedicationsPage() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const refetch = () => setReloadKey((k) => k + 1)

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <h1>Medications</h1>
          <div className="page-actions">
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
              + Add medication
            </button>
          </div>
        </div>

        <p className="muted">
          Adherence is calculated over the last 30 days. Late doses count as taken.
        </p>

        <Loaded<{ medications: Medication[] }> key={reloadKey} path="/api/medications">
          {(d) =>
            d.medications.length === 0 ? (
              <div className="card">No medications recorded.</div>
            ) : (
              <div className="stack">
                {d.medications.map((m) => (
                  <MedCard key={m.id} m={m} onChanged={refetch} />
                ))}
              </div>
            )
          }
        </Loaded>

        <Modal open={open} title="Add medication" onClose={() => setOpen(false)} wide>
          <MedicationForm
            onDone={() => {
              setOpen(false)
              refetch()
              toast.show('Medication added.', 'ok')
            }}
          />
        </Modal>
      </main>
    </AppGate>
  )
}
