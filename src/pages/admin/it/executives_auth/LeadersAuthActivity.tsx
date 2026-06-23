import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from '../ITLayoutContext'
import {
  leaderActivityService,
  type LeaderAccount,
  type LeaderActivityBucket,
  type LeaderActivityCategory,
  type LeaderActivityRow,
} from '@/services/leaderActivityService'
import { ActivityTable, DetailModal } from './activityComponents'
import {
  actionLabel,
  fmtFull,
  pieColor,
  prettifyAction,
  resourceType,
  selectStyle,
  sourceLabel,
} from './shared'

const PAGE_SIZE = 25

function csvCell(value: string): string {
  // Quote any cell containing a comma, quote or newline (RFC 4180).
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(rows: LeaderActivityRow[]) {
  const header = [
    'Leader',
    'Role',
    'Type',
    'Event',
    'Target',
    'Status',
    'IP address',
    'Location',
    'When',
    'User agent',
  ]
  const body = rows.map((r) => {
    const isAction = r.source === 'action'
    return [
      r.admin_name,
      r.role ? prettifyAction(r.role) : '',
      sourceLabel(r.source),
      isAction ? prettifyAction(r.action) : actionLabel(r.action),
      isAction ? (r.resource ?? '') : (r.device_type ?? ''),
      isAction ? (r.status ?? '') : actionLabel(r.action),
      r.ip_address ?? '',
      r.location ?? '',
      fmtFull(r.created_at),
      r.user_agent ?? '',
    ]
  })
  const csv = [header, ...body].map((cols) => cols.map(csvCell).join(',')).join('\r\n')
  // Leading BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leaders-activity-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const CATEGORIES: { value: 'all' | LeaderActivityCategory; label: string }[] = [
  { value: 'all', label: 'All activity' },
  { value: 'action', label: 'In-app actions' },
  { value: 'device', label: 'Device & auth' },
]

export default function LeadersAuthActivity() {
  const navigate = useNavigate()
  const { setCurrentLabel } = usePageLabel()
  useEffect(() => setCurrentLabel('Leaders Auth · All Activity'), [setCurrentLabel])
  useITLayout(
    'All Activity',
    'history',
    'Every action and device event by privileged admin roles — statistics, filters and export.'
  )

  const [leaders, setLeaders] = useState<LeaderAccount[]>([])
  const [breakdown, setBreakdown] = useState<LeaderActivityBucket[]>([])

  const [activity, setActivity] = useState<LeaderActivityRow[]>([])
  const [filterAdmin, setFilterAdmin] = useState('all')
  const [filterCategory, setFilterCategory] = useState<'all' | LeaderActivityCategory>('all')
  const [activityLoading, setActivityLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [detail, setDetail] = useState<LeaderActivityRow | null>(null)

  // Leader accounts (for the filter) — loaded once.
  useEffect(() => {
    ;(async () => {
      try {
        setLeaders(await leaderActivityService.getAccounts())
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  // Breakdown — recomputed when the leader filter changes.
  useEffect(() => {
    ;(async () => {
      try {
        setBreakdown(
          await leaderActivityService.getBreakdown(filterAdmin === 'all' ? undefined : filterAdmin)
        )
      } catch (err) {
        console.error(err)
      }
    })()
  }, [filterAdmin])

  // offset/append passed explicitly so "load more" never reads a stale length.
  const loadActivity = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setActivityLoading(true)
      try {
        const rows = await leaderActivityService.getActivity({
          adminId: filterAdmin === 'all' ? undefined : filterAdmin,
          category: filterCategory === 'all' ? undefined : filterCategory,
          limit: PAGE_SIZE,
          offset,
        })
        setActivity((prev) => (append ? [...prev, ...rows] : rows))
        setHasMore(rows.length === PAGE_SIZE)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load activity')
      } finally {
        setActivityLoading(false)
        setLoadingMore(false)
      }
    },
    [filterAdmin, filterCategory]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivity(0, false)
  }, [loadActivity])

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await leaderActivityService.getAllActivity({
        adminId: filterAdmin === 'all' ? undefined : filterAdmin,
        category: filterCategory === 'all' ? undefined : filterCategory,
      })
      if (rows.length === 0) {
        toast.error('Nothing to export for these filters')
        return
      }
      downloadCsv(rows)
      toast.success(`Exported ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Pie data from the breakdown, honouring the category filter.
  const pieData = useMemo(() => {
    const filtered =
      filterCategory === 'all' ? breakdown : breakdown.filter((b) => b.source === filterCategory)
    return filtered.map((b, i) => ({
      key: `${b.source}:${b.label}`,
      label: b.source === 'device' ? actionLabel(b.label) : resourceType(b.label),
      value: b.value,
      color: pieColor(b.label, i),
    }))
  }, [breakdown, filterCategory])

  const totalEvents = useMemo(() => pieData.reduce((sum, d) => sum + d.value, 0), [pieData])

  const actionTotal = useMemo(
    () => breakdown.filter((b) => b.source === 'action').reduce((s, b) => s + b.value, 0),
    [breakdown]
  )
  const deviceTotal = useMemo(
    () => breakdown.filter((b) => b.source === 'device').reduce((s, b) => s + b.value, 0),
    [breakdown]
  )

  const filtered = filterAdmin !== 'all' || filterCategory !== 'all'

  const kpis = [
    { label: 'Total events', value: actionTotal + deviceTotal, bar: 'hsl(var(--on-surface))' },
    { label: 'In-app actions', value: actionTotal, bar: 'hsl(var(--primary))' },
    { label: 'Device & auth', value: deviceTotal, bar: 'hsl(var(--accent))' },
    { label: 'Tracked leaders', value: leaders.length, bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main">
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 16,
          fontSize: 12,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        <button
          onClick={() => navigate('/admin/it-department/leaders-auth')}
          className="btn btn-ghost btn-sm"
          style={{ padding: '2px 8px', gap: 4 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          Leaders Auth
        </button>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          chevron_right
        </span>
        <span style={{ color: 'hsl(var(--on-surface))' }}>All Activity</span>
      </div>

      {/* KPI tiles */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
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
                background: kpi.bar,
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
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Activity breakdown (pie) */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="ph">
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Activity breakdown
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Share of each event type{filterAdmin !== 'all' ? ' for the selected leader' : ''}.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: 18,
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: 24,
            alignItems: 'center',
          }}
        >
          {totalEvents === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 24,
                textAlign: 'center',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No activity to chart yet.
            </div>
          ) : (
            <>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: "'Public Sans'",
                        color: 'hsl(var(--on-surface))',
                      }}
                      itemStyle={{ color: 'hsl(var(--on-surface))' }}
                      formatter={(value: number, name: string) => [
                        `${value} (${Math.round((value / totalEvents) * 100)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ display: 'grid', gap: 8 }}>
                {pieData.map((d) => (
                  <div
                    key={d.key}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: d.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'hsl(var(--on-surface))', flex: 1 }}>{d.label}</span>
                    <span
                      style={{
                        color: 'hsl(var(--on-surface))',
                        fontWeight: 'var(--font-weight-medium, 500)',
                      }}
                    >
                      {d.value}
                    </span>
                    <span
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        width: 44,
                        textAlign: 'right',
                      }}
                    >
                      {Math.round((d.value / totalEvents) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full activity feed */}
      <div className="panel">
        <div
          className="ph"
          style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', rowGap: 12 }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Activity log
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Every action and device event, most recent first.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginLeft: 'auto',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All leaders</option>
              {leaders.map((l) => (
                <option key={l.admin_id} value={l.admin_id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'all' | LeaderActivityCategory)}
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExport}
              disabled={exporting || activityLoading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                download
              </span>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>

        <ActivityTable
          rows={activity}
          loading={activityLoading}
          emptyText={filtered ? 'No activity matches these filters.' : 'No activity yet.'}
          onView={setDetail}
          // ~20 rows tall, capped to the viewport, then the log scrolls in place.
          maxHeight="min(820px, 65vh)"
        />

        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          {activityLoading ? (
            <span style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>Loading…</span>
          ) : hasMore ? (
            <button
              className="btn btn-outline btn-sm"
              disabled={loadingMore}
              onClick={() => loadActivity(activity.length, true)}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            activity.length > 0 && (
              <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                End of activity
              </span>
            )
          )}
        </div>
      </div>

      {detail && <DetailModal entry={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
