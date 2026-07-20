'use client'

import { Loaded } from '../components/Loader'
import { LineChart } from '../components/Chart'
import { CONTEXT_LABELS, formatDate } from '@/lib/format'

interface Instrument {
  key: string
  latest: {
    id: string
    score: number | null
    band: string | null
    completedAt: string
    criticalTriggered: string[]
  } | null
  history: Array<{ completedAt: string; score: number | null; band: string | null }>
}

export default function QuestionnairesPage() {
  return (
    <main>
      <h1>Assessments</h1>
      <p className="muted">
        Scores are stored as metrics, so they trend on the same timeline as everything else.
      </p>

      <Loaded<{ instruments: Instrument[] }> path="/api/questionnaires">
        {(d) =>
          d.instruments.length === 0 ? (
            <div className="card">No assessments completed yet.</div>
          ) : (
            <div className="stack">
              {d.instruments.map((inst) => {
                const points = inst.history
                  .filter((h) => h.score !== null)
                  .map((h) => ({ t: +new Date(h.completedAt), v: h.score as number }))
                const first = inst.history[0]?.score ?? null
                const last = inst.latest?.score ?? null
                const delta = first !== null && last !== null ? last - first : null

                return (
                  <div key={inst.key} className="card">
                    <div className="card-head">
                      <div>
                        <h2>{CONTEXT_LABELS[inst.key] ?? inst.key.toUpperCase()}</h2>
                        <p className="hint">
                          {inst.history.length} completed
                          {inst.latest && ` · last on ${formatDate(inst.latest.completedAt)}`}
                        </p>
                      </div>
                      <div className="stat-right">
                        <span className="big-stat">{inst.latest?.score ?? '—'}</span>
                        <span className="hint">{inst.latest?.band ?? 'No band'}</span>
                      </div>
                    </div>

                    {delta !== null && (
                      <p className="hint">
                        {delta === 0
                          ? 'Unchanged across the tracked window.'
                          : `${delta > 0 ? 'Up' : 'Down'} ${Math.abs(delta)} points since the first recorded score.`}
                      </p>
                    )}

                    <LineChart points={points} unit="points" height={150} />

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Band</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...inst.history].reverse().map((h) => (
                            <tr key={h.completedAt}>
                              <td>{formatDate(h.completedAt)}</td>
                              <td>
                                <strong>{h.score ?? '—'}</strong>
                              </td>
                              <td>{h.band ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
