'use client'

import { useEffect, type ReactNode } from 'react'
import { useMe } from './useMe'

/**
 * Wraps every signed-in app page. Enforces the same soft gate the dashboard
 * introduced, in one place: unauthenticated users get a sign-in prompt, and a
 * user who hasn't finished intake is sent to /onboarding before the page paints.
 */
export function AppGate({ children }: { children: ReactNode }) {
  const state = useMe()

  useEffect(() => {
    if (state.status === 'signed-in' && !state.me.onboardedAt) {
      window.location.href = '/onboarding'
    }
  }, [state])

  if (state.status === 'loading') {
    return (
      <main>
        <p className="hint">Loading…</p>
      </main>
    )
  }

  if (state.status === 'anon') {
    return (
      <main>
        <div className="card">
          <p>
            <strong>Not signed in.</strong>
          </p>
          <p className="hint">
            Head back to the <a href="/">home page</a> and sign in to view this.
          </p>
        </div>
      </main>
    )
  }

  if (!state.me.onboardedAt) {
    // Redirect is in flight; avoid flashing the page.
    return (
      <main>
        <p className="hint">Redirecting to setup…</p>
      </main>
    )
  }

  return <>{children}</>
}
