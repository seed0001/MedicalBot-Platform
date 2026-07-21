'use client'

import { useEffect, useRef, useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import {
  SAMPLE_PERSONAS,
  getPersonaById,
  type AssistantPersona,
} from '@medbot/shared'

const PERSONA_STORAGE_KEY = 'medbot_persona'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
}

let messageId = 1

/** First-person greeting in the active persona's voice. */
function greeting(persona: AssistantPersona): string {
  return `Hi, I'm ${persona.displayName}. Live conversation is still on the way — it lands in Phase 3. Until then I can point you around: try “+ Log” to record a reading, or head to Assessments for a PHQ-9 or GAD-7. Everything you log starts trending right away.`
}

/** Honest, varied redirect — never invents clinical content. */
function redirect(persona: AssistantPersona, turn: number): string {
  const name = persona.displayName
  const options = [
    `I can't hold a real conversation just yet, ${name}'s live chat arrives in Phase 3. What does work today: log a reading with “+ Log” and it starts trending immediately.`,
    `Not quite yet — my live replies are Phase 3. In the meantime you can take a PHQ-9 or GAD-7 over on the Assessments page and see the score land on your timeline.`,
    `Real back-and-forth is coming in Phase 3, so I can't answer that one properly. You can still log a blood sugar, blood pressure, or weight reading right now, though.`,
    `I'm only a preview for now — the conversational part is Phase 3. Try the trends on your dashboard, or update a medication; both are fully working today.`,
    `Hang tight, live chat is Phase 3. For now: “+ Log” records readings, Assessments runs your questionnaires, and Trends shows how it all moves over time.`,
  ]
  return options[turn % options.length]
}

const SUGGESTIONS = [
  'How do I log my blood sugar?',
  'What can you track?',
  'Can you take a PHQ-9?',
]

export default function AssistantPage() {
  const toast = useToast()
  const [personaId, setPersonaId] = useState('maya')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const turnRef = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)

  const persona = getPersonaById(personaId) ?? SAMPLE_PERSONAS[0]

  // Resolve the saved persona on mount and seed the greeting.
  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(PERSONA_STORAGE_KEY)
        : null
    const resolved = getPersonaById(saved ?? '') ?? SAMPLE_PERSONAS[0]
    setPersonaId(resolved.id)
    setMessages([{ id: messageId++, role: 'assistant', text: greeting(resolved) }])
  }, [])

  // Keep the log pinned to the newest message.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  function send(text: string) {
    const body = text.trim()
    if (!body) return
    const turn = turnRef.current++
    setMessages((prev) => [
      ...prev,
      { id: messageId++, role: 'user', text: body },
      { id: messageId++, role: 'assistant', text: redirect(persona, turn) },
    ])
    setDraft('')
  }

  function choosePersona(next: AssistantPersona) {
    setPersonaId(next.id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, next.id)
    }
    setPickerOpen(false)
    toast.show(`Now chatting with ${next.displayName}.`, 'ok')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(draft)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
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
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPickerOpen(true)}
            >
              Change persona
            </button>
          </div>
        </div>

        <div className="callout">
          <strong>Preview</strong> — the assistant's live conversation arrives in
          Phase 3. Today it can show you around; everything else in the app
          (logging, assessments, trends, medications) already works.
        </div>

        <div className="chat">
          <div className="chat-log" ref={logRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`bubble ${
                  m.role === 'user' ? 'bubble-user' : 'bubble-assistant'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form className="chat-composer" onSubmit={onSubmit}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={`Message ${persona.displayName}…`}
              aria-label="Message the assistant"
            />
            <button type="submit" className="btn-primary" disabled={!draft.trim()}>
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
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <Modal
          open={pickerOpen}
          title="Choose a persona"
          onClose={() => setPickerOpen(false)}
          wide
        >
          <p className="hint">
            The persona sets tone and style only. Your choice is saved for next
            time.
          </p>
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
