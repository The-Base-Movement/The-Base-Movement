import { createPortal } from 'react-dom'
import { type Member } from '@/services/adminService'
import { type Chapter } from '@/types/admin'

interface AssignmentModalProps {
  isOpen: boolean
  assigningMembers: Member[]
  chapters: Chapter[]
  data: { chapterId: string; role: string }
  onChange: (field: string, value: string) => void
  onConfirm: () => void
  onClose: () => void
  isSubmitting: boolean
}

export function AssignmentModal({
  isOpen,
  assigningMembers,
  chapters,
  data,
  onChange,
  onConfirm,
  onClose,
  isSubmitting,
}: AssignmentModalProps) {
  if (!isOpen) return null
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
          maxWidth: 440,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
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
                borderRadius: 4,
                background: 'rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                  fontWeight: 800,
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
                  fontWeight: 700,
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                Assigning {assigningMembers.length} member(s) to command
              </p>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label
              htmlFor="select-chapter-assign"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginBottom: 6,
              }}
            >
              Target chapter
            </label>
            <select
              name="chapterId"
              id="select-chapter-assign"
              value={data.chapterId}
              onChange={(e) => onChange('chapterId', e.target.value)}
              style={{
                width: '100%',
                height: 44,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '0 12px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                background: '#fff',
                color: 'hsl(var(--on-surface))',
                outline: 'none',
              }}
            >
              <option value="">Select a chapter hub…</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city_or_region})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="select-role-assign"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginBottom: 6,
              }}
            >
              Designated role
            </label>
            <select
              name="role"
              id="select-role-assign"
              value={data.role}
              onChange={(e) => onChange('role', e.target.value)}
              style={{
                width: '100%',
                height: 44,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '0 12px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                background: '#fff',
                color: 'hsl(var(--on-surface))',
                outline: 'none',
              }}
            >
              <option value="Chapter Coordinator">Chapter Coordinator</option>
              <option value="Mobilization Lead">Mobilization Lead</option>
              <option value="Communications Officer">Communications Officer</option>
              <option value="Logistics Commander">Logistics Commander</option>
              <option value="Regional Liaison">Regional Liaison</option>
            </select>
          </div>
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(218,165,32,.08)',
              borderLeft: '3px solid hsl(var(--accent))',
              borderRadius: 2,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              This appointment will be logged in the permanent audit trail. Appointed leaders gain
              administrative oversight for their specific chapter.
            </p>
          </div>
        </div>
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
            disabled={isSubmitting || !data.chapterId}
          >
            {isSubmitting ? 'Processing…' : 'Confirm appointment'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
