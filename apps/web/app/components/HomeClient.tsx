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
  const [demoAvailable, setDemoAvailable] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)

  const loadSession = useCallback(async () => {
    const [legalRes, meRes, healthRes] = await Promise.all([
      apiFetch('/legal'),
      apiFetch('/auth/me'),
      apiFetch('/health'),
    ])
    if (legalRes.ok) setLegal(await legalRes.json())
    if (meRes.ok) setUser(await meRes.json())
    else setUser(null)
    // The demo entry point only appears when the API actually has DEMO_MODE on.
    if (healthRes.ok) {
      const health = (await healthRes.json()) as { checks?: { demoMode?: boolean } }
      setDemoAvailable(Boolean(health.checks?.demoMode))
    }
    setLoading(false)
  }, [])

  const enterDemo = useCallback(async () => {
    setDemoBusy(true)
    const res = await apiFetch('/auth/demo', { method: 'POST', body: '{}' })
    if (res.ok) window.location.href = '/dashboard'
    else setDemoBusy(false)
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
            <Link className="btn-primary" href="/dashboard">
              Open the dashboard
            </Link>
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

      {demoAvailable && !signedIn && (
        <div className="card">
          <strong>Explore with mock data</strong>
          <p className="hint">
            Signs you into a demo account preloaded with 90 days of generated readings — no
            Google account needed. Clear it any time from Settings.
          </p>
          <button type="button" className="btn-secondary" onClick={() => void enterDemo()}>
            {demoBusy ? 'Loading…' : 'Enter demo'}
          </button>
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
          <li>An assistant with a personality you choose — warm, direct, professional, or your own</li>
          <li>Conditions, prescriptions, labs, doctor&apos;s orders, and visits — with glossaries that explain what they mean</li>
          <li>Diet, exercise, and sleep — meals, workouts, and weekly activity summaries</li>
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
