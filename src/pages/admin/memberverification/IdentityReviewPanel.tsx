import { useMemo, useState } from 'react'
import { statusPill } from './utils'
import type { PendingVerification } from '@/services/adminService'
import type { Member } from '@/types/admin'
import type { Region, Constituency } from '@/types/registration'
import { JobSelector } from '@/components/JobSelector'
import { emptyJobSelection, type JobSelection } from '@/services/jobTaxonomyService'

interface IdentityReviewPanelProps {
  selectedMember: PendingVerification
  setShowPhotoFull: (val: boolean) => void
  aiResult: {
    confidence: number
    matches: string[]
    flagged: boolean
  } | null
  aiAnalyzing: boolean
  handleAiScan: () => Promise<void>
  onStatusChange: (status: PendingVerification['status']) => void
  onSaveEdit: (fields: Partial<Member> & { job?: JobSelection }) => Promise<void>
  dbRegions: Region[]
  dbConstituencies: Constituency[]
  dbCountries: string[]
  setViewingVaultRecord: (m: PendingVerification) => void
}

// The verification stages a reviewer can move a member between.
const STAGES: {
  status: PendingVerification['status']
  label: string
  icon: string
  color: string
}[] = [
  { status: 'In Review', label: 'In Review', icon: 'rate_review', color: 'hsl(var(--accent))' },
  { status: 'Processing', label: 'Processing', icon: 'hourglass_top', color: 'hsl(var(--accent))' },
  { status: 'Flagged', label: 'Flagged', icon: 'flag', color: '#a87d10' },
  { status: 'Rejected', label: 'Rejected', icon: 'cancel', color: 'hsl(var(--destructive))' },
  { status: 'Approved', label: 'Approved', icon: 'verified_user', color: 'hsl(var(--primary))' },
]

const editInputSt: React.CSSProperties = {
  width: '100%',
  height: 34,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 12.5,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
  outline: 'none',
}

export function IdentityReviewPanel({
  selectedMember,
  setShowPhotoFull,
  aiResult,
  aiAnalyzing,
  handleAiScan,
  onStatusChange,
  onSaveEdit,
  dbRegions,
  dbConstituencies,
  dbCountries,
  setViewingVaultRecord,
}: IdentityReviewPanelProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Member>>({})
  const [job, setJob] = useState<JobSelection>(emptyJobSelection)
  const [professionLabel, setProfessionLabel] = useState('')

  const isDiaspora = selectedMember.platform === 'DIASPORA'

  const startEdit = () => {
    setForm({
      name: selectedMember.name,
      phone: selectedMember.phone,
      region: selectedMember.region,
      constituency: selectedMember.constituency,
      country: selectedMember.country,
      emergencyName: selectedMember.emergencyName,
      emergencyPhone: selectedMember.emergencyPhone,
    })
    setJob(emptyJobSelection)
    setProfessionLabel(selectedMember.profession || '')
    setEditing(true)
  }

  const setField = (key: keyof Member, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Constituencies for the member's chosen region (matches the registration form).
  const constituencyOptions = useMemo(() => {
    const regionId = dbRegions.find((r) => r.name === form.region)?.id
    return dbConstituencies.filter((c) => !regionId || c.region_id === regionId)
  }, [dbRegions, dbConstituencies, form.region])

  const saveEdit = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    try {
      const jobPicked = job.industryId !== null || job.isOther
      await onSaveEdit({ ...form, ...(jobPicked ? { job, profession: professionLabel } : {}) })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const editLabelSt: React.CSSProperties = {
    display: 'block',
    fontSize: 9.5,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    marginBottom: 3,
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Dark identity header */}
      <div
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '3px solid hsl(var(--destructive))',
            borderBottom: '3px solid hsl(var(--primary))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
              background: 'radial-gradient(circle,rgba(218,165,32,.12),transparent 70%)',
            }}
          />
          <div
            className="verify-identity-row"
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            {/* Photo */}
            <button
              onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
              style={{
                width: 64,
                height: 72,
                borderRadius: 4,
                overflow: 'hidden',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.15)',
                flexShrink: 0,
                cursor: selectedMember.photoUrl ? 'zoom-in' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedMember.photoUrl ? (
                <img
                  src={selectedMember.photoUrl}
                  alt={selectedMember.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  decoding="async"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, color: 'rgba(255,255,255,.25)' }}
                >
                  person
                </span>
              )}
            </button>
            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'hsl(var(--accent))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Reviewing · {selectedMember.id}
              </div>
              <h3
                style={{
                  margin: '5px 0 6px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 20,
                  color: '#fff',
                  letterSpacing: '-.01em',
                  lineHeight: 1.1,
                }}
              >
                {selectedMember.name}
              </h3>
              <span className={statusPill(selectedMember.status)} style={{ fontSize: 10 }}>
                {selectedMember.status}
              </span>
            </div>
          </div>
        </div>

        {/* Field grid / inline edit form */}
        {editing ? (
          <div
            style={{
              background: 'hsl(var(--card))',
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={editLabelSt}>Full name</label>
                <input
                  style={editInputSt}
                  value={form.name || ''}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div>
                <label style={editLabelSt}>Phone</label>
                <input
                  style={editInputSt}
                  value={form.phone || ''}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>

              {isDiaspora ? (
                <div>
                  <label style={editLabelSt}>Country</label>
                  <select
                    style={editInputSt}
                    value={form.country || ''}
                    onChange={(e) => setField('country', e.target.value)}
                  >
                    <option value="">Select country</option>
                    {dbCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label style={editLabelSt}>Region</label>
                    <select
                      style={editInputSt}
                      value={form.region || ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, region: e.target.value, constituency: '' }))
                      }
                    >
                      <option value="">Select region</option>
                      {dbRegions.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={editLabelSt}>Constituency</label>
                    <select
                      style={editInputSt}
                      value={form.constituency || ''}
                      disabled={!form.region}
                      onChange={(e) => setField('constituency', e.target.value)}
                    >
                      <option value="">Select constituency</option>
                      {constituencyOptions.map((c) => (
                        <option key={`${c.region_id}-${c.name}`} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={editLabelSt}>
                  Profession{professionLabel ? ` · current: ${professionLabel}` : ''}
                </label>
                <JobSelector
                  value={job}
                  onChange={setJob}
                  onLabelChange={setProfessionLabel}
                  idPrefix="kyc-edit"
                />
              </div>

              <div>
                <label style={editLabelSt}>Emergency name</label>
                <input
                  style={editInputSt}
                  value={form.emergencyName || ''}
                  onChange={(e) => setField('emergencyName', e.target.value)}
                />
              </div>
              <div>
                <label style={editLabelSt}>Emergency phone</label>
                <input
                  style={editInputSt}
                  value={form.emergencyPhone || ''}
                  onChange={(e) => setField('emergencyPhone', e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={saveEdit}
                disabled={saving || !form.name?.trim()}
              >
                {saving ? 'Saving…' : 'Save & move to review'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'hsl(var(--card))', padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={startEdit}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, marginRight: 4 }}
                >
                  edit
                </span>
                Edit details
              </button>
            </div>
            <dl
              className="verify-field-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}
            >
              {[
                ['Platform', selectedMember.platform],
                ['Country', selectedMember.country],
                ['Gender', selectedMember.gender],
                ['Age range', selectedMember.ageRange],
                ['Region', selectedMember.region],
                ['Constituency', selectedMember.constituency],
                ['Profession', selectedMember.profession],
                ['Education', selectedMember.educationLevel],
                ['Phone', selectedMember.phone],
                ['Submitted', selectedMember.submitted],
                ["Voter's ID Card", selectedMember.votersIdCard],
                ['Polling Station', selectedMember.pollingStationCode],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt
                    style={{
                      fontSize: 9.5,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      fontFamily: "'Public Sans', sans-serif",
                      marginBottom: 2,
                    }}
                  >
                    {k}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {v || '—'}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Emergency contact */}
            {(selectedMember.emergencyName || selectedMember.emergencyPhone) && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    fontFamily: "'Public Sans', sans-serif",
                    marginBottom: 8,
                  }}
                >
                  Emergency contact
                </div>
                <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px' }}>
                  {[
                    ['Name', selectedMember.emergencyName],
                    ['Relation', selectedMember.emergencyRelationship],
                    ['Phone', selectedMember.emergencyPhone],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt
                        style={{
                          fontSize: 9.5,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          fontFamily: "'Public Sans', sans-serif",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        {v || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification checklist */}
      <div className="panel">
        <div className="ph2">
          <h3 style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Verification steps</h3>
          <span className="meta">auto-check</span>
        </div>
        <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Form submitted', done: true, required: true },
            { label: 'Photo uploaded', done: !!selectedMember.photoUrl, required: false },
            ...(selectedMember.platform === 'GHANA'
              ? [
                  {
                    label: `Constituency verified (${selectedMember.constituency || 'Not set'})`,
                    done: !!selectedMember.constituency,
                    required: true,
                  },
                ]
              : [
                  {
                    label: `Chapter assignment (${selectedMember.chapter || 'Not set'})`,
                    done: !!selectedMember.chapter,
                    required: false,
                  },
                ]),
          ].map(({ label, done, required }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: done ? 'rgba(0,107,63,.05)' : 'hsl(var(--container-low))',
                border: `1px solid ${done ? 'rgba(0,107,63,.18)' : 'hsl(var(--border))'}`,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done ? 'rgba(0,107,63,.12)' : 'rgba(0,0,0,.04)',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 13,
                    color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  {done ? 'check' : 'radio_button_unchecked'}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: done ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}
              </span>
              {!required && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Optional
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Security assistant */}
      <div className="panel">
        <div className="ph2">
          <h3 style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Security assistant</h3>
          {aiResult && (
            <span
              style={{
                padding: '2px 9px',
                borderRadius: 99,
                fontSize: 10,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                background: aiResult.flagged ? 'rgba(206,17,38,.1)' : 'rgba(0,107,63,.1)',
                color: aiResult.flagged ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.2)' : 'rgba(0,107,63,.2)'}`,
              }}
            >
              {aiResult.confidence}% match
            </span>
          )}
        </div>
        <div style={{ padding: '14px 22px' }}>
          {!aiResult && !aiAnalyzing && (
            <button
              className="btn btn-sm"
              onClick={handleAiScan}
              style={{
                width: '100%',
                justifyContent: 'center',
                background: 'hsl(var(--accent))',
                color: 'hsl(var(--on-surface))',
                fontWeight: 'var(--font-weight-medium, 500)',
                height: 40,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                memory
              </span>
              Execute identity scan
            </button>
          )}
          {aiAnalyzing && (
            <div style={{ padding: '18px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 28,
                  color: 'hsl(var(--accent))',
                  display: 'block',
                  marginBottom: 8,
                  animation: 'spin 1.5s linear infinite',
                }}
              >
                fingerprint
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
              >
                Analyzing identity…
              </p>
            </div>
          )}
          {aiResult && (
            <div
              style={{
                padding: '12px 14px',
                background: aiResult.flagged ? 'rgba(206,17,38,.06)' : 'rgba(0,107,63,.06)',
                border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.18)' : 'rgba(0,107,63,.18)'}`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {aiResult.matches.map((m) => (
                  <span
                    key={m}
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,.05)',
                      borderRadius: 99,
                      fontSize: 10.5,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontStyle: 'italic',
                }}
              >
                Neural scan of official records completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification stage control — move the member between stages */}
      <div className="panel" style={{ padding: '14px 18px' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Verification stage
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STAGES.map((s) => {
            const active = selectedMember.status === s.status
            const noPhoto = s.status === 'Approved' && !selectedMember.photoUrl
            const disabled = active || noPhoto
            return (
              <button
                key={s.status}
                onClick={() => onStatusChange(s.status)}
                disabled={disabled}
                title={noPhoto ? 'Profile photo is required to approve' : ''}
                style={{
                  gridColumn: s.status === 'Approved' ? '1 / -1' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  height: 42,
                  borderRadius: 6,
                  cursor: disabled ? 'default' : 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  border: `1px solid ${active ? s.color : 'hsl(var(--border))'}`,
                  background: active ? s.color : 'hsl(var(--card))',
                  color: active ? '#fff' : noPhoto ? 'hsl(var(--on-surface-muted))' : s.color,
                  opacity: noPhoto ? 0.55 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {active ? 'check' : s.icon}
                </span>
                {s.label}
              </button>
            )
          })}
        </div>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 10.5,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Currently{' '}
          <strong style={{ color: 'hsl(var(--on-surface))' }}>{selectedMember.status}</strong>.
          Editing the details moves the member back to In Review.
        </p>
      </div>

      {/* Biometric + audit vault links */}
      {selectedMember.photoUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
            onClick={() => setShowPhotoFull(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              photo_camera
            </span>
            Inspect biometric data
          </button>
          {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center' }}
              onClick={() => setViewingVaultRecord(selectedMember)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                database
              </span>
              Open audit vault
            </button>
          )}
        </div>
      )}
    </div>
  )
}
