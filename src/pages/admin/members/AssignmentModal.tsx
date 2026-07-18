import { createPortal } from 'react-dom'
import { type Member } from '@/services/adminService'
import { type AdminRoleRecord } from '@/services/roleService'
import { type Chapter } from '@/types/admin'

interface AssignmentModalProps {
  isOpen: boolean
  assigningMembers: Member[]
  chapters: Chapter[]
  constituencies: { id: number; name: string; regionName?: string }[]
  roles: AdminRoleRecord[]
  data: {
    scopeType: 'chapter' | 'constituency'
    chapterId: string
    constituencyId: string
    role: string
  }
  onChange: (field: string, value: string) => void
  onConfirm: () => void
  onClose: () => void
  isSubmitting: boolean
}

function formatRoleName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const selectSt: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-normal, 400)',
  fontSize: 13,
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-normal, 400)',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export function AssignmentModal({
  isOpen,
  assigningMembers,
  chapters,
  constituencies,
  roles,
  data,
  onChange,
  onConfirm,
  onClose,
  isSubmitting,
}: AssignmentModalProps) {
  if (!isOpen) return null

  const isChapter = data.scopeType === 'chapter'
  const hasTarget = isChapter ? !!data.chapterId : !!data.constituencyId
  const canConfirm = hasTarget && !!data.role && !isSubmitting

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.55)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '24px 28px',
            borderTop: '4px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
              >
                military_tech
              </span>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                Appoint leadership
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                Assigning {assigningMembers.length} member(s) to command
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Scope toggle */}
          <div>
            <p style={{ ...labelSt, marginBottom: 8 }}>Assign to</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['chapter', 'constituency'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange('scopeType', type)}
                  style={{
                    flex: 1,
                    height: 38,
                    border: '1px solid',
                    borderColor:
                      data.scopeType === type ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    background: data.scopeType === type ? 'hsl(var(--primary))' : '#fff',
                    color: data.scopeType === type ? '#fff' : 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s',
                  }}
                >
                  {type === 'chapter' ? 'Diaspora Hub' : 'Constituency'}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter or Constituency selector */}
          {isChapter ? (
            <div>
              <label htmlFor="assign-chapter" style={labelSt}>
                Target chapter hub
              </label>
              <select
                id="assign-chapter"
                value={data.chapterId}
                onChange={(e) => onChange('chapterId', e.target.value)}
                style={selectSt}
              >
                <option value="">Select a chapter hub…</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city_or_region})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="assign-constituency" style={labelSt}>
                Target constituency
              </label>
              <select
                id="assign-constituency"
                value={data.constituencyId}
                onChange={(e) => onChange('constituencyId', e.target.value)}
                style={selectSt}
              >
                <option value="">Select a constituency…</option>
                {constituencies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.regionName ? ` — ${c.regionName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role selector — fetched from admin_roles */}
          <div>
            <label htmlFor="assign-role" style={labelSt}>
              Designated role
            </label>
            <select
              id="assign-role"
              value={data.role}
              onChange={(e) => onChange('role', e.target.value)}
              style={selectSt}
            >
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {formatRoleName(r.name)}
                  {r.description ? ` — ${r.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Audit notice */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(218,165,32,.08)',
              borderLeft: '3px solid hsl(var(--accent))',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              This appointment will be logged in the permanent audit trail. Appointed leaders gain
              administrative oversight for their assigned {isChapter ? 'chapter' : 'constituency'}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {isSubmitting ? 'Processing…' : 'Confirm appointment'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
