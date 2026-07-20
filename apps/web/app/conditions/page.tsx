'use client'

import { Loaded } from '../components/Loader'
import { METRIC_LABELS, formatDate, titleCase } from '@/lib/format'

interface TrackedMetric {
  type: string
  dailyPrompts: number
  targetMin: number | null
  targetMax: number | null
}

interface Threshold {
  id: string
  metric: string
  operator: 'lt' | 'gt'
  threshold: number
  occurrences: number
  windowHours: number
  severity: string
  message: string
}

interface Condition {
  id: string
  key: string
  label: string
  summary: string | null
  status: string
  diagnosedAt: string | null
  notes: string | null
  hasModule: boolean
  trackedMetrics: TrackedMetric[]
  thresholds: Threshold[]
  trends: Array<{ id: string; description: string; detect: string }>
}

function describeThreshold(t: Threshold): string {
  const dir = t.operator === 'lt' ? 'below' : 'above'
  const label = METRIC_LABELS[t.metric] ?? t.metric
  if (t.occurrences <= 1) return `${label} ${dir} ${t.threshold}`
  const window =
    t.windowHours >= 168
      ? `${Math.round(t.windowHours / 168)} week(s)`
      : `${Math.round(t.windowHours / 24)} day(s)`
  return `${label} ${dir} ${t.threshold}, ${t.occurrences}× within ${window}`
}

export default function ConditionsPage() {
  return (
    <main>
      <h1>Conditions</h1>
      <p className="muted">
        Each condition loads a module that decides what gets tracked and what the target
        ranges are. Where two conditions track the same metric, the stricter band wins.
      </p>

      <Loaded<{ conditions: Condition[] }> path="/api/conditions">
        {(d) => (
          <div className="stack">
            {d.conditions.map((c) => (
              <div key={c.id} className="card">
                <div className="card-head">
                  <div>
                    <h2>{c.label}</h2>
                    <p className="hint">
                      {titleCase(c.status)}
                      {c.diagnosedAt && ` · diagnosed ${formatDate(c.diagnosedAt)}`}
                    </p>
                  </div>
                  {!c.hasModule && <span className="badge badge-warn">No module yet</span>}
                </div>

                {c.summary && <p>{c.summary}</p>}
                {c.notes && <p className="hint">{c.notes}</p>}

                {!c.hasModule ? (
                  <p className="hint">
                    Recorded on your profile, but nothing tracks it automatically yet. Adding a
                    module is one new file in <code>packages/conditions</code>.
                  </p>
                ) : (
                  <>
                    <h3>Tracked metrics</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Target</th>
                            <th>Prompts / day</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.trackedMetrics.map((m) => (
                            <tr key={m.type}>
                              <td>{METRIC_LABELS[m.type] ?? m.type}</td>
                              <td>
                                {m.targetMin === null && m.targetMax === null
                                  ? '—'
                                  : `${m.targetMin ?? ''}${m.targetMin !== null && m.targetMax !== null ? '–' : ''}${m.targetMax ?? ''}`}
                              </td>
                              <td>{m.dailyPrompts === 0 ? 'When you log it' : m.dailyPrompts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {c.thresholds.length > 0 && (
                      <>
                        <h3>Thresholds</h3>
                        <ul className="plain-list">
                          {c.thresholds.map((t) => (
                            <li key={t.id}>
                              <strong>{describeThreshold(t)}</strong>
                              <span className="hint">{t.message}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {c.trends.length > 0 && (
                      <>
                        <h3>Patterns worth watching</h3>
                        <ul className="plain-list">
                          {c.trends.map((t) => (
                            <li key={t.id}>
                              <strong>{t.description}</strong>
                              <span className="hint">{t.detect}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Loaded>
    </main>
  )
}
