import { useState, useEffect, type CSSProperties } from 'react'

type Activity = {
  id: string
  title: string
  description: string | null
  type: string
  activity_date: string
}

const lbl: CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

const inp: CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

const ACTIVITY_TYPES = ['Event', 'Action', 'Onboarding', 'Meeting', 'Outreach', 'Rally', 'Workshop']
const FILTER_OPTIONS = [
  'All',
  'Meeting',
  'Event',
  'Action',
  'Onboarding',
  'Outreach',
  'Rally',
  'Workshop',
]

interface Props {
  activities: Activity[]
  showActivityForm: boolean
  actTitle: string
  actDesc: string
  actType: string
  actDate: string
  actFilter: string
  isSavingActivity: boolean
  onShowForm: () => void
  onHideForm: () => void
  onTitleChange: (v: string) => void
  onDescChange: (v: string) => void
  onTypeChange: (v: string) => void
  onDateChange: (v: string) => void
  onFilterChange: (v: string) => void
  onAddActivity: () => void
  onDeleteActivity: (id: string) => void
}

export function ActivitiesTab({
  activities,
  showActivityForm,
  actTitle,
  actDesc,
  actType,
  actDate,
  actFilter,
  isSavingActivity,
  onShowForm,
  onHideForm,
  onTitleChange,
  onDescChange,
  onTypeChange,
  onDateChange,
  onFilterChange,
  onAddActivity,
  onDeleteActivity,
}: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filtered = actFilter === 'All' ? activities : activities.filter((a) => a.type === actFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!showActivityForm && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {isMobile ? (
            /* Mobile Filter Pill + Dropdown select */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onFilterChange('All')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${actFilter === 'All' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  background: actFilter === 'All' ? 'hsl(var(--primary))' : 'transparent',
                  color: actFilter === 'All' ? '#fff' : 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                All ({activities.length})
              </button>

              <select
                aria-label="Filter activities by type"
                value={actFilter === 'All' ? '' : actFilter}
                onChange={(e) => onFilterChange(e.target.value || 'All')}
                style={{
                  padding: '5px 24px 5px 10px',
                  borderRadius: 20,
                  border: `1px solid ${actFilter !== 'All' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  background: actFilter !== 'All' ? 'hsl(var(--primary) / 0.08)' : '#fff',
                  color:
                    actFilter !== 'All' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  cursor: 'pointer',
                  outline: 'none',
                  height: 28,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Filter Type...</option>
                {FILTER_OPTIONS.filter((f) => f !== 'All').map((f) => {
                  const count = activities.filter((a) => a.type === f).length
                  return (
                    <option key={f} value={f}>
                      {f} {count > 0 ? `(${count})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          ) : (
            /* Desktop Filter Pills */
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTER_OPTIONS.map((f) => {
                const count =
                  f === 'All' ? activities.length : activities.filter((a) => a.type === f).length
                const isActive = actFilter === f
                return (
                  <button
                    key={f}
                    onClick={() => onFilterChange(f)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: `1px solid ${isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      background: isActive ? 'hsl(var(--primary))' : 'transparent',
                      color: isActive ? '#fff' : 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f}
                    {count > 0 ? ` (${count})` : ''}
                  </button>
                )
              })}
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={onShowForm}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Add activity
          </button>
        </div>
      )}

      {showActivityForm && (
        <div className="panel" style={{ padding: '20px 22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
              >
                event_note
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                New activity
              </span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onHideForm}>
              Cancel
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="act-title" style={lbl}>
                Title
              </label>
              <input
                id="act-title"
                name="act-title"
                type="text"
                value={actTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="e.g. Voter registration drive"
                style={inp}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <div>
                <label htmlFor="act-type" style={lbl}>
                  Type
                </label>
                <select
                  id="act-type"
                  name="act-type"
                  value={actType}
                  onChange={(e) => onTypeChange(e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="act-date" style={lbl}>
                  Date
                </label>
                <input
                  id="act-date"
                  name="act-date"
                  type="date"
                  value={actDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  style={inp}
                />
              </div>
            </div>
            <div>
              <label htmlFor="act-desc" style={lbl}>
                Description (optional)
              </label>
              <textarea
                id="act-desc"
                name="act-desc"
                value={actDesc}
                onChange={(e) => onDescChange(e.target.value)}
                placeholder="Brief description of the activity…"
                rows={3}
                style={{
                  width: '100%',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  padding: '10px 12px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#fff',
                  color: 'hsl(var(--on-surface))',
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button
                className="btn btn-primary"
                onClick={onAddActivity}
                disabled={isSavingActivity}
              >
                {isSavingActivity ? 'Saving…' : 'Add activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="panel" style={{ padding: '48px 18px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
          >
            event_note
          </span>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              marginTop: 12,
            }}
          >
            {actFilter === 'All'
              ? 'No activities recorded yet.'
              : `No ${actFilter.toLowerCase()} activities yet.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => {
            const date = new Date(a.activity_date)
            const dayNum = date.getDate()
            const monStr = date.toLocaleDateString('en-GB', { month: 'short' })
            const fullDate = date.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            return (
              <div
                key={a.id}
                className="panel"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    background: 'hsl(var(--primary) / 0.08)',
                    border: '1px solid hsl(var(--primary) / 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {dayNum}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {monStr}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 2,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {a.title}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {a.type}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {fullDate}
                  </p>
                  {a.description && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      {a.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDeleteActivity(a.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 4,
                    color: 'hsl(var(--on-surface-muted))',
                    flexShrink: 0,
                  }}
                  title="Remove activity"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    delete
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
