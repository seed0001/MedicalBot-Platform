'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { apiGet, NotAuthenticated } from '@/lib/api'

/**
 * Fetch-and-render wrapper. Every page needs the same three states, and an
 * unauthenticated response needs to say so plainly rather than showing an empty
 * page that looks like "you have no data".
 */
export function Loaded<T>({
  path,
  children,
}: {
  path: string
  children: (data: T) => ReactNode
}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<'auth' | 'other' | null>(null)

  useEffect(() => {
    let cancelled = false
    apiGet<T>(path)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof NotAuthenticated ? 'auth' : 'other')
      })
    return () => {
      cancelled = true
    }
  }, [path])

  if (error === 'auth') {
    return (
      <div className="card">
        <p>
          <strong>Not signed in.</strong>
        </p>
        <p className="hint">
          Head back to the <a href="/">home page</a> and sign in to view this.
        </p>
      </div>
    )
  }

  if (error === 'other') {
    return (
      <div className="card">
        <p>
          <strong>Could not load this page.</strong>
        </p>
        <p className="hint">The API did not respond as expected. Is it running?</p>
      </div>
    )
  }

  if (!data) return <p className="hint">Loading…</p>

  return <>{children(data)}</>
}
