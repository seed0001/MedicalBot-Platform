'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch, apiGet, apiPost, NotAuthenticated } from '@/lib/api'

/**
 * Signup intake. The Google account already exists by the time a user reaches
 * this screen — this is the short step that makes the account usable. Only one
 * thing is required: at least one condition, since that's what the dashboard is
 * built from. Name is pre-filled from Google; the rest is optional and editable
 * later, so the whole flow is a minute or less.
 */

interface ConditionOption {
  key: string
  label: string
  hasModule: boolean
}

interface IntakeState {
  onboardedAt: string | null
  profile: {
    displayName: string
    dateOfBirth: string | null
    sexAtBirth: string | null
  } | null
  conditions: string[]
  conditionOptions: ConditionOption[]
}

type Load = { kind: 'loading' } | { kind: 'auth' } | { kind: 'error' } | { kind: 'ready'; data: IntakeState }

export default function OnboardingPage() {
  const [load, setLoad] = useState<Load>({ kind: 'loading' })
  const [step, setStep] = useState<1 | 2>(1)

  const [displayName, setDisplayName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sexAtBirth, setSexAtBirth] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiGet<IntakeState>('/api/intake')
      .then((data) => {
        if (cancelled) return
        setDisplayName(data.profile?.displayName ?? '')
        setDateOfBirth(data.profile?.dateOfBirth ?? '')
        setSexAtBirth(data.profile?.sexAtBirth ?? '')
        setSelected(new Set(data.conditions))
        setLoad({ kind: 'ready', data })
      })
      .catch((e) => {
        if (cancelled) return
        setLoad({ kind: e instanceof NotAuthenticated ? 'auth' : 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const finish = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost('/api/intake', {
        displayName: displayName.trim(),
        dateOfBirth: dateOfBirth || null,
        sexAtBirth: sexAtBirth || null,
        conditions: [...selected],
      })
      window.location.href = '/dashboard'
    } catch {
      setSubmitError('Could not save your setup. Please try again.')
      setSubmitting(false)
    }
  }, [displayName, dateOfBirth, sexAtBirth, selected])

  if (load.kind === 'loading') return <main><p className="hint">Loading…</p></main>

  if (load.kind === 'auth') {
    return (
      <main>
        <div className="card">
          <p><strong>Not signed in.</strong></p>
          <p className="hint">
            Head back to the <a href="/">home page</a> and sign in to set up your account.
          </p>
        </div>
      </main>
    )
  }

  if (load.kind === 'error') {
    return (
      <main>
        <div className="card">
          <p><strong>Could not start setup.</strong></p>
          <p className="hint">The API did not respond as expected. Is it running?</p>
        </div>
      </main>
    )
  }

  const nameValid = displayName.trim().length > 0
  const conditionsValid = selected.size > 0

  return (
    <main>
      <h1>Welcome — let&apos;s set up your account</h1>
      <p className="muted">
        Two quick steps. We only ask for what the app needs to be useful on day one; you can
        add medications, allergies, and your care team any time.
      </p>
      <p className="hint">Step {step} of 2</p>

      {step === 1 && (
        <section>
          <h2>About you</h2>
          <div className="card">
            <label className="confirm-field">
              <span className="hint">Preferred name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                aria-label="Preferred name"
              />
            </label>

            <label className="confirm-field">
              <span className="hint">Date of birth (optional)</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                aria-label="Date of birth"
              />
            </label>

            <label className="confirm-field">
              <span className="hint">Sex at birth (optional)</span>
              <select value={sexAtBirth} onChange={(e) => setSexAtBirth(e.target.value)} aria-label="Sex at birth">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>

            <p className="hint">
              Date of birth and sex at birth are optional, but several clinical reference ranges
              are age- and sex-specific — providing them makes your targets more accurate.
            </p>
          </div>

          <p style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!nameValid}
            >
              Continue
            </button>
          </p>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>What are you managing?</h2>
          <p className="hint">
            Pick every condition you want help tracking. This is what shapes your dashboard,
            targets, and check-ins. You can change it later from your profile.
          </p>

          <div className="chip-row" style={{ marginTop: '1rem' }}>
            {load.data.conditionOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`chip ${selected.has(opt.key) ? 'chip-active' : ''}`}
                aria-pressed={selected.has(opt.key)}
                onClick={() => toggle(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="hint" style={{ marginTop: '0.75rem' }}>
            {conditionsValid
              ? `${selected.size} selected`
              : 'Select at least one to finish.'}
          </p>

          {submitError && (
            <div className="callout danger">
              <strong>That did not work.</strong>
              <p>{submitError}</p>
            </div>
          )}

          <p style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void finish()}
              disabled={!conditionsValid || !nameValid || submitting}
            >
              {submitting ? 'Saving…' : 'Finish setup'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginLeft: '0.75rem' }}
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Back
            </button>
          </p>
        </section>
      )}
    </main>
  )
}
