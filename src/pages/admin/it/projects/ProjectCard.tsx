import { useState } from 'react'
import type { Project, ProjectStatus } from './types'
import { colFor, fmtDate, COLUMNS } from './types'

interface CardProps {
  project: Project
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: ProjectStatus) => void
}

export function ProjectCard({ project, onEdit, onDelete, onStatusChange }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const col = colFor(project.status)

  return (
    <div
      className="panel"
      style={{
        padding: '12px 14px 12px 18px',
        position: 'relative',
        overflow: 'visible',
        marginBottom: 10,
      }}
    >
      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: col.bar,
          borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {project.title}
          </p>
          {project.description && (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {project.description}
            </p>
          )}
          {(project.start_date || project.end_date) && (
            <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
              {fmtDate(project.start_date)}
              {project.end_date && ` → ${fmtDate(project.end_date)}`}
            </p>
          )}
        </div>

        {/* Actions menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
            >
              more_vert
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  background: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  minWidth: 170,
                  overflow: 'hidden',
                }}
              >
                {/* Move to */}
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'hsl(var(--on-surface-muted))',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  Move to
                </div>
                {COLUMNS.filter((c) => c.status !== project.status).map((c) => (
                  <button
                    key={c.status}
                    onClick={() => {
                      onStatusChange(c.status)
                      setMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: c.bar }}
                    >
                      {c.icon}
                    </span>
                    {c.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                <button
                  onClick={() => {
                    onEdit()
                    setMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '9px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    edit
                  </span>
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '9px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--destructive))',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    delete
                  </span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
