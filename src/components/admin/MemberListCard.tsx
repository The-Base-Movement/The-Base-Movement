import type { Member } from '@/services/adminService'

interface Props {
  member: Member
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onView: (member: Member) => void
  onAudit: (member: Member) => void
}

export default function MemberListCard({ member, isSelected, onToggleSelect, onView, onAudit }: Props) {
  const statusClass =
    member.status === 'Active' || member.status === 'Approved' ? 'pill pill-ok'
    : member.status === 'Pending' ? 'pill pill-warn'
    : member.status === 'Suspended' ? 'pill pill-err'
    : 'pill pill-mute'

  const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2)

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    fontSize: 12,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    color: 'hsl(var(--on-surface-muted))',
  }

  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: '1px solid hsl(var(--border))',
      background: isSelected ? 'rgba(0,107,63,.04)' : '#fff',
      boxShadow: isSelected ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
    }}>

      {/* Row 1: checkbox · avatar · name + reg · status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(member.id)}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        />
        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid hsl(var(--border))', overflow: 'hidden', background: '#f1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {member.avatarUrl
            ? <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" />
            : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>{initials}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.name}
          </p>
          <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {member.id.substring(0, 12).toUpperCase()}
          </span>
        </div>
        <span className={statusClass} style={{ flexShrink: 0 }}>{member.status}</span>
      </div>

      {/* Row 2: region · constituency */}
      {member.region && (
        <div style={metaStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>place</span>
          {member.region}{member.constituency ? ` · ${member.constituency}` : ''}
        </div>
      )}

      {/* Row 3: phone */}
      {member.phone && (
        <div style={metaStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>call</span>
          {member.phone}
        </div>
      )}

      {/* Row 4: Audit (ghost, left) · View (primary, fills right) */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onAudit(member)}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>history</span>
          Audit
        </button>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => onView(member)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
          View profile
        </button>
      </div>

    </div>
  )
}
