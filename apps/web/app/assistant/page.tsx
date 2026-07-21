'use client'

import { useEffect, useRef, useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { apiDelete, apiGet, apiPost, ApiError } from '@/lib/api'
import { SAMPLE_PERSONAS, getPersonaById, type AssistantPersona } from '@medbot/shared'

const PERSONA_STORAGE_KEY = 'medbot_persona'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  actions?: string[]
}

let messageId = 1

function greeting(persona: AssistantPersona): string {
  return `Hi, I'm ${persona.displayName}. Tell me how you're doing, or just ask — I can log a reading ("my sugar was 142 before dinner"), add a medication, note that you took a dose, book an appointment, or pull up your trends. What's on your mind?`
}

const SUGGESTIONS = [
  'Log my blood sugar at 132 before dinner',
  'What medications am I on?',
  'How has my blood pressure been this week?',
]

export default function AssistantPage() {
  const toast = useToast()
  const [personaId, setPersonaId] = useState('maya')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const persona = getPersonaById(personaId) ?? SAMPLE_PERSONAS[0]

  // Resolve persona + load the saved conversation on mount.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(PERSONA_STORAGE_KEY) : null
    const resolved = getPersonaById(saved ?? '') ?? SAMPLE_PERSONAS[0]
    setPersonaId(resolved.id)

    apiGet<{ messages: Array<{ role: string; content: string }>; configured: boolean }>(
      '/api/assistant/history',
    )
      .then((d) => {
        setConfigured(d.configured)
        if (d.messages.length) {
          setMessages(
            d.messages.map((m) => ({
              id: messageId++,
              role: m.role === 'user' ? 'user' : 'assistant',
              text: m.content,
            })),
          )
        } else {
          setMessages([{ id: messageId++, role: 'assistant', text: greeting(resolved) }])
        }
      })
      .catch(() => {
        setConfigured(true)
        setMessages([{ id: messageId++, role: 'assistant', text: greeting(resolved) }])
      })
  }, [])

  // Keep the log pinned to the newest message.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, sending])

  async function send(text: string) {
    const body = text.trim()
    if (!body || sending) return
    setMessages((prev) => [...prev, { id: messageId++, role: 'user', text: body }])
    setDraft('')
    setSending(true)
    try {
      const res = await apiPost<{ reply: string; actions: string[]; model: string }>(
        '/api/assistant/chat',
        { message: body, personaId },
      )
      setConfigured(true)
      setMessages((prev) => [
        ...prev,
        { id: messageId++, role: 'assistant', text: res.reply, actions: res.actions },
      ])
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        setConfigured(false)
        setMessages((prev) => [
          ...prev,
          {
            id: messageId++,
            role: 'assistant',
            text: 'I need OPENROUTER_API_KEY set on the server before I can chat. Everything else in the app works in the meantime.',
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { id: messageId++, role: 'assistant', text: 'Sorry — I had trouble responding. Please try again.' },
        ])
        toast.show('Assistant error.', 'err')
      }
    } finally {
      setSending(false)
    }
  }

  async function clearChat() {
    try {
      await apiDelete('/api/assistant/history')
    } catch {
      /* clearing locally is enough even if the request fails */
    }
    setMessages([{ id: messageId++, role: 'assistant', text: greeting(persona) }])
    toast.show('Conversation cleared.')
  }

  function choosePersona(next: AssistantPersona) {
    setPersonaId(next.id)
    if (typeof window !== 'undefined') window.localStorage.setItem(PERSONA_STORAGE_KEY, next.id)
    setPickerOpen(false)
    toast.show(`Now chatting with ${next.displayName}.`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(draft)
    }
  }

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <div>
            <h1>Assistant</h1>
            <p className="muted">
              {persona.displayName} · {persona.tagline}
            </p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn-ghost btn-sm" onClick={clearChat}>
              Clear
            </button>
            <button type="button" className="btn-ghost" onClick={() => setPickerOpen(true)}>
              Change persona
            </button>
          </div>
        </div>

        {configured === false && (
          <div className="callout danger">
            <strong>Assistant not enabled.</strong>
            <p>
              Set <code>OPENROUTER_API_KEY</code> on the API service to turn on live conversation.
              Everything else in the app works without it.
            </p>
          </div>
        )}

        <div className="chat">
          <div className="chat-log" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id}>
                <div className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                  {m.text}
                </div>
                {m.actions && m.actions.length > 0 && (
                  <div className="chip-row" style={{ marginTop: '0.35rem' }}>
                    {m.actions.map((a, i) => (
                      <span key={i} className="pill">
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="bubble bubble-assistant" aria-live="polite">
                <span className="muted">{persona.displayName} is thinking…</span>
              </div>
            )}
          </div>

          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault()
              void send(draft)
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={`Message ${persona.displayName}…`}
              aria-label="Message the assistant"
              disabled={configured === false}
            />
            <button type="submit" className="btn-primary" disabled={!draft.trim() || sending || configured === false}>
              Send
            </button>
          </form>
        </div>

        <div className="btn-row">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => void send(s)}
              disabled={sending || configured === false}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="hint">
          The assistant can log and update your records, but it never diagnoses, prescribes, or
          changes a dose — and it can only draft messages to your care team, never send them.
        </p>

        <Modal open={pickerOpen} title="Choose a persona" onClose={() => setPickerOpen(false)} wide>
          <p className="hint">The persona sets tone and style only. Your choice is saved for next time.</p>
          <div className="persona-grid">
            {SAMPLE_PERSONAS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`persona-card ${p.id === persona.id ? 'selected' : ''}`}
                onClick={() => choosePersona(p)}
              >
                <h3>{p.displayName}</h3>
                <p className="muted">{p.tagline}</p>
                <div className="persona-traits">
                  {p.traits.map((t) => (
                    <span key={t} className="pill">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Modal>
      </main>
    </AppGate>
  )
}
