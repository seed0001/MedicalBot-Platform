'use client'

import { useEffect, useState } from 'react'
import { Loaded } from '../components/Loader'
import { apiGet } from '@/lib/api'
import { METRIC_LABELS, formatMetric } from '@/lib/format'

interface Tile {
  type: string
  targetMin: number | null
  targetMax: number | null
  latestValue: number | null
  latestSecondary: number | null
  latestAt: string | null
  latestContext: string | null
  unit: string | null
  count7d: number
  average7d: number | null
  inRange7d: number | null
}

interface Dashboard {
  displayName: string
  conditions: Array<{ key: string; label: string }>
  tiles: Tile[]
  adherence: {
    rate30d: number
    doses30d: number
    missed30d: number
    activeMedications: number
  }
  upcomingAppointments: Array<{
    id: string
    title: string
    startsAt: string
    location: string | null
  }>
}

export default function DashboardPage() {
  // Soft gate: a signed-in user who hasn't completed intake has no data to show,
  // so send them to setup before rendering the (empty) dashboard. Unauthenticated
  // users fall through to Loaded, which shows the "not signed in" state.
  const [gate, setGate] = useState<'checking' | 'ok'>('checking')

  useEffect(() => {
    let cancelled = false
    apiGet<{ onboardedAt: string | null }>('/auth/me')
      .then((me) => {
        if (cancelled) return
        if (!me.onboardedAt) window.location.href = '/onboarding'
        else setGate('ok')
      })
      .catch(() => {
        // Not signed in or API down: let Loaded render the appropriate state.
        if (!cancelled) setGate('ok')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (gate === 'checking') {
    return (
      <main>
        <p className="hint">Loading…</p>
      </main>
    )
  }

  return (
    <main>
      <Loaded<Dashboard> path="/api/dashboard">
        {(d) => (
          <>
            <h1>Hello, {d.displayName}</h1>
            <p className="muted">
              Tracking {d.conditions.map((c) => c.label).join(' and ') || 'no conditions yet'}.
            </p>

            <section>
              <h2>Last 7 days</h2>
              {d.tiles.every((t) => t.count7d === 0) ? (
                <p className="hint">No readings in the last week.</p>
              ) : (
                <div className="tile-grid">
                  {d.tiles
                    .filter((t) => t.count7d > 0)
                    .map((t) => (
                      <div key={t.type} className="tile">
                        <span className="tile-label">{METRIC_LABELS[t.type] ?? t.type}</span>
                        <span className="tile-value">
                          {formatMetric(t.type, t.latestValue, t.latestSecondary)}
                          {t.unit && t.unit !== 'mmHg' && (
                            <small> {t.unit.replace('score_', '').replace('_', '–')}</small>
                          )}
                        </span>
                        <span className="hint">
                          {t.count7d} reading{t.count7d === 1 ? '' : 's'}
                          {t.average7d !== null && ` · avg ${t.average7d}`}
                        </span>
                        {t.inRange7d !== null && (t.targetMin !== null || t.targetMax !== null) && (
                          <span
                            className={`badge ${t.inRange7d >= 0.7 ? 'badge-ok' : 'badge-warn'}`}
                          >
                            {Math.round(t.inRange7d * 100)}% in target
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section>
              <h2>Medications</h2>
              <div className="tile-grid">
                <div className="tile">
                  <span className="tile-label">Adherence, 30 days</span>
                  <span className="tile-value">{Math.round(d.adherence.rate30d * 100)}%</span>
                  <span className="hint">
                    {d.adherence.missed30d} of {d.adherence.doses30d} doses missed or skipped
                  </span>
                </div>
                <div className="tile">
                  <span className="tile-label">Active medications</span>
                  <span className="tile-value">{d.adherence.activeMedications}</span>
                  <span className="hint">
                    <a href="/medications">See the breakdown</a>
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h2>Coming up</h2>
              {d.upcomingAppointments.length === 0 ? (
                <p className="hint">Nothing scheduled.</p>
              ) : (
                <ul className="plain-list">
                  {d.upcomingAppointments.map((a) => (
                    <li key={a.id}>
                      <strong>{a.title}</strong>
                      <span className="hint">
                        {new Date(a.startsAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {a.location && ` · ${a.location}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </Loaded>
    </main>
  )
}
