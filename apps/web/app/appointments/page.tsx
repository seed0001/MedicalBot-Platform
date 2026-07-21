'use client'

import { useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Loaded } from '../components/Loader'
import { apiPost, apiPatch } from '@/lib/api'
import { formatDateTime, titleCase, APPT_TYPE_LABELS } from '@/lib/format'

interface Appointment {
  id: string
  title: string
  type: string
  location: string | null
  startsAt: string
  endsAt: string | null
  prepNotes: string | null
  visitNotes: string | null
  providerName: string | null
  googleEventId: string | null
}

function VisitNotesEditor({ a, onChanged }: { a: Appointment; onChanged: () => void }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(a.visitNotes ?? '')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await apiPatch(`/api/appointments/${a.id}`, { visitNotes: notes })
      toast.show('Visit notes saved.', 'ok')
      setEditing(false)
      onChanged()
    } catch {
      toast.show('Could not save visit notes.', 'err')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="stack">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What came out of this visit — findings, changes, follow-ups."
          rows={4}
          autoFocus
        />
        <div className="btn-row">
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={busy}
            onClick={() => {
              setNotes(a.visitNotes ?? '')
              setEditing(false)
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (a.visitNotes) {
    return (
      <div className="callout">
        <div className="row-between">
          <strong>Visit notes</strong>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
        <p>{a.visitNotes}</p>
      </div>
    )
  }

  return (
    <div className="btn-row">
      <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>
        Add visit notes
      </button>
    </div>
  )
}

function AppointmentCard({ a, past, onChanged }: { a: Appointment; past: boolean; onChanged: () => void }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>{a.title}</h3>
          <p className="hint">
            {formatDateTime(a.startsAt)}
            {a.providerName && ` · ${a.providerName}`}
          </p>
        </div>
        <span className="badge">{titleCase(a.type)}</span>
      </div>

      {a.location && <p className="hint">{a.location}</p>}

      {a.prepNotes && !past && (
        <div className="callout">
          <strong>Before this visit</strong>
          <p>{a.prepNotes}</p>
        </div>
      )}

      {past ? (
        <VisitNotesEditor a={a} onChanged={onChanged} />
      ) : (
        a.visitNotes && (
          <div className="callout">
            <strong>Visit notes</strong>
            <p>{a.visitNotes}</p>
          </div>
        )
      )}

      {!a.googleEventId && (
        <p className="hint">Not synced to Google Calendar yet — that lands in Phase 4.</p>
      )}
    </div>
  )
}

function AppointmentForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('office_visit')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [location, setLocation] = useState('')
  const [prepNotes, setPrepNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('A title is required.')
      return
    }
    if (!startsAt) {
      setError('A start date and time is required.')
      return
    }
    if (endsAt && new Date(endsAt) < new Date(startsAt)) {
      setError('The end time cannot be before the start time.')
      return
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      type,
      startsAt: new Date(startsAt).toISOString(),
    }
    if (endsAt) body.endsAt = new Date(endsAt).toISOString()
    if (location.trim()) body.location = location.trim()
    if (prepNotes.trim()) body.prepNotes = prepNotes.trim()

    setBusy(true)
    try {
      await apiPost('/api/appointments', body)
      onDone()
    } catch {
      setError('Could not save that appointment. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Endocrinology follow-up" autoFocus />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(APPT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Starts</span>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Ends (optional)</span>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Location (optional)</span>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Prep notes (optional)</span>
        <textarea
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          placeholder="Questions to ask, things to bring, what to fast for."
          rows={3}
        />
      </label>

      {error && <p className="field-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add appointment'}
        </button>
      </div>
    </form>
  )
}

export default function AppointmentsPage() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const refetch = () => setReloadKey((k) => k + 1)

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <h1>Appointments</h1>
          <div className="page-actions">
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
              + Add appointment
            </button>
          </div>
        </div>

        <Loaded<{ upcoming: Appointment[]; past: Appointment[] }> key={reloadKey} path="/api/appointments">
          {(d) => (
            <>
              <section>
                <h2>Upcoming</h2>
                {d.upcoming.length === 0 ? (
                  <p className="hint">Nothing scheduled.</p>
                ) : (
                  <div className="stack">
                    {d.upcoming.map((a) => (
                      <AppointmentCard key={a.id} a={a} past={false} onChanged={refetch} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2>Past</h2>
                {d.past.length === 0 ? (
                  <p className="hint">No past visits recorded.</p>
                ) : (
                  <div className="stack">
                    {d.past.map((a) => (
                      <AppointmentCard key={a.id} a={a} past onChanged={refetch} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </Loaded>

        <Modal open={open} title="Add appointment" onClose={() => setOpen(false)} wide>
          <AppointmentForm
            onDone={() => {
              setOpen(false)
              refetch()
              toast.show('Appointment added.', 'ok')
            }}
          />
        </Modal>
      </main>
    </AppGate>
  )
}
