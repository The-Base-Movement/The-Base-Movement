import type { Member } from '@/types/admin'

interface MemberProfileCardProps {
  member: Member
  setSelectedMember: (member: Member) => void
}

export function MemberProfileCard({ member, setSelectedMember }: MemberProfileCardProps) {
  const isVerified = member.status === 'Active' || member.status === 'Approved' || !member.status

  return (
    <button
      onClick={() => setSelectedMember(member)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
        padding: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--primary))'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,107,63,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--border))'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 4,
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--on-surface-muted))' }}
            >
              person
            </span>
          )}
        </div>
        <span className={isVerified ? 'pill pill-ok' : 'pill pill-warn'}>
          {isVerified ? 'Verified' : 'Pending'}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {member.profession}
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid hsl(var(--border))',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--primary))', flexShrink: 0 }}
          >
            location_on
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.platform === 'GHANA'
              ? member.constituency
                ? `${member.constituency}, ${member.region}`
                : member.region
              : member.country}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--primary))', flexShrink: 0 }}
          >
            public
          </span>
          <span>{member.platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network'}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: 'hsl(var(--primary))',
          }}
        >
          View profile
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
        >
          arrow_forward
        </span>
      </div>
    </button>
  )
}
