import type { DonationDetail } from '@/types/admin'

interface Props {
  activeFilter: 'day' | 'week' | 'month' | 'year' | 'custom'
  showDatePicker: boolean
  dateRange: { start: string; end: string }
  filteredActivity: DonationDetail[]
  onFilterChange: (f: 'day' | 'week' | 'month' | 'year') => void
  onToggleDatePicker: () => void
  onDateRangeChange: (key: 'start' | 'end', value: string) => void
  onApplyCustomFilter: () => void
  onViewFullLog: () => void
}

export function DashboardActivityFeed({
  activeFilter,
  showDatePicker,
  dateRange,
  filteredActivity,
  onFilterChange,
  onToggleDatePicker,
  onDateRangeChange,
  onApplyCustomFilter,
  onViewFullLog,
}: Props) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ph">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Recent activity
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'hsl(var(--destructive))',
              display: 'inline-block',
              animation: 'pulse 1.4s infinite',
            }}
          />
        </span>
      </div>

      <div style={{ padding: '0 16px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            background: 'hsl(var(--container-low))',
            padding: 4,
            borderRadius: 4,
            border: '1px solid hsl(var(--border))',
          }}
        >
          {(['day', 'week', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onFilterChange(t)}
              style={{
                height: 30,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 10,
                textTransform: 'capitalize',
                background: activeFilter === t ? '#fff' : 'none',
                color: activeFilter === t ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                boxShadow: activeFilter === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleDatePicker}
          style={{
            marginTop: 6,
            width: '100%',
            height: 30,
            borderRadius: 4,
            border: '1px solid hsl(var(--border))',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background:
              showDatePicker || activeFilter === 'custom' ? 'hsl(var(--primary))' : '#fff',
            color:
              showDatePicker || activeFilter === 'custom' ? '#fff' : 'hsl(var(--on-surface-muted))',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            calendar_today
          </span>
          Custom range
        </button>
        {showDatePicker && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: 'hsl(var(--container-low))',
              borderRadius: 4,
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
                marginBottom: 8,
              }}
            >
              {[
                { label: 'Start', key: 'start' as const },
                { label: 'End', key: 'end' as const },
              ].map((f) => (
                <div key={f.key}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 9,
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 4,
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    name="name-488fce"
                    id="input-488fce"
                    type="date"
                    style={{
                      width: '100%',
                      height: 32,
                      padding: '0 8px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onChange={(e) => onDateRangeChange(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onApplyCustomFilter}
            >
              Apply filter
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 380,
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {activeFilter === 'custom' ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.3,
                display: 'block',
                marginBottom: 8,
              }}
            >
              calendar_today
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {dateRange.start || '…'} to {dateRange.end || '…'}
            </p>
          </div>
        ) : filteredActivity.length > 0 ? (
          filteredActivity.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom:
                  idx < filteredActivity.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: 'rgba(0,107,63,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                    flexShrink: 0,
                  }}
                >
                  {item.fullName[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.fullName}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {item.country} · {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                  }}
                >
                  ₵{item.amount}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 9,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Verified
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.3,
                display: 'block',
                marginBottom: 8,
              }}
            >
              analytics
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No activity in this period
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}>
        <button
          onClick={onViewFullLog}
          className="btn btn-outline btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            open_in_full
          </span>
          View full log
        </button>
      </div>
    </div>
  )
}
