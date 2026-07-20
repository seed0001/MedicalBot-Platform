const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Placeholder shell. Phase 2 replaces this with the metrics dashboard; for now
 * it exists so the web service has something to deploy and the OAuth redirect
 * has somewhere to land.
 */
export default function Home() {
  return (
    <main>
      <h1>MedicalBot</h1>
      <p className="muted">Personal health management assistant.</p>

      <div className="card">
        <p>
          <strong>Phase 1 — foundation.</strong> Auth, schema, and the API are in place.
          Metric tracking and the assistant come next.
        </p>
        <p>
          <a href={`${API_URL}/auth/google`}>Sign in with Google</a>
        </p>
      </div>

      <div className="card">
        <strong>What this will track</strong>
        <ul>
          <li>Blood glucose with meal context, weight, blood pressure, labs</li>
          <li>Medications and adherence, including why a dose was missed</li>
          <li>Sleep, mood, and side effects</li>
          <li>Standardized assessments (PHQ-9, GAD-7) trended over time</li>
          <li>Appointments, synced with Google Calendar</li>
        </ul>
      </div>

      <div className="notice">
        <strong>Not a medical device.</strong> It tracks your data and shows you patterns.
        It does not diagnose or prescribe, and it does not replace your care team.
      </div>
    </main>
  )
}
