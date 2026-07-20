'use client'

import { Loaded } from '../components/Loader'
import { formatDate } from '@/lib/format'

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

function describeSchedule(s: Schedule): string {
  if (s.kind === 'as_needed') return 'As needed'
  if (s.kind === 'interval_hours') return 'On an interval'
  if (!s.times?.length) return 'No times set'
  const times = s.times.join(', ')
  return `${s.times.length}× daily at ${times}${s.withFood ? ' · with food' : ''}`
}

export default function MedicationsPage() {
  return (
    <main>
      <h1>Medications</h1>
      <p className="muted">
        Adherence is calculated over the last 30 days. Late doses count as taken.
      </p>

      <Loaded<{ medications: Medication[] }> path="/api/medications">
        {(d) =>
          d.medications.length === 0 ? (
            <div className="card">No medications recorded.</div>
          ) : (
            <div className="stack">
              {d.medications.map((m) => {
                const pct = Math.round(m.adherence30d * 100)
                return (
                  <div key={m.id} className="card">
                    <div className="card-head">
                      <div>
                        <h2>
                          {m.name} <span className="muted">{m.dose}</span>
                        </h2>
                        <p className="hint">
                          {describeSchedule(m.schedule)}
                          {m.purpose && ` · ${m.purpose}`}
                        </p>
                      </div>
                      <div className="stat-right">
                        <span className={`big-stat ${pct >= 90 ? 'ok' : pct >= 75 ? 'warn' : 'low'}`}>
                          {pct}%
                        </span>
                        <span className="hint">30-day adherence</span>
                      </div>
                    </div>

                    <div className="meter" aria-hidden>
                      <div
                        className={`meter-fill ${pct >= 90 ? 'ok' : pct >= 75 ? 'warn' : 'low'}`}
                        style={{ width: `${pct}%` }}
                      />
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
                          {m.refillsRemaining === 0 && (
                            <span className="badge badge-warn">Needs refill</span>
                          )}
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

                    {m.schedule.instructions && (
                      <p className="hint">{m.schedule.instructions}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
      </Loaded>
    </main>
  )
}
