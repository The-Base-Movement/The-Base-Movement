import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import {
  userActivityService,
  type ActivityEntry,
  type ActivitySource,
  type ActivityType,
  type UserActivityAnalytics,
} from '@/services/userActivityService'

type RangeKey = '24h' | '7d' | '30d' | '90d'
type BucketKey = 'hour' | 'day' | 'week' | 'month'

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: '24h', label: '24 hours', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
]

const BUCKET_OPTIONS: { key: BucketKey; label: string }[] = [
  { key: 'hour', label: 'Hours' },
  { key: 'day', label: 'Days' },
  { key: 'week', label: 'Weeks' },
  { key: 'month', label: 'Months' },
]

const ICON_MAP: Record<ActivityType, string> = {
  login: 'login',
  logout: 'logout',
  profile_update: 'manage_accounts',
  password_change: 'lock_reset',
  donation: 'volunteer_activism',
  poll_vote: 'how_to_vote',
  store_order: 'shopping_bag',
  notification: 'notifications',
  wishlist: 'favorite',
  helpdesk_ticket: 'support_agent',
  chapter_poll_vote: 'ballot',
  feedback: 'forum',
  voter_registration: 'how_to_reg',
}

const SOURCE_COLORS: Record<ActivitySource, string> = {
  activity_log: 'hsl(var(--primary))',
  donations: 'hsl(var(--accent))',
  poll_votes: 'hsl(var(--destructive))',
  store_orders: 'hsl(var(--on-surface))',
  notifications: 'hsl(var(--primary) / 0.68)',
  wishlist: 'hsl(var(--accent) / 0.78)',
  helpdesk_tickets: 'hsl(var(--destructive) / 0.72)',
  chapter_poll_votes: 'hsl(var(--on-surface-muted))',
  member_feedback: 'hsl(var(--primary) / 0.46)',
  voter_registrations: 'hsl(var(--accent) / 0.52)',
}

function rangeStart(range: RangeKey): Date {
  const days = RANGE_OPTIONS.find((option) => option.key === range)?.days ?? 7
  const start = new Date()
  start.setDate(start.getDate() - days)
  return start
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function bucketKey(date: Date, bucket: BucketKey): string {
  if (bucket === 'hour') {
    return `${date.toISOString().slice(0, 13)}:00`
  }
  if (bucket === 'week') {
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return weekStart.toISOString().slice(0, 10)
  }
  if (bucket === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  return date.toISOString().slice(0, 10)
}

function bucketLabel(key: string, bucket: BucketKey): string {
  if (bucket === 'hour') {
    return new Date(key).toLocaleTimeString('en-US', { hour: '2-digit' })
  }
  if (bucket === 'week') return `Week of ${formatShortDate(key)}`
  if (bucket === 'month') {
    const [year, month] = key.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  }
  return formatShortDate(key)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

function getTopHour(entries: ActivityEntry[]): string {
  if (entries.length === 0) return '—'
  const hours = new Map<number, number>()
  entries.forEach((entry) => {
    const hour = new Date(entry.created_at).getHours()
    hours.set(hour, (hours.get(hour) ?? 0) + 1)
  })
  const top = Array.from(hours.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (top === undefined) return '—'
  return new Date(2026, 0, 1, top).toLocaleTimeString('en-US', { hour: 'numeric' })
}

export default function Activity() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<UserActivityAnalytics>({ entries: [], sources: [] })
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>('7d')
  const [bucket, setBucket] = useState<BucketKey>('day')
  const [sourceFilter, setSourceFilter] = useState<ActivitySource | 'all'>('all')

  useEffect(() => {
    if (!user) {
      const clearLoading = async () => {
        setLoading(false)
      }
      void clearLoading()
      return
    }
    let active = true
    const loadAnalytics = async () => {
      setLoading(true)
      const data = await userActivityService.getUserActivityAnalytics(user.id, rangeStart(range))
      if (!active) return
      setAnalytics(data)
      setLoading(false)
    }
    void loadAnalytics()
    return () => {
      active = false
    }
  }, [range, user])

  const filteredEntries = useMemo(() => {
    if (sourceFilter === 'all') return analytics.entries
    return analytics.entries.filter((entry) => entry.source === sourceFilter)
  }, [analytics.entries, sourceFilter])

  const timeSeries = useMemo(() => {
    const buckets = new Map<
      string,
      { key: string; label: string; events: number; minutes: number }
    >()
    filteredEntries.forEach((entry) => {
      const date = new Date(entry.created_at)
      const key = bucketKey(date, bucket)
      const current = buckets.get(key) ?? {
        key,
        label: bucketLabel(key, bucket),
        events: 0,
        minutes: 0,
      }
      current.events += 1
      current.minutes += entry.minutes ?? 0
      buckets.set(key, current)
    })
    return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key))
  }, [bucket, filteredEntries])

  const sourceBreakdown = useMemo(() => {
    const sources = new Map<
      ActivitySource,
      { source: ActivitySource; label: string; value: number }
    >()
    filteredEntries.forEach((entry) => {
      const source = entry.source ?? 'activity_log'
      const label = entry.source_label ?? 'Account events'
      const current = sources.get(source) ?? { source, label, value: 0 }
      current.value += 1
      sources.set(source, current)
    })
    return Array.from(sources.values()).sort((a, b) => b.value - a.value)
  }, [filteredEntries])

  const hourData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
    filteredEntries.forEach((entry) => {
      counts[new Date(entry.created_at).getHours()].count += 1
    })
    return counts
  }, [filteredEntries])

  const totalMinutes = filteredEntries.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0)
  const totalValue = filteredEntries.reduce((sum, entry) => sum + (entry.value ?? 0), 0)
  const loadedSources = analytics.sources.filter((source) => source.loaded).length
  const activeDays = new Set(filteredEntries.map((entry) => entry.created_at.slice(0, 10))).size

  const kpis = [
    {
      label: 'Tracked events',
      value: filteredEntries.length.toLocaleString(),
      sub: `${loadedSources}/${analytics.sources.length || 10} sources active`,
      icon: 'analytics',
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Est. time spent',
      value: formatDuration(totalMinutes),
      sub: 'Based on dashboard actions',
      icon: 'schedule',
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Active days',
      value: String(activeDays),
      sub: `Peak ${getTopHour(filteredEntries)}`,
      icon: 'calendar_month',
      bar: 'hsl(var(--destructive))',
    },
    {
      label: 'Movement value',
      value: totalValue > 0 ? `₵${totalValue.toLocaleString()}` : '—',
      sub: 'Donations + store orders',
      icon: 'payments',
      bar: 'hsl(var(--on-surface))',
    },
  ]

  return (
    <div className="main" style={{ paddingBottom: 40 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Dashboard analytics
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 'var(--fs-xl, 28px)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              lineHeight: 1,
            }}
          >
            My Activity
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            Track your dashboard actions, participation, donations, orders, support tickets, and
            alerts in one analytical view.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={range === option.key ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
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
                <p
                  style={{ margin: '4px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}
                >
                  {kpi.sub}
                </p>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: kpi.bar, opacity: 0.85 }}
              >
                {kpi.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h3>Activity timeline</h3>
              <p>Events and estimated minutes by selected interval.</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUCKET_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  className={
                    bucket === option.key
                      ? 'btn btn-active-tab btn-sm'
                      : 'btn btn-inactive-tab btn-sm'
                  }
                  onClick={() => setBucket(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: 18, height: 300 }}>
            {loading ? (
              <LoadingBlock />
            ) : timeSeries.length === 0 ? (
              <EmptyBlock label="No activity for this filter." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="events"
                    tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis yAxisId="minutes" orientation="right" hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    yAxisId="events"
                    dataKey="events"
                    name="Events"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="minutes"
                    type="monotone"
                    dataKey="minutes"
                    name="Minutes"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h3>Source mix</h3>
              <p>Where your activity came from.</p>
            </div>
          </div>
          <div style={{ padding: 18, height: 300 }}>
            {loading ? (
              <LoadingBlock />
            ) : sourceBreakdown.length === 0 ? (
              <EmptyBlock label="No source data yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceBreakdown}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {sourceBreakdown.map((entry) => (
                      <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginTop: 18,
        }}
      >
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h3>Hourly rhythm</h3>
              <p>When your dashboard activity usually happens.</p>
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
              {hourData.map((hour) => {
                const max = Math.max(...hourData.map((item) => item.count), 1)
                return (
                  <div
                    key={hour.hour}
                    title={`${hour.hour}:00 · ${hour.count} events`}
                    style={{
                      height: 34,
                      borderRadius: 'var(--radius-sm)',
                      background:
                        hour.count === 0
                          ? 'hsl(var(--container-low))'
                          : `hsl(var(--primary) / ${0.18 + (hour.count / max) * 0.72})`,
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                )
              })}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h3>Tracked sources</h3>
              <p>Tables queried for this member account.</p>
            </div>
          </div>
          <div style={{ padding: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              className={
                sourceFilter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
              }
              onClick={() => setSourceFilter('all')}
            >
              All sources
            </button>
            {analytics.sources.map((source) => (
              <button
                key={source.source}
                className={
                  sourceFilter === source.source
                    ? 'btn btn-primary btn-sm'
                    : 'btn btn-outline btn-sm'
                }
                onClick={() => setSourceFilter(source.source)}
                style={{ opacity: source.loaded ? 1 : 0.58 }}
              >
                {source.loaded ? 'database' : 'database_off'} {source.label} · {source.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18, overflow: 'hidden' }}>
        <div className="ph" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3>Activity ledger</h3>
            <p>Latest account actions across dashboard modules.</p>
          </div>
          <span className="pill pill-mute">{filteredEntries.length} records</span>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : filteredEntries.length === 0 ? (
          <EmptyBlock label="No activity records found for this view." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))' }}>
                  {['Event', 'Source', 'Time', 'Duration', 'Value', 'Status'].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: '11px 14px',
                        textAlign: 'left',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                        borderBottom: '1px solid hsl(var(--border))',
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 80).map((entry) => (
                  <tr
                    key={`${entry.source}-${entry.id}`}
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 18,
                            color: SOURCE_COLORS[entry.source ?? 'activity_log'],
                          }}
                        >
                          {ICON_MAP[entry.action_type] ?? 'history'}
                        </span>
                        <span style={{ fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                          {entry.description}
                        </span>
                      </div>
                    </td>
                    <td style={tdMuted}>{entry.source_label ?? 'Account events'}</td>
                    <td style={tdMuted}>
                      {formatShortDate(entry.created_at)} · {formatTime(entry.created_at)}
                    </td>
                    <td style={tdMuted}>{formatDuration(entry.minutes ?? 0)}</td>
                    <td style={tdMuted}>
                      {entry.value ? `₵${entry.value.toLocaleString()}` : '—'}
                    </td>
                    <td style={tdMuted}>{entry.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const tdMuted: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 12,
  color: 'hsl(var(--on-surface-muted))',
}

function LoadingBlock() {
  return (
    <div
      style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 30,
          color: 'hsl(var(--primary))',
          animation: 'spin 1.2s linear infinite',
        }}
      >
        sync
      </span>
    </div>
  )
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(var(--on-surface-muted))',
        fontSize: 13,
      }}
    >
      {label}
    </div>
  )
}

type TooltipItem = {
  name?: string
  value?: number | string
  color?: string
  payload?: { fill?: string }
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        padding: '8px 10px',
        boxShadow: '0 10px 24px hsl(var(--on-surface) / 0.12)',
        color: 'hsl(var(--on-surface))',
        fontSize: 11,
      }}
    >
      {label && (
        <div style={{ marginBottom: 6, color: 'hsl(var(--on-surface-muted))' }}>{label}</div>
      )}
      {payload.map((item) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 'var(--radius-pill)',
              background: item.color || item.payload?.fill,
            }}
          />
          <span>{item.name}</span>
          <span style={{ marginLeft: 'auto' }}>
            {item.name === 'Minutes' ? formatDuration(Number(item.value)) : item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
