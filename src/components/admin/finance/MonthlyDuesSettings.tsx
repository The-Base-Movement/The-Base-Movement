import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { monthlyDuesService } from '@/services/monthlyDuesService'

const FONT = "'Public Sans', sans-serif"

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: FONT,
  display: 'block',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  height: 34,
  width: '100%',
  padding: '0 10px',
  borderRadius: 'var(--radius-xs)',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
  fontSize: 13,
  fontFamily: FONT,
  boxSizing: 'border-box',
}

/** Finance settings card for the singleton monthly dues policy. */
export default function MonthlyDuesSettings({ onSaved }: { onSaved?: () => void }) {
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('28')
  const [graceDays, setGraceDays] = useState('7')
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [policyVersion, setPolicyVersion] = useState('v1')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    monthlyDuesService
      .getFinanceSettings()
      .then((settings) => {
        if (!settings) return
        setAmount(String(settings.amount_ghs))
        setDueDay(String(settings.due_day))
        setGraceDays(String(settings.grace_period_days))
        setRecurringEnabled(settings.recurring_enrollment_enabled)
        setPolicyVersion(settings.policy_version)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    const amountGhs = Number(amount)
    const day = Number(dueDay)
    const grace = Number(graceDays)
    if (!Number.isFinite(amountGhs) || amountGhs <= 0) {
      setError('The monthly amount must be greater than 0 GHS.')
      return
    }
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      setError('The due day must be between 1 and 28.')
      return
    }
    if (!Number.isInteger(grace) || grace < 0 || grace > 28) {
      setError('The grace period must be between 0 and 28 days.')
      return
    }
    if (!policyVersion.trim()) {
      setError('A policy version is required.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await monthlyDuesService.saveFinanceSettings({
        amount_ghs: amountGhs,
        due_day: day,
        grace_period_days: grace,
        recurring_enrollment_enabled: recurringEnabled,
        policy_version: policyVersion.trim(),
      })
      toast.success('Monthly dues settings saved.')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="ph" style={{ padding: 0, marginBottom: 14, border: 'none' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Dues Policy</h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            One GHS amount, due day, and grace period for all enrolled members.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <label htmlFor="dues-amount" style={labelStyle}>
            Amount (GHS)
          </label>
          <input
            id="dues-amount"
            aria-label="Amount (GHS)"
            type="number"
            min={1}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="dues-due-day" style={labelStyle}>
            Due day (1–28)
          </label>
          <input
            id="dues-due-day"
            aria-label="Due day"
            type="number"
            min={1}
            max={28}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="dues-grace" style={labelStyle}>
            Grace (days)
          </label>
          <input
            id="dues-grace"
            aria-label="Grace period days"
            type="number"
            min={0}
            max={28}
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="dues-policy-version" style={labelStyle}>
            Policy version
          </label>
          <input
            id="dues-policy-version"
            aria-label="Policy version"
            type="text"
            value={policyVersion}
            onChange={(e) => setPolicyVersion(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontFamily: FONT,
          color: 'hsl(var(--on-surface))',
          marginBottom: 14,
        }}
      >
        <input
          type="checkbox"
          checked={recurringEnabled}
          onChange={(e) => setRecurringEnabled(e.target.checked)}
          style={{ boxSizing: 'border-box' }}
        />
        Allow members to enable Hubtel recurring payments
      </label>

      {error && (
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12,
            color: 'hsl(var(--destructive))',
            fontFamily: FONT,
          }}
        >
          {error}
        </p>
      )}

      <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          save
        </span>
        Save settings
      </button>
    </div>
  )
}
