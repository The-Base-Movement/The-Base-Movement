import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { PanelHeaderBar } from '@/components/admin/finance/PanelHeaderBar'
import { toast } from 'sonner'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  color: 'hsl(var(--on-surface-muted))',
  marginBottom: 6,
}

const tiers = [
  {
    tier: 1,
    role: 'Finance Officer',
    icon: 'account_balance_wallet',
    bar: 'hsl(var(--on-surface))',
    description:
      'Requests at or below the Tier 1 ceiling can be approved or denied by Finance Officers. Requests above it are acknowledged (passed up).',
    limitKey: 'finance_tier1_max' as const,
    limitLabel: 'Tier 1 ceiling (GHS)',
  },
  {
    tier: 2,
    role: 'Executives',
    icon: 'corporate_fare',
    bar: 'hsl(var(--accent))',
    description:
      'Requests between Tier 1 and Tier 2 ceilings are handled by Executives. Requests above the Tier 2 ceiling are acknowledged (passed up).',
    limitKey: 'finance_tier2_max' as const,
    limitLabel: 'Tier 2 ceiling (GHS)',
  },
  {
    tier: 3,
    role: 'Founder / Appointed Executives',
    icon: 'shield',
    bar: 'hsl(var(--primary))',
    description:
      'All requests that pass Tier 2 are handled here. No ceiling — unlimited approval authority.',
    limitKey: null,
    limitLabel: null,
  },
]

export function FinanceApprovalsTab() {
  const [tier1Max, setTier1Max] = useState('')
  const [tier2Max, setTier2Max] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminService.getSiteSettings().then((s) => {
      setTier1Max(String(s['finance_tier1_max'] ?? '50'))
      setTier2Max(String(s['finance_tier2_max'] ?? '100'))
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    const v1 = parseFloat(tier1Max)
    const v2 = parseFloat(tier2Max)
    if (isNaN(v1) || v1 <= 0) {
      toast.error('Tier 1 ceiling must be a positive number')
      return
    }
    if (isNaN(v2) || v2 <= v1) {
      toast.error('Tier 2 ceiling must be greater than Tier 1')
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        adminService.updateSiteSetting('finance_tier1_max', String(v1)),
        adminService.updateSiteSetting('finance_tier2_max', String(v2)),
      ])
      toast.success('Approval thresholds saved')
    } catch {
      toast.error('Failed to save thresholds')
    } finally {
      setSaving(false)
    }
  }

  const t1 = parseFloat(tier1Max) || 0
  const t2 = parseFloat(tier2Max) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16 }}>
        <PanelHeaderBar
          flush
          icon="approval"
          title="Finance Approval Chain"
          subtitle="Set the GHS amount ceilings that determine which tier handles each fund request. Changes take effect immediately for all new decisions."
        />
      </div>

      {/* Tier cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tiers.map((t) => (
          <div
            key={t.tier}
            className="panel"
            style={{ padding: '18px 20px 18px 24px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: t.bar,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              {/* Left: label + description */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: t.bar }}
                  >
                    {t.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Tier {t.tier} — {t.role}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {t.tier === 1
                      ? `GHS 0 – ${t1.toLocaleString()}`
                      : t.tier === 2
                        ? `GHS ${(t1 + 1).toLocaleString()} – ${t2.toLocaleString()}`
                        : `GHS ${(t2 + 1).toLocaleString()}+`}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                  }}
                >
                  {t.description}
                </p>
              </div>

              {/* Right: input (tiers 1 & 2 only) */}
              {t.limitKey && !loading && (
                <div style={{ width: 200, flexShrink: 0 }}>
                  <label htmlFor={`tier-${t.tier}-max`} style={labelSt}>
                    {t.limitLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        pointerEvents: 'none',
                      }}
                    >
                      GHS
                    </span>
                    <input
                      id={`tier-${t.tier}-max`}
                      name={`tier-${t.tier}-max`}
                      type="number"
                      min="1"
                      step="1"
                      value={t.limitKey === 'finance_tier1_max' ? tier1Max : tier2Max}
                      onChange={(e) =>
                        t.limitKey === 'finance_tier1_max'
                          ? setTier1Max(e.target.value)
                          : setTier2Max(e.target.value)
                      }
                      style={{ ...inputSt, paddingLeft: 44 }}
                    />
                  </div>
                </div>
              )}

              {t.tier === 3 && (
                <div
                  style={{
                    width: 200,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    all_inclusive
                  </span>
                  No ceiling — unlimited
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save thresholds'}
        </button>
      </div>
    </div>
  )
}
