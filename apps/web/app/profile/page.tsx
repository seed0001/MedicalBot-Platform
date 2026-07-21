'use client'

import { useCallback, useEffect, useState } from 'react'
import { AppGate } from '../components/AppGate'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { formatDate, titleCase, toDateInput, ROLE_LABELS } from '@/lib/format'

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

interface ProfileData {
  profile: Profile | null
  careTeam: CareTeamMember[]
}

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function ProfilePage() {
  const toast = useToast()
  const [data, setData] = useState<ProfileData | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [editOpen, setEditOpen] = useState(false)
  const [providerOpen, setProviderOpen] = useState(false)

  useEffect(() => {
    let live = true
    setData(null)
    setError(false)
    apiGet<ProfileData>('/api/profile')
      .then((d) => {
        if (live) setData(d)
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  async function removeProvider(m: CareTeamMember) {
    if (!window.confirm(`Remove ${m.name} from your care team?`)) return
    try {
      await apiDelete(`/api/care-team/${m.id}`)
      toast.show('Provider removed.')
      refetch()
    } catch {
      toast.show('Could not remove provider.', 'err')
    }
  }

  return (
    <AppGate>
      <main>
        <div className="page-header">
          <h1>Profile</h1>
          <div className="page-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditOpen(true)}
              disabled={!data}
            >
              Edit profile
            </button>
          </div>
        </div>

        {error && <div className="card">Could not load your profile.</div>}
        {!data && !error && <p className="hint">Loading…</p>}

        {data && (
          <>
            {!data.profile ? (
              <div className="card">No profile recorded yet.</div>
            ) : (
              <div className="card">
                <dl className="detail-grid">
                  <div>
                    <dt>Name</dt>
                    <dd>{data.profile.displayName}</dd>
                  </div>
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{data.profile.dateOfBirth ? formatDate(data.profile.dateOfBirth) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Sex at birth</dt>
                    <dd>{data.profile.sexAtBirth ? titleCase(data.profile.sexAtBirth) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Height</dt>
                    <dd>{data.profile.heightCm ? `${data.profile.heightCm} cm` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Time zone</dt>
                    <dd>{data.profile.timezone}</dd>
                  </div>
                  <div>
                    <dt>Pharmacy</dt>
                    <dd>{data.profile.preferredPharmacy ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Emergency contact</dt>
                    <dd>
                      {data.profile.emergencyContactName ?? '—'}
                      {data.profile.emergencyContactPhone && (
                        <span className="hint"> {data.profile.emergencyContactPhone}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="divider" />

                <AllergiesEditor profile={data.profile} onSaved={refetch} />
              </div>
            )}

            <div className="page-header">
              <h2>Care team</h2>
              <div className="page-actions">
                <button type="button" className="btn-secondary" onClick={() => setProviderOpen(true)}>
                  + Add provider
                </button>
              </div>
            </div>

            {data.careTeam.length === 0 ? (
              <p className="hint">No providers recorded.</p>
            ) : (
              <div className="stack">
                {data.careTeam.map((m) => (
                  <div key={m.id} className="card">
                    <div className="card-head row-between">
                      <div>
                        <h3>{m.name}</h3>
                        <p className="hint">
                          {ROLE_LABELS[m.role] ?? titleCase(m.role)}
                          {m.organization && ` · ${m.organization}`}
                        </p>
                        {(m.phone || m.email) && (
                          <p className="hint">
                            {m.phone}
                            {m.phone && m.email && ' · '}
                            {m.email}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => removeProvider(m)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.profile && (
              <Modal open={editOpen} title="Edit profile" onClose={() => setEditOpen(false)} wide>
                <ProfileForm
                  profile={data.profile}
                  onDone={() => {
                    setEditOpen(false)
                    refetch()
                    toast.show('Profile updated.')
                  }}
                  onError={() => toast.show('Could not save profile.', 'err')}
                />
              </Modal>
            )}

            <Modal open={providerOpen} title="Add provider" onClose={() => setProviderOpen(false)} wide>
              <ProviderForm
                onDone={() => {
                  setProviderOpen(false)
                  refetch()
                  toast.show('Provider added.')
                }}
                onError={() => toast.show('Could not add provider.', 'err')}
              />
            </Modal>
          </>
        )}
      </main>
    </AppGate>
  )
}

function AllergiesEditor({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const toast = useToast()
  const [allergies, setAllergies] = useState<string[]>(profile.allergies)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  // Re-seed when the loaded profile changes (e.g. after a refetch).
  useEffect(() => {
    setAllergies(profile.allergies)
  }, [profile.allergies])

  function add() {
    const value = draft.trim()
    if (!value) return
    if (allergies.some((a) => a.toLowerCase() === value.toLowerCase())) {
      setDraft('')
      return
    }
    setAllergies((list) => [...list, value])
    setDraft('')
  }

  function remove(value: string) {
    setAllergies((list) => list.filter((a) => a !== value))
  }

  async function save() {
    setBusy(true)
    try {
      await apiPatch('/api/profile', { allergies })
      toast.show('Allergies saved.')
      onSaved()
    } catch {
      toast.show('Could not save allergies.', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <h3>Allergies</h3>
      {allergies.length === 0 ? (
        <p className="hint">None recorded.</p>
      ) : (
        <div className="chip-row">
          {allergies.map((a) => (
            <span key={a} className="badge badge-warn">
              {a}
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => remove(a)}
                aria-label={`Remove ${a}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="btn-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Add an allergy"
          aria-label="Add an allergy"
        />
        <button type="button" className="btn-secondary" onClick={add}>
          Add
        </button>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          Save allergies
        </button>
      </div>
    </div>
  )
}

function ProfileForm({
  profile,
  onDone,
  onError,
}: {
  profile: Profile
  onDone: () => void
  onError: () => void
}) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [dateOfBirth, setDateOfBirth] = useState(toDateInput(profile.dateOfBirth))
  const [sexAtBirth, setSexAtBirth] = useState(profile.sexAtBirth ?? '')
  const [heightCm, setHeightCm] = useState(profile.heightCm ?? '')
  const [timezone, setTimezone] = useState(profile.timezone)
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName ?? '')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone ?? '')
  const [preferredPharmacy, setPreferredPharmacy] = useState(profile.preferredPharmacy ?? '')
  const [busy, setBusy] = useState(false)

  const nameError = displayName.trim() === ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (nameError) return
    setBusy(true)
    try {
      await apiPatch('/api/profile', {
        displayName: displayName.trim(),
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        sexAtBirth: sexAtBirth || null,
        heightCm: heightCm.trim() === '' ? null : Number(heightCm),
        timezone: timezone.trim(),
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        preferredPharmacy: preferredPharmacy.trim() || null,
      })
      onDone()
    } catch {
      onError()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          {nameError && <span className="field-error">Name is required.</span>}
        </label>

        <label className="field">
          <span>Date of birth</span>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </label>

        <label className="field">
          <span>Sex at birth</span>
          <select value={sexAtBirth} onChange={(e) => setSexAtBirth(e.target.value)}>
            <option value="">—</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Height (cm)</span>
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            min={0}
          />
        </label>

        <label className="field">
          <span>Time zone</span>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>

        <label className="field">
          <span>Preferred pharmacy</span>
          <input value={preferredPharmacy} onChange={(e) => setPreferredPharmacy(e.target.value)} />
        </label>

        <label className="field">
          <span>Emergency contact name</span>
          <input
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Emergency contact phone</span>
          <input
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy || nameError}>
          Save changes
        </button>
      </div>
    </form>
  )
}

function ProviderForm({ onDone, onError }: { onDone: () => void; onError: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('primary_care')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const nameError = name.trim() === ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (nameError) return
    setBusy(true)
    try {
      await apiPost('/api/care-team', {
        name: name.trim(),
        role,
        organization: organization.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      onDone()
    } catch {
      onError()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          {nameError && <span className="field-error">Name is required.</span>}
        </label>

        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.keys(ROLE_LABELS).map((key) => (
              <option key={key} value={key}>
                {ROLE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Organization</span>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </label>

        <label className="field">
          <span>Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy || nameError}>
          Add provider
        </button>
      </div>
    </form>
  )
}
