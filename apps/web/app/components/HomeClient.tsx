'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { API_URL, apiFetch } from '../../lib/api'
import { TermsModal } from './TermsModal'

interface LegalPayload {
  version: string
  summary: {
    title: string
    intro: string
    sections: Array<{ heading: string; body: string }>
    checkboxLabel: string
  }
  loginReminder: string
}

interface MeResponse {
  id: string
  email: string
  needsTermsAcceptance: boolean
}

export function HomeClient() {
  const [legal, setLegal] = useState<LegalPayload | null>(null)
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [signupAgreed, setSignupAgreed] = useState(false)
  const [showSignupTerms, setShowSignupTerms] = useState(false)

  const loadSession = useCallback(async () => {
    const [legalRes, meRes] = await Promise.all([
      apiFetch('/legal'),
      apiFetch('/auth/me'),
    ])
    if (legalRes.ok) setLegal(await legalRes.json())
    if (meRes.ok) setUser(await meRes.json())
    else setUser(null)
    setLoading(false)
  }, [])

  const acceptTerms = useCallback(async () => {
    const res = await apiFetch('/auth/accept-terms', { method: 'POST' })
    if (res.ok) await loadSession()
  }, [loadSession])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  // After OAuth, auto-record acceptance if the user agreed on the signup screen.
  useEffect(() => {
    if (!user?.needsTermsAcceptance || !legal) return
    const pre = sessionStorage.getItem('terms_preconsent')
    if (pre === legal.version) {
      sessionStorage.removeItem('terms_preconsent')
      void acceptTerms()
    }
  }, [user, legal, acceptTerms])

  const signOut = async () => {
    await apiFetch('/auth/logout', { method: 'POST' })
    setUser(null)
    setSignupAgreed(false)
  }

  if (loading || !legal) {
    return <p className="muted">Loading…</p>
  }

  const signedIn = Boolean(user)
  const needsAcceptance = signedIn && user!.needsTermsAcceptance

  return (
    <>
      {signedIn && !needsAcceptance && (
        <div className="login-banner" role="status">
          <strong>Reminder:</strong> {legal.loginReminder}{' '}
          <Link href="/terms">Terms</Link>
        </div>
      )}

      <h1>MedicalBot</h1>
      <p className="muted">Personal health management assistant.</p>

      {signedIn ? (
        <div className="card">
          <p>Signed in as <strong>{user!.email}</strong></p>
          <p>
            <strong>Phase 1 — foundation.</strong> Auth, schema, and the API are in place.
            Metric tracking and the assistant come next.
          </p>
          <button type="button" className="btn-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="card">
          <p>
            <strong>Phase 1 — foundation.</strong> Auth, schema, and the API are in place.
            Metric tracking and the assistant come next.
          </p>

          {signupAgreed ? (
            <p>
              <a className="btn-primary" href={`${API_URL}/auth/google`}>
                Sign in with Google
              </a>
            </p>
          ) : (
            <p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowSignupTerms(true)}
              >
                Create account / Sign in
              </button>
            </p>
          )}

          <p className="hint">
            You must review and accept our Terms before signing in.
          </p>
        </div>
      )}

      <div className="card">
        <strong>What this will track</strong>
        <ul>
          <li>Blood glucose with meal context, weight, blood pressure, labs</li>
          <li>Medications and adherence, including why a dose was missed</li>
          <li>Sleep, mood, and side effects</li>
          <li>Standardized assessments (PHQ-9, GAD-7) trended over time</li>
          <li>Appointments, synced with Google Calendar</li>
        </ul>
      </div>

      <div className="notice">
        <strong>Not a medical device.</strong> It tracks your data and shows you patterns.
        It does not diagnose or prescribe, and it does not replace your care team.
        It is not HIPAA-certified.
      </div>

      <TermsModal
        summary={legal.summary}
        mode="signup"
        open={showSignupTerms}
        onCancel={() => setShowSignupTerms(false)}
        onAccept={() => {
          sessionStorage.setItem('terms_preconsent', legal.version)
          setSignupAgreed(true)
          setShowSignupTerms(false)
        }}
      />

      <TermsModal
        summary={legal.summary}
        mode="accept"
        open={needsAcceptance}
        onAccept={() => void acceptTerms()}
      />
    </>
  )
}
