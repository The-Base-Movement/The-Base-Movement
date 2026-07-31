import { useEffect, useMemo, useState, type CSSProperties } from 'react'

import { StatTile } from '@/components/admin/StatTile'
import { usePageLabel } from '@/contexts/PageLabelContext'

import { calculateDowntimeAllowances, formatDowntime, validateSlaPercentage } from './slaCalculator'
import { useITLayout } from './ITLayoutContext'

const PRESETS = ['99', '99.9', '99.99', '99.999'] as const

const inputStyle: CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 14,
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--background))',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'hsl(var(--on-surface-muted))',
}

export default function ITSlaCalculator() {
  const { setCurrentLabel } = usePageLabel()
  const [slaInput, setSlaInput] = useState('99.9')

  useEffect(() => {
    setCurrentLabel('SLA Uptime Calculator')
  }, [setCurrentLabel])

  useITLayout(
    'SLA Uptime Calculator',
    'monitoring',
    'Convert an uptime target into the downtime budget for common operating periods.'
  )

  const parsedValue = Number.parseFloat(slaInput)
  const validationMessage = validateSlaPercentage(parsedValue)

  const allowances = useMemo(
    () => (validationMessage ? null : calculateDowntimeAllowances(parsedValue)),
    [parsedValue, validationMessage]
  )

  const downtimeTiles = [
    {
      key: 'day',
      label: 'Per Day',
      icon: 'today',
      bar: 'hsl(var(--primary))',
      seconds: allowances?.day ?? 0,
    },
    {
      key: 'week',
      label: 'Per Week',
      icon: 'date_range',
      bar: 'hsl(var(--accent))',
      seconds: allowances?.week ?? 0,
    },
    {
      key: 'month',
      label: 'Per Month',
      icon: 'calendar_month',
      bar: 'hsl(var(--on-surface))',
      seconds: allowances?.month ?? 0,
    },
    {
      key: 'year',
      label: 'Per Year',
      icon: 'event',
      bar: 'hsl(var(--destructive))',
      seconds: allowances?.year ?? 0,
    },
  ] as const

  return (
    <div>
      <div
        className="panel"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          display: 'grid',
          gap: 18,
        }}
      >
        <div>
          <label htmlFor="sla-percentage" style={labelStyle}>
            SLA Percentage
          </label>
          <input
            id="sla-percentage"
            type="number"
            min="0"
            max="100"
            step="0.001"
            inputMode="decimal"
            value={slaInput}
            onChange={(event) => setSlaInput(event.target.value)}
            aria-invalid={validationMessage ? 'true' : 'false'}
            aria-describedby="sla-helper sla-error"
            style={{
              ...inputStyle,
              borderColor: validationMessage ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={slaInput === preset ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setSlaInput(preset)}
              aria-pressed={slaInput === preset}
            >
              {preset}%
            </button>
          ))}
        </div>

        <div>
          <p
            id="sla-helper"
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.55,
            }}
          >
            Uses a 30-day month and a 365-day year. Enter the uptime target and the calculator turns
            the remaining allowance into a downtime budget.
          </p>
          <p
            id="sla-error"
            role="status"
            aria-live="polite"
            style={{
              margin: validationMessage ? '8px 0 0' : 0,
              minHeight: validationMessage ? 'auto' : 0,
              fontSize: 12,
              color: 'hsl(var(--destructive))',
            }}
          >
            {validationMessage ?? ''}
          </p>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 24 }}>
        {downtimeTiles.map((tile) => (
          <StatTile
            key={tile.key}
            label={tile.label}
            value={allowances ? formatDowntime(tile.seconds) : '—'}
            bar={tile.bar}
            icon={tile.icon}
            sub={
              allowances
                ? `${tile.seconds.toLocaleString()} seconds of downtime`
                : 'Valid SLA required'
            }
          />
        ))}
      </div>
    </div>
  )
}
