import type { ChapterApplication } from '@/services/adminService'
import { Skeleton } from '@/components/states'

interface ChapterApplicationsTableProps {
  isLoading: boolean
  filteredApps: ChapterApplication[]
  onReject: (id: string, name: string) => Promise<void>
  onApprove: (id: string, name: string) => Promise<void>
  onRefresh: () => void
}

const ApplicantAvatar = ({ app }: { app: ChapterApplication }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 4,
      background: 'hsl(var(--container-low))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'var(--font-weight-medium, 500)',
      fontSize: 12,
      flexShrink: 0,
      overflow: 'hidden',
      color: 'hsl(var(--on-surface))',
      fontFamily: "'Public Sans', sans-serif",
    }}
  >
    {app.avatar_url ? (
      <img
        src={app.avatar_url}
        alt={app.applicant_name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      (app.applicant_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('') ?? '?')
    )}
  </div>
)

const statusStyle = (status: string | undefined) => {
  if (status === 'Approved') return { bg: 'rgba(0,168,89,0.1)', color: 'hsl(var(--primary))' }
  if (status === 'Pending') return { bg: 'rgba(218,165,32,0.1)', color: 'hsl(var(--accent))' }
  return { bg: 'rgba(206,17,38,0.1)', color: 'hsl(var(--destructive))' }
}

export function ChapterApplicationsTable({
  isLoading,
  filteredApps,
  onReject,
  onApprove,
  onRefresh,
}: ChapterApplicationsTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Panel header */}
      <div
        className="ph"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Active applications
          </span>
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Review and approve new chapter leaders
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="btn btn-outline btn-sm"
          style={{ width: 36, height: 36, padding: 0, flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            sync
          </span>
        </button>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Applicant', 'Proposed chapter', 'Geography', 'Status', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 24px',
                    textAlign: i === 4 ? 'right' : 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td colSpan={5} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Skeleton variant="avatar-sm" />
                      <Skeleton variant="text-sm" width="50%" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 60, textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
                  >
                    folder_open
                  </span>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 12,
                    }}
                  >
                    No leadership applications found
                  </p>
                </td>
              </tr>
            ) : (
              filteredApps.map((app: ChapterApplication) => {
                const s = statusStyle(app.status)
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ApplicantAvatar app={app} />
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontFamily: "'Public Sans', sans-serif",
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {app.applicant_name}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 9,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                              textTransform: 'uppercase',
                            }}
                          >
                            ID: {app.applicant_id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
                        >
                          verified_user
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontFamily: "'Public Sans', sans-serif",
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {app.proposed_chapter_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontFamily: "'Public Sans', sans-serif",
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {app.region}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-normal, 400)',
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {app.constituency}
                      </p>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span
                        className="pill"
                        style={{
                          background: s.bg,
                          color: s.color,
                          fontSize: 9,
                          fontWeight:
                            'var(--font-weight-medium, 500)' as React.CSSProperties['fontWeight'],
                          textTransform: 'uppercase',
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      {app.status === 'Pending' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => onReject(app.id, app.applicant_name || 'Applicant')}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onApprove(app.id, app.applicant_name || 'Applicant')}
                          >
                            Appoint
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            textTransform: 'uppercase',
                            color: 'hsl(var(--on-surface-muted))',
                            opacity: 0.4,
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mobile-only">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Skeleton variant="avatar-sm" />
                <Skeleton variant="text-sm" width="60%" />
              </div>
            </div>
          ))
        ) : filteredApps.length === 0 ? (
          <p
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            No leadership applications found
          </p>
        ) : (
          filteredApps.map((app: ChapterApplication) => {
            const s = statusStyle(app.status)
            return (
              <div
                key={app.id}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Top row: avatar + name + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ApplicantAvatar app={app} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {app.applicant_name}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-normal, 400)',
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {app.proposed_chapter_name}
                    </p>
                  </div>
                  <span
                    className="pill"
                    style={{
                      background: s.bg,
                      color: s.color,
                      fontSize: 9,
                      fontWeight:
                        'var(--font-weight-medium, 500)' as React.CSSProperties['fontWeight'],
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Action buttons — only for pending */}
                {app.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onReject(app.id, app.applicant_name || 'Applicant')}
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onApprove(app.id, app.applicant_name || 'Applicant')}
                    >
                      Appoint
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
