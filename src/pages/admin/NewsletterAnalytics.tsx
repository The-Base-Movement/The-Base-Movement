import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { supabase } from '@/lib/supabase'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface NewsletterRow {
  id: string
  subject: string
  recipient_count: number
  delivered_count: number
  bounce_count: number
  open_count: number
  status: string
  audience_type: string
  audience_value: string | null
  sent_at: string | null
  created_at: string
}

interface Subscriber {
  id: string
  email: string
  status: string
  created_at: string
}

const COLORS = ['#006B3F', '#DAA520', '#CE1126', '#3b82f6', '#8b5cf6', '#9CA3AF']

const tooltipContentStyle = {
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 11,
  borderRadius: 'var(--radius-md)',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

const tooltipItemStyle = { color: 'hsl(var(--on-surface))' }
const tooltipLabelStyle = { color: 'hsl(var(--on-surface))', fontWeight: 500, marginBottom: 4 }
const tooltipCursor = { fill: 'hsl(var(--border) / 0.3)' }

const labelStyle: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)' as string,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  margin: '0 0 8px',
}

export default function NewsletterAnalytics() {
  const [newsletters, setNewsletters] = useState<NewsletterRow[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [nlRes, subRes] = await Promise.all([
        supabase
          .from('newsletters')
          .select(
            'id,subject,recipient_count,delivered_count,bounce_count,open_count,status,audience_type,audience_value,sent_at,created_at'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('newsletter_subscribers')
          .select('id,email,status,created_at')
          .order('created_at', { ascending: false }),
      ])
      setNewsletters((nlRes.data ?? []) as NewsletterRow[])
      setSubscribers((subRes.data ?? []) as Subscriber[])
      setLoading(false)
    }
    load()
  }, [])

  const totalSent = newsletters.filter((n) => n.status === 'sent').length
  const totalFailed = newsletters.filter((n) => n.status === 'failed').length
  const totalRecipients = newsletters.reduce((sum, n) => sum + (n.recipient_count || 0), 0)
  const totalDelivered = newsletters.reduce((sum, n) => sum + (n.delivered_count || 0), 0)
  const totalBounces = newsletters.reduce((sum, n) => sum + (n.bounce_count || 0), 0)
  const totalOpens = newsletters.reduce((sum, n) => sum + (n.open_count || 0), 0)
  const activeSubscribers = subscribers.filter((s) => s.status === 'Active').length
  const unsubscribed = subscribers.filter((s) => s.status !== 'Active').length

  // Subscriber growth over time (by month)
  const subsByMonth: Record<string, number> = {}
  for (const s of subscribers) {
    const month = new Date(s.created_at).toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    })
    subsByMonth[month] = (subsByMonth[month] || 0) + 1
  }
  const growthData = Object.entries(subsByMonth)
    .reverse()
    .reduce<{ month: string; subscribers: number; cumulative: number }[]>((acc, [month, count]) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
      acc.push({ month, subscribers: count, cumulative: prev + count })
      return acc
    }, [])

  // Audience breakdown
  const audienceMap: Record<string, number> = {}
  for (const n of newsletters) {
    const key =
      n.audience_type === 'all' ? 'All Members' : `${n.audience_type}: ${n.audience_value || '—'}`
    audienceMap[key] = (audienceMap[key] || 0) + 1
  }
  const audienceData = Object.entries(audienceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Send volume over time
  const sendsByMonth: Record<string, { sent: number; recipients: number }> = {}
  for (const n of newsletters) {
    if (!n.sent_at) continue
    const month = new Date(n.sent_at).toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    })
    if (!sendsByMonth[month]) sendsByMonth[month] = { sent: 0, recipients: 0 }
    sendsByMonth[month].sent++
    sendsByMonth[month].recipients += n.recipient_count || 0
  }
  const sendVolumeData = Object.entries(sendsByMonth)
    .map(([month, data]) => ({ month, ...data }))
    .reverse()

  // Delivery performance
  const deliveryData = [
    { name: 'Delivered', value: totalDelivered || Math.max(totalRecipients - totalBounces, 0) },
    { name: 'Bounced', value: totalBounces },
    { name: 'Failed', value: totalFailed },
  ].filter((d) => d.value > 0)

  if (loading) {
    return (
      <div className="main">
        <AdminPageHeader title="Newsletter Analytics" description="Loading..." icon="analytics" />
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 24,
              animation: 'spin 1s linear infinite',
              color: 'hsl(var(--primary))',
            }}
          >
            progress_activity
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Newsletter Analytics"
        description="Performance metrics, subscriber growth, and send history"
        icon="analytics"
      />

      <div style={{ marginBottom: 12 }}>
        <Link
          to="/admin/newsletter"
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: 'hsl(var(--primary))',
            textDecoration: 'none',
          }}
        >
          ← Back to Newsletter
        </Link>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Sent', value: totalSent.toString(), bar: 'hsl(var(--on-surface))' },
          {
            label: 'Total Recipients',
            value: totalRecipients.toLocaleString(),
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Active Subscribers',
            value: activeSubscribers.toLocaleString(),
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Unsubscribed',
            value: unsubscribed.toLocaleString(),
            bar: 'hsl(var(--destructive))',
          },
          {
            label: 'Open Rate',
            value:
              totalRecipients > 0 ? `${Math.round((totalOpens / totalRecipients) * 100)}%` : '—',
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Bounce Rate',
            value:
              totalRecipients > 0 ? `${Math.round((totalBounces / totalRecipients) * 100)}%` : '—',
            bar: 'hsl(var(--destructive))',
          },
        ].map((kpi) => (
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

      {/* Charts row 1: Subscriber Growth + Audience Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="panel" style={{ padding: '16px 18px' }}>
          <p style={labelStyle}>Subscriber Growth</p>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={growthData} margin={{ left: 10, right: 20, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }}
                />
                <YAxis tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }} />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={tooltipCursor}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#006B3F"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Total Subscribers"
                />
                <Line
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#DAA520"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="New This Month"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              No subscriber data yet
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: '16px 18px' }}>
          <p style={labelStyle}>Audience Breakdown</p>
          {audienceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={audienceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {audienceData.map((_entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={tooltipCursor}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {audienceData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COLORS[i % COLORS.length],
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        flex: 1,
                      }}
                    >
                      {d.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              No newsletters sent yet
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2: Send Volume + Delivery Performance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="panel" style={{ padding: '16px 18px' }}>
          <p style={labelStyle}>Send Volume Over Time</p>
          {sendVolumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sendVolumeData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }}
                />
                <YAxis tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }} />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={tooltipCursor}
                />
                <Bar
                  dataKey="recipients"
                  fill="#006B3F"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                  name="Recipients"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              No send history yet
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: '16px 18px' }}>
          <p style={labelStyle}>Delivery Performance</p>
          {deliveryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#006B3F" />
                    <Cell fill="#DAA520" />
                    <Cell fill="#CE1126" />
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={tooltipCursor}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                {deliveryData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ['#006B3F', '#DAA520', '#CE1126'][i],
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              No delivery data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Subscribers Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ph">
          <h3>Recent Subscribers</h3>
          <span className="meta">{subscribers.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: 'center',
                      padding: '32px 16px',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                    }}
                  >
                    No subscribers yet
                  </td>
                </tr>
              ) : (
                subscribers.slice(0, 20).map((s) => (
                  <tr key={s.id}>
                    <td
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {s.email}
                    </td>
                    <td>
                      <span className={s.status === 'Active' ? 'pill pill-ok' : 'pill pill-mute'}>
                        {s.status}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {new Date(s.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
