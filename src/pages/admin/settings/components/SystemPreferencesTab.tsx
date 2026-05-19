import type { toast as ToastFn } from 'sonner'

type InterfaceDensity = 'Comfortable' | 'Compact' | 'High Density'

interface SystemPreferencesTabProps {
  interfaceDensity: InterfaceDensity
  setInterfaceDensity: (mode: InterfaceDensity) => void
  toast: typeof ToastFn
}

export function SystemPreferencesTab({
  interfaceDensity,
  setInterfaceDensity,
  toast,
}: SystemPreferencesTabProps) {
  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span>Preferences</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Configure your personal interface and notification behavior.
        </span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Density */}
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Interface density
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}
          >
            {(['Comfortable', 'Compact', 'High Density'] as InterfaceDensity[]).map((mode) => (
              <button
                key={mode}
                className={mode === interfaceDensity ? 'btn btn-primary' : 'btn btn-outline'}
                style={{
                  justifyContent: 'center',
                  minHeight: 44,
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
                onClick={() => {
                  setInterfaceDensity(mode)
                  localStorage.setItem('admin_interface_density', mode)
                  toast.success(`Density set to ${mode}`)
                  window.dispatchEvent(new Event('admin_density_changed'))
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'hsl(var(--border))' }} />

        {/* Notifications */}
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Notifications
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                id: 'reg',
                label: 'New Member Registrations',
                desc: 'Real-time alerts for regional growth',
              },
              {
                id: 'sec',
                label: 'Security Login Alerts',
                desc: 'Notify on new device recognition',
              },
              { id: 'audit', label: 'Critical Audit Events', desc: 'Alert on system modification' },
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '2px 0 0',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked="true"
                  aria-label={`Toggle ${item.label}`}
                  style={{
                    width: 36,
                    height: 20,
                    background: 'hsl(var(--primary))',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 3px',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      background: '#fff',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
