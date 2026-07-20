'use client'

import { Loaded } from '../components/Loader'
import { formatDateTime, titleCase } from '@/lib/format'

interface Appointment {
  id: string
  title: string
  type: string
  location: string | null
  startsAt: string
  endsAt: string | null
  prepNotes: string | null
  visitNotes: string | null
  providerName: string | null
  googleEventId: string | null
}

function AppointmentCard({ a, past }: { a: Appointment; past: boolean }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>{a.title}</h3>
          <p className="hint">
            {formatDateTime(a.startsAt)}
            {a.providerName && ` · ${a.providerName}`}
          </p>
        </div>
        <span className="badge">{titleCase(a.type)}</span>
      </div>

      {a.location && <p className="hint">{a.location}</p>}

      {a.prepNotes && !past && (
        <div className="callout">
          <strong>Before this visit</strong>
          <p>{a.prepNotes}</p>
        </div>
      )}

      {a.visitNotes && (
        <div className="callout">
          <strong>Visit notes</strong>
          <p>{a.visitNotes}</p>
        </div>
      )}

      {!a.googleEventId && (
        <p className="hint">Not synced to Google Calendar yet — that lands in Phase 4.</p>
      )}
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <main>
      <h1>Appointments</h1>

      <Loaded<{ upcoming: Appointment[]; past: Appointment[] }> path="/api/appointments">
        {(d) => (
          <>
            <section>
              <h2>Upcoming</h2>
              {d.upcoming.length === 0 ? (
                <p className="hint">Nothing scheduled.</p>
              ) : (
                <div className="stack">
                  {d.upcoming.map((a) => (
                    <AppointmentCard key={a.id} a={a} past={false} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2>Past</h2>
              {d.past.length === 0 ? (
                <p className="hint">No past visits recorded.</p>
              ) : (
                <div className="stack">
                  {d.past.map((a) => (
                    <AppointmentCard key={a.id} a={a} past />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </Loaded>
    </main>
  )
}
