import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isVisible, setIsVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Hide banner after a small delay once online is verified
      setTimeout(() => setIsVisible(false), 3000)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setIsVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px 12px 14px',
          background: isOnline
            ? 'rgba(26, 107, 60, 0.95)' // Premium green
            : 'rgba(30, 30, 30, 0.95)', // Sleek dark grey
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.5s ease',
        }}
      >
        {/* Brand Left Highlight Bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: isOnline
              ? '#1a6b3c' // Brand Green
              : '#eab308', // Brand Gold
          }}
        />

        {/* Status Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isOnline ? 'rgba(255, 255, 255, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: isOnline ? '#ffffff' : '#eab308',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              animation: isOnline ? 'none' : 'pulse 2s infinite ease-in-out',
            }}
          >
            {isOnline ? 'wifi' : 'wifi_off'}
          </span>
        </div>

        {/* Text Details */}
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: "'Public Sans', sans-serif",
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isOnline ? 'Signal Restored' : 'Signal Lost (Offline Mode)'}
          </h4>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: 11,
              fontWeight: 500,
              color: isOnline ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.65)',
              fontFamily: "'Public Sans', sans-serif",
              lineHeight: 1.4,
            }}
          >
            {isOnline
              ? 'Re-connecting and synchronizing local data...'
              : 'Your progress is protected. Registrations will save locally.'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }
      `}</style>
    </div>
  )
}
