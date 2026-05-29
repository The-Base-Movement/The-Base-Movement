import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushPromptBanner() {
  const { isSupported, isSubscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_prompted') !== null)
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div
        className="panel"
        style={{
          padding: '10px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'hsl(var(--container-low))',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
        >
          check_circle
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Notifications enabled
        </p>
      </div>
    )
  }

  if (!isSupported || isSubscribed || dismissed || loading) return null

  const handleEnable = async () => {
    await subscribe()
    localStorage.setItem('push_prompted', 'accepted')
    setConfirmed(true)
    setTimeout(() => setDismissed(true), 2500)
  }

  const handleDismiss = () => {
    localStorage.setItem('push_prompted', 'dismissed')
    setDismissed(true)
  }

  return (
    <div
      className="panel"
      style={{
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--primary))', flexShrink: 0 }}
        >
          notifications
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Stay informed
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
            }}
          >
            Get notified about broadcasts, new polls, and chapter updates.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button" className="btn btn-sm btn-outline" onClick={handleDismiss}>
          Not now
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleEnable}
          disabled={loading}
        >
          Enable notifications
        </button>
      </div>
    </div>
  )
}
