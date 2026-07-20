'use client'

import { useState } from 'react'
import { apiPost } from '@/lib/api'

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; message: string } | { kind: 'error'; message: string }

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
    <main>
      <h1>Settings</h1>

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
  )
}
