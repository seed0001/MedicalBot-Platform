'use client'

import { Loaded } from '../components/Loader'
import { formatDate, titleCase } from '@/lib/format'

interface Profile {
  displayName: string
  dateOfBirth: string | null
  sexAtBirth: string | null
  heightCm: string | null
  timezone: string
  allergies: string[]
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  preferredPharmacy: string | null
}

interface CareTeamMember {
  id: string
  name: string
  role: string
  organization: string | null
  phone: string | null
  email: string | null
}

export default function ProfilePage() {
  return (
    <main>
      <h1>Profile</h1>

      <Loaded<{ profile: Profile | null; careTeam: CareTeamMember[] }> path="/api/profile">
        {(d) => (
          <>
            {!d.profile ? (
              <div className="card">No profile recorded yet.</div>
            ) : (
              <div className="card">
                <dl className="detail-grid">
                  <div>
                    <dt>Name</dt>
                    <dd>{d.profile.displayName}</dd>
                  </div>
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{d.profile.dateOfBirth ? formatDate(d.profile.dateOfBirth) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Height</dt>
                    <dd>{d.profile.heightCm ? `${d.profile.heightCm} cm` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Time zone</dt>
                    <dd>{d.profile.timezone}</dd>
                  </div>
                  <div>
                    <dt>Pharmacy</dt>
                    <dd>{d.profile.preferredPharmacy ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Emergency contact</dt>
                    <dd>
                      {d.profile.emergencyContactName ?? '—'}
                      {d.profile.emergencyContactPhone && (
                        <span className="hint"> {d.profile.emergencyContactPhone}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <h3>Allergies</h3>
                {d.profile.allergies.length === 0 ? (
                  <p className="hint">None recorded.</p>
                ) : (
                  <div className="chip-row">
                    {d.profile.allergies.map((a) => (
                      <span key={a} className="badge badge-warn">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h2>Care team</h2>
            {d.careTeam.length === 0 ? (
              <p className="hint">No providers recorded.</p>
            ) : (
              <div className="stack">
                {d.careTeam.map((m) => (
                  <div key={m.id} className="card">
                    <div className="card-head">
                      <div>
                        <h3>{m.name}</h3>
                        <p className="hint">
                          {titleCase(m.role)}
                          {m.organization && ` · ${m.organization}`}
                        </p>
                      </div>
                      {m.phone && <span className="hint">{m.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Loaded>
    </main>
  )
}
