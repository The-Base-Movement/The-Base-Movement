import { PAGE_SIZE, type Station } from './utils'
import { DotLoader } from '@/components/states'

interface PollingStationsTableProps {
  loading: boolean
  stations: Station[]
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalCount: number
  totalPages: number
}

export function PollingStationsTable({
  loading,
  stations,
  page,
  setPage,
  totalCount,
  totalPages,
}: PollingStationsTableProps) {
  return (
    <>
      {/* Table — desktop */}
      <div className="desktop-only">
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Code', 'Station name', 'Community', 'Constituency', 'Region', 'Members'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 9.5,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <DotLoader label="Loading stations…" />
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans'",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No polling stations match the current filters.
                  </td>
                </tr>
              ) : (
                stations.map((s, i) => (
                  <tr
                    key={s.code}
                    style={{
                      borderBottom:
                        i < stations.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      background: i % 2 === 0 ? '#fff' : 'hsl(var(--container-low))',
                    }}
                  >
                    <td style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          letterSpacing: '.02em',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {s.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12.5,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {s.name}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {s.community}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.constituency}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.region}
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      {s.member_count > 0 ? (
                        <span
                          className="pill pill-ok"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {s.member_count} registered
                        </span>
                      ) : (
                        <span
                          style={{
                            color: 'hsl(var(--on-surface-muted))',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                          }}
                        >
                          —
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

      {/* Card list — mobile */}
      <div className="mobile-only">
        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <DotLoader label="Loading stations…" />
          </div>
        ) : stations.length === 0 ? (
          <p
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No polling stations match the current filters.
          </p>
        ) : (
          stations.map((s, i) => (
            <div
              key={s.code}
              style={{
                padding: '12px 16px',
                borderBottom: i < stations.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {s.name}
                </div>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    background: 'hsl(var(--container-low))',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    letterSpacing: '.02em',
                    flexShrink: 0,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {s.code}
                </span>
              </div>
              {s.community && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    marginTop: 3,
                  }}
                >
                  {s.community}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {s.constituency}
                  {s.region ? ` · ${s.region}` : ''}
                </div>
                {s.member_count > 0 && (
                  <span
                    className="pill pill-ok"
                    style={{ fontSize: 9.5, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {s.member_count} registered
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderTop: '1px solid hsl(var(--border))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span
            style={{
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11.5,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{' '}
            {totalCount.toLocaleString()} stations
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ opacity: page <= 1 ? 0.4 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                chevron_left
              </span>
              Previous
            </button>
            <span
              style={{
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                minWidth: 80,
                textAlign: 'center',
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
