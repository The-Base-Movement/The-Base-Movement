import type { AgendaPillar } from '@/pages/ouragenda/agendaData'
import type { CSSProperties } from 'react'

interface Props {
  pillars: AgendaPillar[]
  isLoading: boolean
  onEdit: (pillar: AgendaPillar) => void
  onDelete: (pillar: AgendaPillar) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onResetToDefaults: () => void
}

export default function PlanManagerPillarsPanel({
  pillars,
  isLoading,
  onEdit,
  onDelete,
  onMove,
  onResetToDefaults,
}: Props) {
  return (
    <div className="panel" style={{ padding: 24 }}>
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '3px solid hsl(var(--primary))',
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Loading plan pillars from command center…
          </p>
        </div>
      ) : pillars.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.5 }}
          >
            folder_open
          </span>
          <div>
            <h4 style={{ margin: 0, fontWeight: 'var(--font-weight-semibold, 600)', fontSize: 15 }}>
              No plan pillars seeded in the database
            </h4>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12.5,
                color: 'hsl(var(--on-surface-muted))',
                marginTop: 6,
                maxWidth: 380,
              }}
            >
              The `plan_pillars` table is currently empty. Click the button below to automatically
              seed the database with the default six aims.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onResetToDefaults}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              database
            </span>
            Seed initial default plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10.5,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Pillars of the Movement ({pillars.length})
          </p>

          <div className="table-responsive desktop-only">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={headerCellStyle}>Aim</th>
                  <th style={headerCellStyle}>Pillar details</th>
                  <th style={headerCellStyle}>Objectives</th>
                  <th style={{ ...headerCellStyle, textAlign: 'center', width: 100 }}>Order</th>
                  <th style={{ ...headerCellStyle, textAlign: 'right', width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pillars.map((pillar, idx) => (
                  <tr
                    key={pillar.id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '16px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 4,
                            background: `${pillar.color}15`,
                            color: pillar.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {pillar.icon}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 10,
                              color: pillar.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Aim {pillar.number}
                          </span>
                          <div
                            style={{
                              fontFamily: "'Courier New', monospace",
                              fontSize: 10,
                              color: 'hsl(var(--on-surface-muted))',
                              marginTop: 2,
                            }}
                          >
                            #{pillar.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'top', maxWidth: 360 }}>
                      <div
                        style={{
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {pillar.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 6,
                          lineHeight: 1.4,
                        }}
                      >
                        {pillar.summary}
                      </div>
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {pillar.objectives.length === 0 ? (
                          <span style={objectiveChipStyle}>No objectives defined</span>
                        ) : (
                          pillar.objectives.map((obj, i) => (
                            <span key={i} style={objectiveChipStyle}>
                              {obj.title}
                              <span
                                style={{
                                  fontSize: 9,
                                  opacity: 0.5,
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                }}
                              >
                                ({obj.items.length})
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          className="ico"
                          style={{ width: 28, height: 28 }}
                          disabled={idx === 0}
                          onClick={() => onMove(idx, 'up')}
                          title="Move Up"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            arrow_upward
                          </span>
                        </button>
                        <button
                          className="ico"
                          style={{ width: 28, height: 28 }}
                          disabled={idx === pillars.length - 1}
                          onClick={() => onMove(idx, 'down')}
                          title="Move Down"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            arrow_downward
                          </span>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => onEdit(pillar)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                            edit
                          </span>
                          Edit
                        </button>
                        <button className="btn btn-dest btn-sm" onClick={() => onDelete(pillar)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                            delete
                          </span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="mobile-only"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {pillars.map((pillar, idx) => (
              <div
                key={pillar.id}
                className="panel"
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: pillar.color,
                  }}
                />
                <div style={{ padding: '14px 16px 14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        background: `${pillar.color}15`,
                        color: pillar.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {pillar.icon}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10,
                          color: pillar.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Aim {pillar.number}
                      </span>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          marginTop: 2,
                        }}
                      >
                        {pillar.title}
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11.5,
                      color: 'hsl(var(--on-surface-muted))',
                      lineHeight: 1.5,
                      margin: '0 0 10px',
                    }}
                  >
                    {pillar.summary}
                  </p>
                  {pillar.objectives.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {pillar.objectives.map((obj, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {obj.title} <span style={{ opacity: 0.5 }}>({obj.items.length})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: '10px 16px 10px 20px',
                    borderTop: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
                    <button
                      className="ico"
                      style={{ width: 28, height: 28 }}
                      disabled={idx === 0}
                      onClick={() => onMove(idx, 'up')}
                      title="Move up"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        arrow_upward
                      </span>
                    </button>
                    <button
                      className="ico"
                      style={{ width: 28, height: 28 }}
                      disabled={idx === pillars.length - 1}
                      onClick={() => onMove(idx, 'down')}
                      title="Move down"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        arrow_downward
                      </span>
                    </button>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => onEdit(pillar)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      edit
                    </span>
                    Edit
                  </button>
                  <button
                    className="btn btn-dest btn-sm"
                    style={{ padding: '0 10px' }}
                    onClick={() => onDelete(pillar)}
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
        </div>
      )}
    </div>
  )
}

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
}

const objectiveChipStyle = {
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--container-low))',
  border: '1px solid hsl(var(--border))',
  padding: '2px 8px',
  borderRadius: 2,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}
