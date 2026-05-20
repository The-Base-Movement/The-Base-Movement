import { cn } from '@/lib/utils'
import type { PendingVerification } from '@/types/admin'
import type { NavigateFunction } from 'react-router-dom'

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
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        flexShrink: 0,
                      }}
                    >
                      {member.name[0]}
                    </div>
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
                    fontWeight: 700,
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
