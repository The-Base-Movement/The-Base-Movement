import type { Milestone } from '@/services/adminService'
import { pillBase, statusStyle, statusDot } from './utils'
import { SortToggle } from '@/components/ui/SortToggle'

interface RoadmapTableProps {
  filteredMilestones: Milestone[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (v: 'asc' | 'desc') => void
  handleOpenModal: (milestone: Milestone) => void
  handleDelete: (milestone: Milestone) => void
}

const SkeletonRow = () => (
  <tr style={{ animation: 'pulse 2s infinite' }}>
    <td>
      <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 200 }} />
    </td>
    <td>
      <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 80 }} />
    </td>
    <td>
      <div style={{ height: 22, background: 'hsl(var(--border))', borderRadius: 4, width: 90 }} />
    </td>
    <td>
      <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 90 }} />
    </td>
    <td>
      <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 60 }} />
    </td>
    <td>
      <div
        style={{
          height: 28,
          background: 'hsl(var(--border))',
          borderRadius: 4,
          width: 70,
          marginLeft: 'auto',
        }}
      />
    </td>
  </tr>
)

const SkeletonCard = () => (
  <div
    style={{
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      animation: 'pulse 2s infinite',
    }}
  >
    <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: '60%' }} />
    <div style={{ height: 12, background: 'hsl(var(--border))', borderRadius: 4, width: '85%' }} />
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ height: 22, background: 'hsl(var(--border))', borderRadius: 4, width: 80 }} />
      <div style={{ height: 22, background: 'hsl(var(--border))', borderRadius: 4, width: 60 }} />
    </div>
  </div>
)

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function RoadmapTable({
  filteredMilestones,
  isLoading,
  searchQuery,
  setSearchQuery,
  sortOrder,
  onSortChange,
  handleOpenModal,
  handleDelete,
}: RoadmapTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Panel header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
          >
            schedule
          </span>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            National objective timeline
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search milestones…"
              name="searchQuery"
              id="roadmap-search"
              placeholder="Search milestones…"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: 36,
                paddingLeft: 30,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 12,
                outline: 'none',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--on-surface))',
                width: 220,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <SortToggle value={sortOrder} onChange={onSortChange} />
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="rm-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Milestone objective</th>
              <th>Category</th>
              <th>Status</th>
              <th>Target date</th>
              <th>Priority</th>
              <th style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredMilestones.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  No strategic objectives found.
                </td>
              </tr>
            ) : (
              filteredMilestones.map((milestone) => (
                <tr key={milestone.id}>
                  <td>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        marginBottom: 3,
                      }}
                    >
                      {milestone.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 280,
                      }}
                    >
                      {milestone.description}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {milestone.category}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: statusDot(milestone.status),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ ...pillBase, ...statusStyle(milestone.status) }}>
                        {milestone.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        calendar_today
                      </span>
                      {formatDate(milestone.target_date!)}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color:
                        milestone.importance_level === 'Critical'
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {milestone.importance_level}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'hsl(var(--accent))',
                          color: '#fff',
                          border: 'none',
                          width: 34,
                          height: 34,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => handleOpenModal(milestone)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          edit
                        </span>
                      </button>
                      <button
                        className="btn btn-dest btn-sm"
                        style={{
                          width: 34,
                          height: 34,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => handleDelete(milestone)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="rm-cards-wrap">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredMilestones.length === 0 ? (
          <p
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No strategic objectives found.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
            {filteredMilestones.map((milestone) => (
              <div
                key={milestone.id}
                style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'hsl(var(--card))',
                }}
              >
                {/* Card body */}
                <div
                  style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {/* Title + priority */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                        lineHeight: 1.4,
                      }}
                    >
                      {milestone.title}
                    </p>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        flexShrink: 0,
                        color:
                          milestone.importance_level === 'Critical'
                            ? 'hsl(var(--destructive))'
                            : milestone.importance_level === 'High'
                              ? 'hsl(var(--accent))'
                              : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {milestone.importance_level}
                    </span>
                  </div>

                  {/* Description */}
                  {milestone.description && (
                    <p
                      style={
                        {
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        } as React.CSSProperties
                      }
                    >
                      {milestone.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    {/* Status pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: statusDot(milestone.status),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ ...pillBase, ...statusStyle(milestone.status) }}>
                        {milestone.status}
                      </span>
                    </div>

                    {/* Category */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface-muted))',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-xs)',
                        padding: '2px 7px',
                      }}
                    >
                      {milestone.category}
                    </span>

                    {/* Date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                        calendar_today
                      </span>
                      {formatDate(milestone.target_date!)}
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div
                  style={{
                    display: 'flex',
                    borderTop: '1px solid hsl(var(--border))',
                  }}
                >
                  <button
                    className="btn btn-sm btn-outline"
                    style={{
                      flex: 1,
                      borderRadius: 0,
                      border: 'none',
                      borderRight: '1px solid hsl(var(--border))',
                      justifyContent: 'center',
                      height: 38,
                    }}
                    onClick={() => handleOpenModal(milestone)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      edit
                    </span>
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    style={{
                      flex: 1,
                      borderRadius: 0,
                      border: 'none',
                      justifyContent: 'center',
                      height: 38,
                      color: 'hsl(var(--destructive))',
                    }}
                    onClick={() => handleDelete(milestone)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      delete
                    </span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .rm-cards-wrap { display: none; }
        @media (max-width: 768px) {
          .rm-table-wrap { display: none; }
          .rm-cards-wrap { display: block; }
        }
      `}</style>
    </div>
  )
}
