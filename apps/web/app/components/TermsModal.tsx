'use client'

import Link from 'next/link'
import { useState } from 'react'

interface TermsSection {
  heading: string
  body: string
}

interface TermsSummary {
  title: string
  intro: string
  sections: TermsSection[]
  checkboxLabel: string
}

interface TermsModalProps {
  summary: TermsSummary
  /** Pre-sign-in: user must agree before OAuth. Post-login: records acceptance. */
  mode: 'signup' | 'accept'
  open: boolean
  onAccept: () => void
  onCancel?: () => void
}

export function TermsModal({ summary, mode, open, onAccept, onCancel }: TermsModalProps) {
  const [checked, setChecked] = useState(false)

  if (!open) return null

  const title = mode === 'signup' ? summary.title : 'Terms updated — please review'

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="modal">
        <h2 id="terms-title">{title}</h2>
        <p>{summary.intro}</p>

        <div className="terms-scroll">
          {summary.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <p className="legal-links">
          <Link href="/terms" target="_blank">Terms of Use</Link>
          {' · '}
          <Link href="/privacy" target="_blank">Privacy Notice</Link>
        </p>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{summary.checkboxLabel}</span>
        </label>

        <div className="modal-actions">
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={!checked}
            onClick={onAccept}
          >
            {mode === 'signup' ? 'I agree — continue' : 'Accept and continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
