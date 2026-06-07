import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationsPanel() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe()
    } else {
      subscribe()
    }
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Notifications</h3>
        <span className="meta">Push alerts</span>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {!isSupported ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Push notifications are not supported in this browser.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Push notifications
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  maxWidth: 380,
                  lineHeight: 1.55,
                }}
              >
                Receive browser alerts for urgent broadcasts, new polls, blog posts, and chapter
                updates.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: isSubscribed ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 3px',
                justifyContent: isSubscribed ? 'flex-end' : 'flex-start',
                flexShrink: 0,
                transition: 'background 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: 'hsl(var(--card))',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
