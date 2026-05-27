import type { ChapterApplication } from '@/services/adminService'
import { Skeleton } from '@/components/states'

interface ChapterApplicationsTableProps {
  isLoading: boolean
  filteredApps: ChapterApplication[]
  onReject: (id: string, name: string) => Promise<void>
  onApprove: (id: string, name: string) => Promise<void>
  onRefresh: () => void
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
      <div
        className="ph"
        style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              textTransform: 'uppercase',
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
              fontSize: 9,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
            }}
          >
            Review and approve new Chapter Leaders
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="btn btn-outline"
          style={{ width: 40, height: 40, padding: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            sync
          </span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              <th
                style={{
                  padding: '14px 32px',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Applicant
              </th>
              <th
                style={{
                  padding: '14px 32px',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Proposed chapter
              </th>
              <th
                style={{
                  padding: '14px 32px',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Geography
              </th>
              <th
                style={{
                  padding: '14px 32px',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '14px 32px',
                  textAlign: 'right',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Actions
              </th>
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
                <td colSpan={5} style={{ padding: 80, textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
                  >
                    folder_open
                  </span>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 16,
                    }}
                  >
                    No leadership applications found
                  </p>
                </td>
              </tr>
            ) : (
              filteredApps.map((app: ChapterApplication) => (
                <tr key={app.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        }}
                      >
                        {app.applicant_name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
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
                            textTransform: 'uppercase',
                          }}
                        >
                          ID: {app.applicant_id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
                      >
                        verified_user
                      </span>
                      <span
                        style={{ fontSize: 13, fontWeight: 'var(--font-weight-semibold, 600)' }}
                      >
                        {app.proposed_chapter_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                        }}
                      >
                        {app.constituency}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <span
                      className="pill"
                      style={{
                        background:
                          app.status === 'Approved'
                            ? 'rgba(0, 168, 89, 0.1)'
                            : app.status === 'Pending'
                              ? 'rgba(218, 165, 32, 0.1)'
                              : 'rgba(206, 17, 38, 0.1)',
                        color:
                          app.status === 'Approved'
                            ? 'hsl(var(--primary))'
                            : app.status === 'Pending'
                              ? 'hsl(var(--accent))'
                              : 'hsl(var(--destructive))',
                        fontSize: 9,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 32px', textAlign: 'right' }}>
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
                          Appoint Leader
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
                        }}
                      >
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
