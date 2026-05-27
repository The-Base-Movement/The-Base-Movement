import { useState } from 'react'
import type { FieldReport } from '@/types/admin'

const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
}

const reportStatusStyle = (s: string): React.CSSProperties => {
  if (s === 'Verified')
    return {
      background: 'rgba(34,197,94,0.1)',
      color: 'hsl(var(--primary))',
      border: '1px solid rgba(34,197,94,0.2)',
    }
  if (s === 'Rejected')
    return {
      background: 'rgba(239,68,68,0.1)',
      color: 'hsl(var(--destructive))',
      border: '1px solid rgba(239,68,68,0.2)',
    }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}

type StatusFilter = 'ALL' | 'Pending' | 'Verified' | 'Rejected'

interface SituationalAwarenessFeedProps {
  reports: FieldReport[]
  onVerify: (reportId: string, status: 'Verified' | 'Rejected') => Promise<void>
}

export function SituationalAwarenessFeed({ reports, onVerify }: SituationalAwarenessFeedProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const filteredReports =
    statusFilter === 'ALL' ? reports : reports.filter((r) => r.status === statusFilter)

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
        }}
      >
        {/* Row 1: title + description */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Situational awareness feed
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            Real-time field intelligence
          </div>
        </div>

        {/* Row 2: filter select — full width */}
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            filter_list
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 32,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              background: 'hsl(var(--background))',
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
            }}
          >
            <option value="ALL">All reports ({reports.length})</option>
            <option value="Pending">
              Pending ({reports.filter((r) => r.status === 'Pending').length})
            </option>
            <option value="Verified">
              Verified ({reports.filter((r) => r.status === 'Verified').length})
            </option>
            <option value="Rejected">
              Rejected ({reports.filter((r) => r.status === 'Rejected').length})
            </option>
          </select>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            expand_more
          </span>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--border))' }}
          >
            sensors
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {reports.length === 0 ? 'Feed is quiet' : 'No reports match this filter'}
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: 800, overflowY: 'auto' }}>
          {filteredReports.map((report) => (
            <div key={report.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {report.media_url && (
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '21/9',
                    overflow: 'hidden',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <img
                    src={report.media_url}
                    alt="Field report"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    <span
                      style={{
                        ...pillBase,
                        ...reportStatusStyle(report.status),
                        background:
                          report.status === 'Verified'
                            ? 'hsl(var(--primary))'
                            : report.status === 'Rejected'
                              ? 'hsl(var(--destructive))'
                              : 'rgba(255,255,255,0.9)',
                        color:
                          report.status === 'Verified' || report.status === 'Rejected'
                            ? '#fff'
                            : 'hsl(var(--on-surface))',
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                  {report.location_lat && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        padding: '4px 10px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}
                      >
                        sensors
                      </span>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.8)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        GPS Verified
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid hsl(var(--border))',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      {report.users?.avatar_url ? (
                        <img
                          src={report.users.avatar_url}
                          alt={report.users.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          person
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {report.users?.full_name ??
                          `Member #${report.member_id.slice(0, 8).toUpperCase()}`}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 2,
                        }}
                      >
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!report.media_url && (
                    <span style={{ ...pillBase, ...reportStatusStyle(report.status) }}>
                      {report.status}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    marginBottom: report.status === 'Pending' ? 12 : 0,
                  }}
                >
                  {report.report_text ? `"${report.report_text}"` : 'No field notes provided.'}
                </p>
                {report.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-dest btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onVerify(report.id, 'Rejected')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        cancel
                      </span>
                      Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onVerify(report.id, 'Verified')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        check_circle
                      </span>
                      Verify
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
