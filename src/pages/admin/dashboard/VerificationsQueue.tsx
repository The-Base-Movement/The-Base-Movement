import { cn } from '@/lib/utils'
import type { PendingVerification } from '@/types/admin'
import type { NavigateFunction } from 'react-router-dom'

const AVATAR_PALETTE = [
  { bg: '#e8f5ee', color: '#006B3F' },
  { bg: '#fef3d0', color: '#a87d10' },
  { bg: '#fde8eb', color: '#CE1126' },
  { bg: '#e8eef8', color: '#1a5ba8' },
  { bg: '#f0e8f8', color: '#7b3fa0' },
]

function getAvatarStyle(name: string) {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}

function MemberAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const { bg, color } = getAvatarStyle(name)
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: photoUrl ? 'hsl(var(--container-low))' : bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 'var(--font-weight-semibold, 600)',
        color,
        fontFamily: "'Public Sans', sans-serif",
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
            if (el.parentElement) {
              el.parentElement.style.background = bg
              el.parentElement.textContent = initials
            }
          }}
        />
      ) : (
        initials
      )}
    </div>
  )
}

interface VerificationsQueueProps {
  pendingVerifications: PendingVerification[]
  onVerify: (id: string, approve: boolean) => Promise<void>
  navigate: NavigateFunction
}

export function VerificationsQueue({
  pendingVerifications,
  onVerify,
  navigate,
}: VerificationsQueueProps) {
  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3>ID verification queue</h3>
          <div className="meta">{pendingVerifications.length} pending · sorted by oldest first</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/verification')}>
          View all
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Reg. no.</th>
              <th>Region</th>
              <th>Submitted</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendingVerifications.slice(0, 5).map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="who">
                    <MemberAvatar name={member.name} photoUrl={member.photoUrl} />
                    <div>
                      <b>{member.name}</b>
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="reg">{member.id.slice(0, 8).toUpperCase()}</span>
                </td>
                <td>{member.chapter || member.region}</td>
                <td>{new Date(member.submitted).toLocaleDateString()}</td>
                <td>
                  <span
                    className={cn(
                      'pill',
                      member.status === 'Processing' || member.status === 'In Review'
                        ? 'pill-warn'
                        : 'pill-ok'
                    )}
                  >
                    {member.status}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ico ok"
                      onClick={() => navigate(`/admin/verification?id=${member.id}`)}
                    >
                      <span className="material-symbols-outlined">check</span>
                    </button>
                    <button className="ico no" onClick={() => onVerify(member.id, false)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <button
                      className="ico"
                      onClick={() => navigate(`/admin/verification?id=${member.id}`)}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingVerifications.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontStyle: 'italic',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  All verifications complete. Operational baseline maintained.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default VerificationsQueue
