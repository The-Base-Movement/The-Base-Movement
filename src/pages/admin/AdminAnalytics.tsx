import { useState, useEffect } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default function AdminAnalytics() {
  const shareUrl = import.meta.env.VITE_UMAMI_SHARE_URL as string | undefined

  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  let iframeUrl = shareUrl
  if (shareUrl) {
    try {
      const url = new URL(shareUrl)
      url.searchParams.set('theme', isDark ? 'dark' : 'light')
      iframeUrl = url.toString()
    } catch {
      console.warn('Invalid VITE_UMAMI_SHARE_URL')
    }
  }

  return (
    <div className="admin-page-container">
      <AdminPageHeader
        title="Analytics"
        icon="bar_chart"
        description="Site traffic, visitor behaviour, and conversion events via Umami."
      />

      {shareUrl ? (
        <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 4 }}>
          <iframe
            key={isDark ? 'dark' : 'light'}
            src={iframeUrl}
            style={{ width: '100%', height: 800, border: 'none', display: 'block' }}
            title="Umami Analytics Dashboard"
          />
        </div>
      ) : (
        <div
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--border))' }}
          >
            bar_chart
          </span>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                margin: '0 0 8px',
              }}
            >
              Dashboard embed not configured
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                maxWidth: 420,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              To embed your Umami dashboard here, go to{' '}
              <strong>Umami → your website → Settings → Share</strong>, enable sharing, copy the
              URL, then add it to your environment as{' '}
              <code
                style={{
                  padding: '1px 6px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 11,
                }}
              >
                VITE_UMAMI_SHARE_URL
              </code>
              .
            </p>
          </div>
          <a
            href="https://cloud.umami.is"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              open_in_new
            </span>
            Open Umami dashboard
          </a>
        </div>
      )}

      {/* Event legend */}
      <div className="panel" style={{ marginTop: 16, padding: '20px 24px' }}>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
            margin: '0 0 14px',
          }}
        >
          Tracked events
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {[
            { event: 'registration_complete', label: 'Member registration', icon: 'how_to_reg' },
            {
              event: 'donation_submitted',
              label: 'Donation submitted',
              icon: 'volunteer_activism',
            },
            { event: 'store_purchase', label: 'Store purchase', icon: 'shopping_bag' },
            { event: 'job_application', label: 'Job application', icon: 'work' },
          ].map(({ event, label, icon }) => (
            <div
              key={event}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--primary))', flexShrink: 0 }}
              >
                {icon}
              </span>
              <div>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '2px 0 0',
                  }}
                >
                  {event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
