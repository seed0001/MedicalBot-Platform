'use client'

import { useCallback, useEffect, useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { LineChart } from '../components/Chart'
import { apiGet, apiPost } from '@/lib/api'
import { CONTEXT_LABELS, formatDate } from '@/lib/format'

// ---- API shapes -----------------------------------------------------------

interface CatalogItem {
  key: string
  title: string
  description: string
  cadenceDays: number
  questionCount: number
  recommended: boolean
}

interface Option {
  value: number
  label: string
}

interface Question {
  id: string
  prompt: string
  type: string
  options: Option[]
  required: boolean
  showIf: { questionId: string; equals: number | string | boolean } | null
}

interface Band {
  min: number
  max: number
  label: string
  severity: 'none' | 'mild' | 'moderate' | 'severe'
}

interface Definition {
  key: string
  title: string
  description: string
  cadenceDays: number
  questions: Question[]
  scoring: string
  bands: Band[]
  criticalItems: Array<{ questionId: string; atOrAbove: number }>
}

interface SubmitResult {
  key: string
  score: number
  band: Band | null
  criticalTriggered: string[]
}

interface HistoryInstrument {
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

// ---- helpers --------------------------------------------------------------

/** Map a band's clinical severity onto the .big-stat colour treatment. */
function statTone(severity: Band['severity'] | undefined): string {
  if (severity === 'severe') return 'low'
  if (severity === 'moderate' || severity === 'mild') return 'warn'
  return 'ok'
}

/** A one-line, non-diagnostic reading of where a score lands. */
function interpret(band: Band | null): string {
  switch (band?.severity) {
    case 'severe':
      return 'This falls in a higher range. It may be worth discussing with your care team.'
    case 'moderate':
      return 'This falls in a moderate range. Keep an eye on it and consider raising it at your next visit.'
    case 'mild':
      return 'This falls in a mild range. Worth watching over the next couple of weeks.'
    case 'none':
      return 'This falls in the lower range. Keep logging so patterns stay visible over time.'
    default:
      return 'Your answers were recorded and added to your timeline.'
  }
}

/** A question is asked only when its showIf condition (if any) is met. */
function isVisible(q: Question, answers: Record<string, number>): boolean {
  if (!q.showIf) return true
  return answers[q.showIf.questionId] === q.showIf.equals
}

// ---- take-flow modal ------------------------------------------------------

function TakeFlow({
  item,
  onClose,
  onDone,
}: {
  item: CatalogItem
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [def, setDef] = useState<Definition | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  useEffect(() => {
    let live = true
    apiGet<{ definition: Definition }>(`/api/assessments/${item.key}`)
      .then((d) => {
        if (live) setDef(d.definition)
      })
      .catch(() => {
        if (live) setLoadError(true)
      })
    return () => {
      live = false
    }
  }, [item.key])

  const visible = def ? def.questions.filter((q) => isVisible(q, answers)) : []
  const total = visible.length
  const answered = visible.filter((q) => answers[q.id] !== undefined).length
  const requiredRemaining = visible.filter(
    (q) => q.required && answers[q.id] === undefined,
  ).length
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100)

  async function submit() {
    if (!def) return
    setSubmitting(true)
    try {
      // Only submit answers for questions that are actually being asked.
      const payload: Record<string, number> = {}
      for (const q of visible) {
        if (answers[q.id] !== undefined) payload[q.id] = answers[q.id]
      }
      const res = await apiPost<SubmitResult>('/api/assessments', {
        key: def.key,
        answers: payload,
      })
      setResult(res)
    } catch {
      toast.show('Could not submit this assessment. Please try again.', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  // Scored result view.
  if (result) {
    return (
      <div className="stack">
        <div className="stat-right">
          <span className={`big-stat ${statTone(result.band?.severity)}`}>{result.score}</span>
          <span className="hint">{result.band?.label ?? 'No band'}</span>
        </div>

        <p>{interpret(result.band)}</p>

        {result.criticalTriggered.length > 0 && (
          <div className="alert alert-urgent">
            One or more of your answers may be worth discussing with your care team soon.
          </div>
        )}

        <p className="hint">
          This score has been added to your history so it trends alongside everything else you
          track.
        </p>

        <div className="btn-row">
          <button type="button" className="btn-primary" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="stack">
        <p className="hint">This assessment could not be loaded right now.</p>
        <div className="btn-row">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!def) {
    return <p className="hint">Loading…</p>
  }

  // Question-taking view.
  return (
    <div className="stack">
      {def.description && <p className="muted">{def.description}</p>}

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="hint">
        {answered} of {total} answered
      </p>

      {visible.map((q) => (
        <div key={q.id} className="question-block">
          <p className="question-prompt">
            {q.prompt}
            {!q.required && <span className="hint"> (optional)</span>}
          </p>
          <div className="scale-options">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`scale-option ${selected ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                >
                  <span className="scale-value">{opt.value}</span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="btn-row">
        <button
          type="button"
          className="btn-primary"
          disabled={requiredRemaining > 0 || submitting}
          onClick={submit}
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---- history section ------------------------------------------------------

function HistoryInstrumentCard({ inst }: { inst: HistoryInstrument }) {
  const points = inst.history
    .filter((h) => h.score !== null)
    .map((h) => ({ t: +new Date(h.completedAt), v: h.score as number }))
  const first = inst.history[0]?.score ?? null
  const last = inst.latest?.score ?? null
  const delta = first !== null && last !== null ? last - first : null

  return (
    <div className="card">
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
}

// ---- page -----------------------------------------------------------------

export default function AssessmentsPage() {
  const toast = useToast()
  const [tab, setTab] = useState<'take' | 'history'>('take')

  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null)
  const [history, setHistory] = useState<HistoryInstrument[] | null>(null)
  const [active, setActive] = useState<CatalogItem | null>(null)

  useEffect(() => {
    apiGet<{ instruments: CatalogItem[] }>('/api/assessments/catalog')
      .then((d) => setCatalog(d.instruments))
      .catch(() => setCatalog([]))
  }, [])

  const loadHistory = useCallback(() => {
    apiGet<{ instruments: HistoryInstrument[] }>('/api/questionnaires')
      .then((d) => setHistory(d.instruments))
      .catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  function finishTakeFlow() {
    setActive(null)
    loadHistory()
    toast.show('Assessment recorded.')
  }

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <h1>Assessments</h1>
        </div>
        <p className="muted">
          Validated questionnaires like PHQ-9 and GAD-7. Scores are saved to your timeline so they
          trend alongside everything else you track. This is for awareness, not diagnosis.
        </p>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'take' ? 'active' : ''}`}
            onClick={() => setTab('take')}
          >
            Take an assessment
          </button>
          <button
            type="button"
            className={`tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            History
          </button>
        </div>

        {tab === 'take' ? (
          catalog === null ? (
            <p className="hint">Loading…</p>
          ) : catalog.length === 0 ? (
            <div className="empty-state">
              <h3>No assessments available</h3>
              <p>There are no questionnaires to take right now.</p>
            </div>
          ) : (
            <div className="stack">
              {catalog.map((item) => (
                <div key={item.key} className="card">
                  <div className="card-head">
                    <div>
                      <h2>{item.title}</h2>
                      <p className="hint">
                        {item.questionCount} questions
                        {item.cadenceDays > 0 && ` · every ${item.cadenceDays} days`}
                      </p>
                    </div>
                    {item.recommended && <span className="pill">Recommended</span>}
                  </div>

                  {item.description && <p className="muted">{item.description}</p>}

                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setActive(item)}
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : history === null ? (
          <p className="hint">Loading…</p>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No assessments completed yet</h3>
            <p>Take one to start building a trend you can share with your care team.</p>
            <button type="button" className="btn-primary" onClick={() => setTab('take')}>
              Take an assessment
            </button>
          </div>
        ) : (
          <div className="stack">
            {history.map((inst) => (
              <HistoryInstrumentCard key={inst.key} inst={inst} />
            ))}
          </div>
        )}

        <Modal
          open={active !== null}
          title={active ? active.title : ''}
          onClose={() => setActive(null)}
          wide
        >
          {active && (
            <TakeFlow
              item={active}
              onClose={() => setActive(null)}
              onDone={finishTakeFlow}
            />
          )}
        </Modal>
      </main>
    </AppGate>
  )
}
