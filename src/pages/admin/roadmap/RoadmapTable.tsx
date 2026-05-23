import type { Milestone } from '@/services/adminService'
import { pillBase, statusStyle, statusDot } from './utils'

interface RoadmapTableProps {
  filteredMilestones: Milestone[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleOpenModal: (milestone: Milestone) => void
  handleDelete: (milestone: Milestone) => void
}

export function RoadmapTable({
  filteredMilestones,
  isLoading,
  searchQuery,
  setSearchQuery,
  handleOpenModal,
  handleDelete,
}: RoadmapTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
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
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            National objective timeline
          </div>
        </div>
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
            id="input-1c539d"
            placeholder="Search milestones…"
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
              background: '#fff',
              color: 'hsl(var(--on-surface))',
              width: 220,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
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
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ animation: 'pulse 2s infinite' }}>
                  <td>
                    <div
                      style={{
                        height: 14,
                        background: 'hsl(var(--border))',
                        borderRadius: 4,
                        width: 200,
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        background: 'hsl(var(--border))',
                        borderRadius: 4,
                        width: 80,
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 22,
                        background: 'hsl(var(--border))',
                        borderRadius: 4,
                        width: 90,
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        background: 'hsl(var(--border))',
                        borderRadius: 4,
                        width: 90,
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        background: 'hsl(var(--border))',
                        borderRadius: 4,
                        width: 60,
                      }}
                    />
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
              ))
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
                        fontWeight: 'var(--font-weight-semibold, 600)',
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
                      {new Date(milestone.target_date!).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
    </div>
  )
}
