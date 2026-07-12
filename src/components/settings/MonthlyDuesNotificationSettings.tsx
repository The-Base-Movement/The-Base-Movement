import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { monthlyDuesService } from '@/services/monthlyDuesService'

const FONT = "'Public Sans', sans-serif"

/**
 * Monthly dues reminder consent toggles. Each change appends a new consent
 * row server-side (history is never edited); the latest row is the current
 * preference for the reminder dispatcher.
 */
export default function MonthlyDuesNotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [recordedAt, setRecordedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    monthlyDuesService
      .getMyLatestConsent()
      .then((consent) => {
        if (consent) {
          setEmailEnabled(consent.email_enabled)
          setSmsEnabled(consent.sms_enabled)
          setRecordedAt(consent.recorded_at)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (nextEmail: boolean, nextSms: boolean) => {
    setSaving(true)
    const prevEmail = emailEnabled
    const prevSms = smsEnabled
    setEmailEnabled(nextEmail)
    setSmsEnabled(nextSms)
    try {
      await monthlyDuesService.setConsent(nextEmail, nextSms, 'profile_settings')
      setRecordedAt(new Date().toISOString())
      toast.success('Dues reminder preferences saved.')
    } catch (err) {
      setEmailEnabled(prevEmail)
      setSmsEnabled(prevSms)
      toast.error(err instanceof Error ? err.message : 'Could not save your preference.')
    } finally {
      setSaving(false)
    }
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    fontFamily: FONT,
    color: 'hsl(var(--on-surface))',
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="ph" style={{ padding: 0, marginBottom: 12, border: 'none' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Monthly Dues Reminders</h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            Turning a channel off immediately stops future dues reminders on that channel.
          </p>
        </div>
      </div>

      {loading ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
          }}
        >
          Loading…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={rowStyle}>
            <input
              type="checkbox"
              checked={emailEnabled}
              disabled={saving}
              onChange={(e) => save(e.target.checked, smsEnabled)}
              style={{ boxSizing: 'border-box' }}
            />
            Email dues reminders
          </label>
          <label style={rowStyle}>
            <input
              type="checkbox"
              checked={smsEnabled}
              disabled={saving}
              onChange={(e) => save(emailEnabled, e.target.checked)}
              style={{ boxSizing: 'border-box' }}
            />
            SMS dues reminders
          </label>
          {recordedAt && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
              }}
            >
              Consent last recorded{' '}
              {new Date(recordedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
