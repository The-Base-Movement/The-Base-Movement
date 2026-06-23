import { useState, useEffect } from 'react'
import type { toast as ToastFn } from 'sonner'
import { adminService } from '@/services/adminService'
import type { AdminUser, AdminPreferences } from '@/types/admin'

interface SystemPreferencesTabProps {
  adminData: AdminUser | null
  toast: typeof ToastFn
}

export function SystemPreferencesTab({ adminData, toast }: SystemPreferencesTabProps) {
  const [preferences, setPreferences] = useState<AdminPreferences | null>(null)

  useEffect(() => {
    if (adminData?.preferences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreferences(adminData.preferences)
      // Make sure the localStorage matches the initial load just in case
      if (adminData.preferences.interfaceDensity) {
        localStorage.setItem('admin_interface_density', adminData.preferences.interfaceDensity)
        window.dispatchEvent(new Event('admin_density_changed'))
      }
      localStorage.setItem('admin_dark_mode', adminData.preferences.darkMode ? 'true' : 'false')
    }
  }, [adminData])

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = localStorage.getItem('admin_dark_mode') === 'true'
      setPreferences((prev) => (prev ? { ...prev, darkMode: isDark } : null))
    }
    window.addEventListener('admin_theme_changed', handleThemeChange)
    return () => window.removeEventListener('admin_theme_changed', handleThemeChange)
  }, [])

  const handleUpdatePreferences = async (newPrefs: AdminPreferences) => {
    setPreferences(newPrefs)
    if (adminData) {
      try {
        await adminService.updatePreferences(adminData.id, newPrefs)
      } catch {
        toast.error('Failed to save preferences to database.')
      }
    }
  }

  const handleDensityChange = (mode: AdminPreferences['interfaceDensity']) => {
    if (!preferences) return
    const newPrefs = { ...preferences, interfaceDensity: mode }
    handleUpdatePreferences(newPrefs)
    localStorage.setItem('admin_interface_density', mode)
    toast.success(`Density set to ${mode}`)
    window.dispatchEvent(new Event('admin_density_changed'))
  }

  const handleDarkModeToggle = () => {
    if (!preferences) return
    const newPrefs = { ...preferences, darkMode: !preferences.darkMode }
    handleUpdatePreferences(newPrefs)
    toast.success(`Dark mode ${newPrefs.darkMode ? 'enabled' : 'disabled'}`)
    // This will be picked up by DashboardLayout eventually
    if (newPrefs.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('admin_dark_mode', 'true')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('admin_dark_mode', 'false')
    }
    window.dispatchEvent(new Event('admin_theme_changed'))
  }

  const handleToggle = (key: keyof AdminPreferences['notifications'], label: string) => {
    if (!preferences) return
    const nextState = !preferences.notifications[key]
    const newPrefs = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: nextState,
      },
    }
    handleUpdatePreferences(newPrefs)
    toast.success(`${label} notifications ${nextState ? 'enabled' : 'disabled'}`)
  }

  if (!preferences) return <div style={{ padding: 24 }}>Loading preferences...</div>

  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span>Preferences</span>
        <span
          style={{
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Configure your personal interface and notification behavior.
        </span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Density */}
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
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
            {(
              ['Comfortable', 'Compact', 'High Density'] as AdminPreferences['interfaceDensity'][]
            ).map((mode) => (
              <button
                key={mode}
                className={
                  mode === preferences.interfaceDensity ? 'btn btn-primary' : 'btn btn-outline'
                }
                style={{
                  justifyContent: 'center',
                  minHeight: 44,
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
                onClick={() => handleDensityChange(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'hsl(var(--border))' }} />

        {/* Dark Mode */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                Dark Mode
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '2px 0 0',
                }}
              >
                Enable dark theme for the command center
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.darkMode}
              aria-label="Toggle Dark Mode"
              onClick={handleDarkModeToggle}
              style={{
                width: 36,
                height: 20,
                background: preferences.darkMode ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: preferences.darkMode ? 'flex-end' : 'flex-start',
                padding: '0 3px',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: 'hsl(var(--card))',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'hsl(var(--border))' }} />

        {/* Notifications */}
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Notifications
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(
              [
                {
                  id: 'newRegistrations',
                  label: 'New Member Registrations',
                  desc: 'Real-time alerts for regional growth',
                },
                {
                  id: 'securityAlerts',
                  label: 'Security Login Alerts',
                  desc: 'Notify on new device recognition',
                },
                {
                  id: 'auditEvents',
                  label: 'Critical Audit Events',
                  desc: 'Alert on system modification',
                },
                {
                  id: 'financeRequests',
                  label: 'Finance Approval Requests',
                  desc: 'Alerts when funds require approval',
                },
              ] as const
            ).map((item) => {
              const isChecked = preferences.notifications[item.id]
              return (
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
                        fontWeight: 'var(--font-weight-medium, 500)',
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
                        fontWeight: 'var(--font-weight-medium, 500)',
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
                    aria-checked={isChecked}
                    aria-label={`Toggle ${item.label}`}
                    onClick={() => handleToggle(item.id, item.label)}
                    style={{
                      width: 36,
                      height: 20,
                      background: isChecked ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isChecked ? 'flex-end' : 'flex-start',
                      padding: '0 3px',
                      cursor: 'pointer',
                      border: 'none',
                      outline: 'none',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        background: 'hsl(var(--card))',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
