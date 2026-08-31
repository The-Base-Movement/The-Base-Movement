import { useState, useEffect } from 'react'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const AppleIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -2 }}
    aria-hidden="true"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.96.04-2.13.64-2.82 1.44-.61.71-1.15 1.87-.99 2.99 1.08.08 2.16-.51 2.82-1.33" />
  </svg>
)

export default function AppDownload() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android')

  useEffect(() => {
    // Detect if already running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a platform API on mount, not derived state
      setIsInstalled(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Auto-detect OS platform to activate best tab
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios')
    } else if (/android/.test(ua)) {
      setActiveTab('android')
    } else {
      setActiveTab('desktop')
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="page-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <SEO
        title="Download The Base Movement App | Official PWA for Mobile & Desktop"
        description="Install the official app of The Base Movement on Android, iPhone/iPad (iOS), and Desktop. Fast, lightweight, works offline, and keeps you connected to youth jobs and movement updates."
        canonical="/app"
      />

      {/* Header Banner */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 40px' }}>
        <span
          className="pill pill-ok"
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            phonelink
          </span>
          Official Progressive Web App (PWA)
        </span>

        <h1
          style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 800,
            margin: '0 0 12px',
            color: 'hsl(var(--on-surface))',
            letterSpacing: '-0.02em',
          }}
        >
          Install The Base Movement App
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 16px' }}>
          <BrandLine />
        </div>
        <p
          style={{
            fontSize: 15,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Access your digital membership card, youth job listings, constituency networks, and
          movement updates instantly, no App Store or Play Store account required.
        </p>

        {/* Native Install Action Button if browser supports beforeinstallprompt */}
        {deferredPrompt && !isInstalled && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={handleInstallClick}
              style={{
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 20px rgba(0, 107, 63, 0.25)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                download
              </span>
              Install App on This Device
            </button>
          </div>
        )}

        {isInstalled && (
          <div
            className="panel"
            style={{
              padding: '12px 20px',
              marginTop: 20,
              background: 'hsl(142 76% 36% / 0.1)',
              borderLeft: '4px solid hsl(142 76% 36%)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'hsl(142 76% 36%)' }}>
              check_circle
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--on-surface))' }}>
              App is already installed on this device!
            </span>
          </div>
        )}
      </div>

      {/* Guided Platform Selection Tabs */}
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid hsl(var(--border))',
            paddingBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            className={`btn btn-sm ${activeTab === 'android' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('android')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              adb
            </span>
            Android (Chrome / Samsung)
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'ios' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('ios')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              phone_iphone
            </span>
            iPhone / iPad (iOS Safari)
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'desktop' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('desktop')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              desktop_windows
            </span>
            Laptop &amp; Desktop
          </button>
        </div>

        {/* Tab Content: Android Instructions */}
        {activeTab === 'android' && (
          <div className="panel" style={{ padding: '24px 28px' }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              How to Install on Android Devices
            </h3>

            <ol
              style={{
                paddingLeft: 20,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              <li>
                Open <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your
                Android phone or tablet.
              </li>
              <li>
                Navigate to <strong>thebasemovement.org.gh</strong> (or tap the 3 dots menu{' '}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, verticalAlign: 'middle' }}
                >
                  more_vert
                </span>{' '}
                at the top right).
              </li>
              <li>
                Select <strong>&quot;Install app&quot;</strong> or{' '}
                <strong>&quot;Add to Home screen&quot;</strong>.
              </li>
              <li>
                Tap <strong>&quot;Install&quot;</strong> in the pop-up prompt. The Base Movement
                icon will appear directly on your app drawer and home screen.
              </li>
            </ol>

            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--container-low))',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              💡 <strong>Tip:</strong> The app takes zero storage space and updates automatically
              whenever new features or jobs are posted.
            </div>
          </div>
        )}

        {/* Tab Content: iOS Safari Instructions */}
        {activeTab === 'ios' && (
          <div className="panel" style={{ padding: '24px 28px' }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              How to Install on iPhone &amp; iPad (iOS)
            </h3>

            <ol
              style={{
                paddingLeft: 20,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              <li>
                Open <strong>Safari Browser</strong> on your iPhone or iPad (must use Safari for iOS
                installation).
              </li>
              <li>
                Tap the <strong>Share button</strong>{' '}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, verticalAlign: 'middle', color: 'hsl(var(--primary))' }}
                >
                  ios_share
                </span>{' '}
                in the bottom toolbar.
              </li>
              <li>
                Scroll down the action list and tap <strong>&quot;Add to Home Screen&quot;</strong>{' '}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, verticalAlign: 'middle' }}
                >
                  add_box
                </span>
                .
              </li>
              <li>
                Tap <strong>&quot;Add&quot;</strong> in the top right corner. You can now launch The
                Base Movement directly from your home screen like any native app.
              </li>
            </ol>

            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--container-low))',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AppleIcon size={16} />
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Note for iOS users:</strong>
              </div>
              Safari is required to create the home screen shortcut on iOS. Once installed, it
              launches full-screen without address bars.
            </div>
          </div>
        )}

        {/* Tab Content: Desktop Instructions */}
        {activeTab === 'desktop' && (
          <div className="panel" style={{ padding: '24px 28px' }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              How to Install on Laptop &amp; Desktop (Windows, Mac, Linux)
            </h3>

            <ol
              style={{
                paddingLeft: 20,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              <li>
                Open <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or{' '}
                <strong>Brave</strong> on your desktop.
              </li>
              <li>
                Look at the right side of the address bar at the top of your screen for the{' '}
                <strong>Install Icon</strong>{' '}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, verticalAlign: 'middle' }}
                >
                  install_desktop
                </span>
                .
              </li>
              <li>
                Click the install icon, then click <strong>&quot;Install&quot;</strong> in the
                confirmation box.
              </li>
              <li>
                The Base Movement app will now launch as a dedicated desktop application with
                taskbar &amp; dock integration.
              </li>
            </ol>
          </div>
        )}

        {/* Features Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 32,
          }}
        >
          <div className="panel" style={{ padding: 20 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(var(--primary))', marginBottom: 8 }}
            >
              bolt
            </span>
            <h4
              style={{
                fontSize: 15,
                fontWeight: 700,
                margin: '0 0 6px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Instant &amp; Lightweight
            </h4>
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              No massive 100MB downloads. Loads in milliseconds and updates seamlessly in the
              background.
            </p>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(var(--accent))', marginBottom: 8 }}
            >
              wifi_off
            </span>
            <h4
              style={{
                fontSize: 15,
                fontWeight: 700,
                margin: '0 0 6px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Offline Ready
            </h4>
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Access your digital membership card and saved policy agenda even without mobile
              internet.
            </p>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(142 76% 36%)', marginBottom: 8 }}
            >
              notifications_active
            </span>
            <h4
              style={{
                fontSize: 15,
                fontWeight: 700,
                margin: '0 0 6px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Youth Job Alerts
            </h4>
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Receive instant updates when new job openings, training workshops, or local chapter
              events are announced.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
