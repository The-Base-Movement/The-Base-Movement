import { useEffect, useMemo, useState, type CSSProperties } from 'react'

import { StatTile } from '@/components/admin/StatTile'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { itService, type SiteUptimeSummary } from '@/services/itService'

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

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—'
}

export default function ITSlaCalculator() {
  const { setCurrentLabel } = usePageLabel()
  const [slaInput, setSlaInput] = useState('99.9')
  const [uptimeSummary, setUptimeSummary] = useState<SiteUptimeSummary | null>(null)
  const [uptimeLoading, setUptimeLoading] = useState(true)
  const [uptimeError, setUptimeError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentLabel('SLA Uptime Calculator')
  }, [setCurrentLabel])

  useITLayout(
    'SLA Uptime Calculator',
    'monitoring',
    'Convert an uptime target into the downtime budget for common operating periods.'
  )

  useEffect(() => {
    let active = true

    itService
      .getSiteUptimeSummary()
      .then((summary) => {
        if (!active) return
        setUptimeSummary(summary)
        setUptimeError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setUptimeError(error instanceof Error ? error.message : 'Failed to load uptime summary.')
      })
      .finally(() => {
        if (active) setUptimeLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

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

  const actualTiles = [
    {
      key: 'status',
      label: 'Current Status',
      icon: uptimeSummary?.currentStatus === 'down' ? 'cloud_off' : 'cloud_done',
      bar:
        uptimeSummary?.currentStatus === 'down' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
      value: uptimeLoading
        ? '—'
        : uptimeSummary?.currentStatus === 'unknown'
          ? 'Waiting for checks'
          : uptimeSummary?.currentStatus === 'down'
            ? 'Down'
            : 'Up',
      sub:
        uptimeLoading || !uptimeSummary
          ? 'Heartbeat pending'
          : `${formatDowntime(uptimeSummary.currentStatusDurationSeconds)} in current state`,
    },
    {
      key: 'observed',
      label: 'Observed Uptime',
      icon: 'monitoring',
      bar: 'hsl(var(--accent))',
      value:
        uptimeLoading || !uptimeSummary || uptimeSummary.observedUptimePercentage === null
          ? '—'
          : `${uptimeSummary.observedUptimePercentage.toFixed(2)}%`,
      sub: uptimeSummary
        ? `Across ${uptimeSummary.totalChecks.toLocaleString()} recorded checks`
        : 'No checks yet',
    },
    {
      key: 'downtime',
      label: 'Estimated Downtime',
      icon: 'schedule',
      bar: 'hsl(var(--on-surface))',
      value:
        uptimeLoading || !uptimeSummary
          ? '—'
          : formatDowntime(uptimeSummary.estimatedDowntimeSeconds),
      sub: uptimeSummary
        ? `Approximate from ${Math.round(uptimeSummary.intervalSeconds / 60)}-minute heartbeats`
        : 'No checks yet',
    },
    {
      key: 'window',
      label: 'Monitoring Since',
      icon: 'history',
      bar: 'hsl(var(--primary))',
      value:
        uptimeLoading || !uptimeSummary?.monitoringStartedAt
          ? '—'
          : formatTimestamp(uptimeSummary.monitoringStartedAt),
      sub: uptimeSummary?.lastCheckedAt
        ? `Last check ${formatTimestamp(uptimeSummary.lastCheckedAt)}`
        : 'No checks yet',
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

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="ph">
          <div>
            <h3>Actual Uptime</h3>
            <p className="meta" style={{ marginTop: 4 }}>
              Measured by a Vercel heartbeat against the public deployment and stored in Supabase.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          <div className="kpis" style={{ marginBottom: 20 }}>
            {actualTiles.map((tile) => (
              <StatTile
                key={tile.key}
                label={tile.label}
                value={tile.value}
                bar={tile.bar}
                icon={tile.icon}
                sub={tile.sub}
              />
            ))}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: uptimeError ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
              lineHeight: 1.55,
            }}
          >
            {uptimeError
              ? uptimeError
              : uptimeSummary
                ? `Target: ${uptimeSummary.targetUrl ?? '—'} · Successful checks: ${uptimeSummary.successfulChecks.toLocaleString()} · Failed checks: ${uptimeSummary.failedChecks.toLocaleString()} · Last HTTP status: ${uptimeSummary.lastStatusCode ?? '—'}`
                : 'The first uptime tiles will populate after the Vercel cron starts recording checks.'}
          </p>

          {uptimeSummary?.recentChecks?.length ? (
            <div style={{ overflowX: 'auto', marginTop: 18 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Checked</th>
                    <th>Status</th>
                    <th>HTTP</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {uptimeSummary.recentChecks.map((check) => (
                    <tr key={check.checkedAt}>
                      <td>{formatTimestamp(check.checkedAt)}</td>
                      <td
                        style={{
                          color: check.ok ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                        }}
                      >
                        {check.ok ? 'Up' : 'Down'}
                      </td>
                      <td>{check.statusCode ?? '—'}</td>
                      <td>{check.latencyMs === null ? '—' : `${check.latencyMs} ms`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
