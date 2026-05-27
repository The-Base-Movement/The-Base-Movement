import { useNavigate } from 'react-router-dom'
import { templates, priorityStyle, pillBase } from './styles'

export function BroadcastPresets() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mobilization presets */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Mobilization presets
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                marginTop: 2,
              }}
            >
              Quick-start protocols
            </div>
          </div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
          >
            bar_chart
          </span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map((t, i) => (
            <div
              key={i}
              onClick={() => navigate('/admin/broadcasts/new', { state: { template: t } })}
              style={{
                padding: '12px 14px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ ...pillBase, ...priorityStyle(t.priority) }}>{t.priority}</span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 9,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t.type}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {t.title}
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.5,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {t.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Red */}
      <div
        style={{
          background: 'hsl(var(--on-surface))',
          borderRadius: 'var(--radius-md)',
          borderTop: '4px solid hsl(var(--destructive))',
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 160, color: '#fff' }}>
            campaign
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 32, color: 'hsl(var(--destructive))' }}
            >
              warning
            </span>
          </div>
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              color: '#fff',
              marginBottom: 10,
            }}
          >
            Protocol Red
          </h3>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Urgent mobilization triggers immediate notifications to all connected field assets. Use
            only for critical broadcasts.
          </p>
          <button
            className="btn btn-dest"
            style={{ width: '100%' }}
            onClick={() => navigate('/admin/broadcasts/new', { state: { template: templates[2] } })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              error
            </span>
            Trigger Tactical Alert
          </button>
        </div>
      </div>
    </div>
  )
}
