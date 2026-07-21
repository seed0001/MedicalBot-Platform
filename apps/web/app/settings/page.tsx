'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '@/lib/api'
import { AppGate } from '../components/AppGate'
import { useToast } from '../components/Toast'
import { SAMPLE_PERSONAS } from '@medbot/shared'

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; message: string } | { kind: 'error'; message: string }

const PERSONA_KEY = 'medbot_persona'
const DEFAULT_PERSONA = 'maya'

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [confirmText, setConfirmText] = useState('')

  const armed = confirmText.trim().toUpperCase() === 'RESET'

  async function reseed() {
    setStatus({ kind: 'busy' })
    try {
      const r = await apiPost<{ metrics: number }>('/api/demo/reseed')
      setStatus({
        kind: 'done',
        message: `Mock data regenerated — ${r.metrics} readings. Reload any page to see it.`,
      })
    } catch {
      setStatus({ kind: 'error', message: 'Reseed failed. Is DEMO_MODE on?' })
    }
  }

  async function reset() {
    setStatus({ kind: 'busy' })
    try {
      const r = await apiPost<{ usersDeleted: number }>('/api/demo/reset')
      setStatus({
        kind: 'done',
        message: `Master reset complete. Demo accounts removed: ${r.usersDeleted}. You have been signed out.`,
      })
      setConfirmText('')
    } catch {
      setStatus({ kind: 'error', message: 'Reset failed. Is DEMO_MODE on?' })
    }
  }

  return (
    <AppGate>
      <main>
        <h1>Settings</h1>

        <Preferences />

        <section>
          <h2>Help &amp; tour</h2>
          <div className="card">
            <p>
              New here, or want a refresher? Replay the guided tour to see what each part of the
              app does and where everything lives.
            </p>
            <a className="btn-secondary" href="/dashboard?tour=1">
              Replay the guided tour
            </a>
          </div>
        </section>

        <section>
          <h2>Mock data</h2>
          <div className="card">
            <p>
              Everything you are looking at is generated demo data — 90 days of readings for a
              fictional account. It is deterministic, so regenerating produces the same numbers.
            </p>
            <button type="button" className="btn-secondary" onClick={reseed} disabled={status.kind === 'busy'}>
              Regenerate mock data
            </button>
          </div>
        </section>

        <section>
          <h2>Master reset</h2>
          <div className="card danger">
            <p>
              <strong>This deletes every demo account and all of its data.</strong> Metrics,
              medications, adherence history, appointments, assessments — all of it. Real
              accounts are not touched.
            </p>
            <p className="hint">
              This is the switch from exploring to real use. After running it, set{' '}
              <code>DEMO_MODE=false</code> and restart the API so these controls disappear
              entirely.
            </p>

            <label className="confirm-field">
              <span className="hint">Type RESET to confirm</span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                aria-label="Type RESET to confirm"
              />
            </label>

            <button
              type="button"
              className="btn-danger"
              onClick={reset}
              disabled={!armed || status.kind === 'busy'}
            >
              Delete all mock data
            </button>
          </div>
        </section>

        {status.kind === 'busy' && <p className="hint">Working…</p>}
        {status.kind === 'done' && (
          <div className="callout">
            <strong>Done.</strong>
            <p>{status.message}</p>
          </div>
        )}
        {status.kind === 'error' && (
          <div className="callout danger">
            <strong>That did not work.</strong>
            <p>{status.message}</p>
          </div>
        )}
      </main>
    </AppGate>
  )
}

interface Profile {
  timezone: string
}

function Preferences() {
  const toast = useToast()
  const [timezone, setTimezone] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [savingTz, setSavingTz] = useState(false)
  const [persona, setPersona] = useState(DEFAULT_PERSONA)

  useEffect(() => {
    let live = true
    apiGet<{ profile: Profile | null }>('/api/profile')
      .then((d) => {
        if (!live) return
        setTimezone(d.profile?.timezone ?? '')
        setLoaded(true)
      })
      .catch(() => {
        if (live) setLoaded(true)
      })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem(PERSONA_KEY)
    if (stored) setPersona(stored)
  }, [])

  async function saveTimezone() {
    setSavingTz(true)
    try {
      await apiPatch('/api/profile', { timezone: timezone.trim() })
      toast.show('Time zone saved.')
    } catch {
      toast.show('Could not save time zone.', 'err')
    } finally {
      setSavingTz(false)
    }
  }

  function selectPersona(id: string) {
    setPersona(id)
    window.localStorage.setItem(PERSONA_KEY, id)
    toast.show('Persona updated.')
  }

  return (
    <section>
      <h2>Preferences</h2>

      <div className="card stack">
        <label className="field">
          <span>Time zone</span>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. America/New_York"
            disabled={!loaded}
          />
        </label>
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={saveTimezone}
            disabled={!loaded || savingTz}
          >
            Save time zone
          </button>
        </div>
      </div>

      <h3>Assistant persona</h3>
      <p className="hint">Sets the tone your assistant uses. You can change it any time.</p>
      <div className="persona-grid">
        {SAMPLE_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`persona-card ${persona === p.id ? 'selected' : ''}`}
            onClick={() => selectPersona(p.id)}
            aria-pressed={persona === p.id}
          >
            <h3>{p.displayName}</h3>
            <p className="tagline">{p.tagline}</p>
            <div className="persona-traits">
              {p.traits.map((t) => (
                <span key={t} className="pill">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
