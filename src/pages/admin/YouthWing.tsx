import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  youthWingService,
  type YouthWingDirectoryRow,
  type YouthWingStatus,
} from '@/services/youthWingService'
import { YOUTH_AGE_BUCKETS, YOUTH_STATUS_META, youthKpiBar } from './youth-wing/shared'

/**
 * Youth Wing department overview. Its own command surface, separate from the
 * adult Members department: none of these numbers feed adult membership totals,
 * constituency rolls or diaspora rolls.
 *
 * Age is read live from each member's date of birth, so the age profile below
 * moves as they grow. When someone turns 18 they stop being eligible; "Graduate
 * over-18s" moves them off the youth roll and invites them to register as adults.
 */

function countBy<T>(rows: T[], key: (row: T) => string | null | undefined) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const k = key(row) || 'Unstated'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, n]) => sum + n, 0) || 1

  return (
    <div className="panel" style={{ padding: '20px 22px' }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
          margin: '0 0 14px',
        }}
      >
        {title}
      </p>
      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
          No data yet.
        </p>
      ) : (
        entries.map(([label, n]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12.5,
                color: 'hsl(var(--on-surface))',
                marginBottom: 4,
              }}
            >
              <span>{label}</span>
              <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{n}</span>
            </div>
            <div
              style={{
                height: 4,
                background: 'hsl(var(--container-low))',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.round((n / total) * 100)}%`,
                  height: '100%',
                  background: 'hsl(var(--yw-accent, 187 72% 32%))',
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function AdminYouthWing() {
  const [rows, setRows] = useState<YouthWingDirectoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGraduating, setIsGraduating] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setRows(await youthWingService.listDirectory())
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to load Youth Wing records.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load()
  }, [load])

  const statusCounts = useMemo(() => countBy(rows, (r) => r.status), [rows])
  const ageCounts = useMemo(() => {
    const base: Record<string, number> = {}
    for (const a of YOUTH_AGE_BUCKETS) base[`${a} years`] = 0
    for (const r of rows) {
      const key = r.age >= 18 ? '18+ (over age)' : `${r.age} years`
      base[key] = (base[key] || 0) + 1
    }
    return base
  }, [rows])
  const genderCounts = useMemo(() => countBy(rows, (r) => r.gender), [rows])
  const regionCounts = useMemo(() => countBy(rows, (r) => r.region || r.country), [rows])
  const religionCounts = useMemo(() => countBy(rows, (r) => r.religion), [rows])

  const overAge = rows.filter((r) => r.is_over_age && r.status !== 'GRADUATED').length
  const birthdaysSoon = rows.filter((r) => r.has_birthday_within_30_days).length

  async function graduate() {
    if (
      !window.confirm(
        `Move ${overAge} member(s) who have turned 18 off the youth roll? They are not enrolled as adults; they must register at /register themselves.`
      )
    )
      return
    setIsGraduating(true)
    try {
      const moved = await youthWingService.flagGraduates()
      toast.success(`${moved} record(s) graduated.`)
      await load()
    } catch (error) {
      toast.error((error as Error)?.message || 'Could not run the graduation check.')
    } finally {
      setIsGraduating(false)
    }
  }

  const kpis: Array<{ key: YouthWingStatus | 'TOTAL'; label: string; value: number }> = [
    { key: 'TOTAL', label: 'Total on the youth roll', value: rows.length },
    { key: 'ACTIVE', label: 'Active', value: statusCounts.ACTIVE || 0 },
    { key: 'PENDING_CONSENT', label: 'Pending consent', value: statusCounts.PENDING_CONSENT || 0 },
    { key: 'GRADUATED', label: 'Graduated at 18', value: statusCounts.GRADUATED || 0 },
  ]

  return (
    <div className="main">
      <AdminPageHeader
        title="Youth Wing"
        icon="volunteer_activism"
        description="Civic and mobilization members aged 14 to 17. Not party members: excluded from every adult membership count, constituency roll and diaspora roll."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/youth-wing/directory" className="btn btn-outline btn-sm">
              Directory
            </Link>
            <Link to="/admin/youth-wing/consent" className="btn btn-outline btn-sm">
              Consent queue
            </Link>
            <Link to="/admin/youth-wing/articles" className="btn btn-outline btn-sm">
              Articles
            </Link>
          </div>
        }
      />

      <div className="kpis" style={{ marginBottom: 20 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background:
                  kpi.key === 'TOTAL'
                    ? 'hsl(var(--on-surface))'
                    : youthKpiBar(kpi.key as YouthWingStatus),
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {isLoading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: '18px 22px', marginBottom: 20 }}>
        <div className="ph" style={{ alignItems: 'flex-start' }}>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Growing up
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                margin: '4px 0 0',
                lineHeight: 1.6,
              }}
            >
              {overAge} member{overAge === 1 ? ' has' : 's have'} turned 18 and can no longer sit on
              the youth roll. {birthdaysSoon} {birthdaysSoon === 1 ? 'has a' : 'have'} birthday
              {birthdaysSoon === 1 ? '' : 's'} in the next 30 days.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isGraduating || overAge === 0}
            onClick={graduate}
          >
            Graduate over-18s
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        <Breakdown title="Age profile" data={ageCounts} />
        <Breakdown title="Gender" data={genderCounts} />
        <Breakdown title="Region / country" data={regionCounts} />
        <Breakdown title="Religion" data={religionCounts} />
      </div>

      <p
        style={{
          fontSize: 12,
          color: 'hsl(var(--on-surface-muted))',
          margin: '18px 0 0',
          lineHeight: 1.6,
        }}
      >
        Status vocabulary here is deliberately different from adult members:{' '}
        {(Object.keys(YOUTH_STATUS_META) as YouthWingStatus[])
          .map((s) => YOUTH_STATUS_META[s].label)
          .join(', ')}
        . A Youth Wing member is never &quot;verified&quot; against a Ghana Card or Voter ID.
      </p>
    </div>
  )
}
