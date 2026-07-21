'use client'

import { useEffect, useState } from 'react'

const PARSING_STEPS = [
  'Uploading your document…',
  'Reading pages…',
  'Extracting lab values and vitals…',
  'Matching collection dates…',
  'Pulling out findings and conclusions…',
  'Almost done…',
]

const SAVING_STEPS = [
  'Saving lab results…',
  'Recording vitals and measurements…',
  'Storing imaging report…',
  'Updating your health record…',
]

export function ImportParsingProgress({
  filename,
  mode = 'parsing',
}: {
  filename: string
  mode?: 'parsing' | 'saving'
}) {
  const steps = mode === 'saving' ? SAVING_STEPS : PARSING_STEPS
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const id = setInterval(() => {
      setStep((s) => (s + 1) % steps.length)
    }, 2800)
    return () => clearInterval(id)
  }, [steps.length, mode])

  return (
    <div className="import-progress" role="status" aria-live="polite" aria-busy="true">
      <div className="import-progress-spinner" aria-hidden="true" />
      <strong>{mode === 'saving' ? 'Saving your selections' : 'Reading your document'}</strong>
      <p className="hint import-progress-filename">{filename}</p>
      <div className="import-progress-track" aria-hidden="true">
        <div className="import-progress-bar" />
      </div>
      <p className="hint import-progress-step">{steps[step]}</p>
      {mode === 'parsing' && (
        <p className="hint">Trend reports with many dates can take up to a minute.</p>
      )}
    </div>
  )
}
