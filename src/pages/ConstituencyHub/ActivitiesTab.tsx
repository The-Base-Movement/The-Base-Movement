interface Activity {
  id: string
  title: string
  description?: string | null
  type: string
  activity_date?: string | null
}

interface Props {
  showActivityForm: boolean
  setShowActivityForm: (v: boolean) => void
  actTitle: string
  setActTitle: (s: string) => void
  actDesc: string
  setActDesc: (s: string) => void
  actType: string
  setActType: (s: string) => void
  actDate: string
  setActDate: (s: string) => void
  isSavingActivity: boolean
  onAddActivity: () => void
  activities: Activity[]
  onDeleteActivity: (id: string) => void
}

export function ActivitiesTab({
  showActivityForm,
  setShowActivityForm,
  actTitle,
  setActTitle,
  actDesc,
  setActDesc,
  actType,
  setActType,
  actDate,
  setActDate,
  isSavingActivity,
  onAddActivity,
  activities,
  onDeleteActivity,
}: Props) {
  return (
    <div>
      {!showActivityForm && (
        <button
          className="btn btn-primary btn-sm"
          style={{ marginBottom: 16 }}
          onClick={() => setShowActivityForm(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Add Activity
        </button>
      )}

      {showActivityForm && (
        <div className="panel" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 16px',
            }}
          >
            New Activity
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              required
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              placeholder="Title *"
              style={{
                height: 40,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              style={{
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  fontFamily: "'Public Sans', sans-serif",
                  boxSizing: 'border-box',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  cursor: 'pointer',
                }}
              >
                {['Event', 'Action', 'Onboarding', 'Meeting', 'Outreach', 'Rally', 'Workshop'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
              <input
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  fontFamily: "'Public Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={onAddActivity}
                disabled={isSavingActivity}
              >
                {isSavingActivity ? 'Saving...' : 'Save Activity'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowActivityForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>No activities yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activities.map((a) => (
            <div
              key={a.id}
              className="panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {a.title}
                </p>
                {a.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '4px 0 0',
                    }}
                  >
                    {a.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                  <span className="pill pill-mute">{a.type}</span>
                  {a.activity_date && (
                    <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      {new Date(a.activity_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn btn-dest btn-sm" onClick={() => onDeleteActivity(a.id)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  delete
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivitiesTab
