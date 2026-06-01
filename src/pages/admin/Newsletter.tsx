import { useState, useEffect, useCallback } from 'react'
import { newsletterService } from '@/services/newsletterService'
import type { AudienceFilter, Newsletter } from '@/services/newsletterService'
import { adminService } from '@/services/adminService'
import { ComposePanel } from './newsletter/ComposePanel'
import { HistoryPanel } from './newsletter/HistoryPanel'

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const currentUser = adminService.getCurrentUser()
  const canDelete = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'FOUNDER'

  const fetchNewsletters = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await newsletterService.getNewsletters()
      setNewsletters(data)
    } catch {
      // fail silently — history is non-critical
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNewsletters()
  }, [fetchNewsletters])

  async function send(
    subject: string,
    bodyHtml: string,
    filters: AudienceFilter[],
    newsletter_id?: string
  ) {
    setIsSending(true)
    setSendResult(null)
    const id = newsletter_id ?? crypto.randomUUID()
    const isMulti = filters.length > 1
    const primaryType = isMulti ? 'multi' : (filters[0]?.type ?? 'all')
    const primaryValue = isMulti ? null : (filters[0]?.value ?? null)
    try {
      const { sent } = await newsletterService.createAndSend({
        newsletter_id: id,
        subject,
        body_html: bodyHtml,
        audience_type: primaryType,
        audience_value: primaryValue,
        audience_filters: filters,
      })
      setSendResult(
        `✓ Newsletter sent to ${sent.toLocaleString()} recipient${sent !== 1 ? 's' : ''}.`
      )
      fetchNewsletters()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSendResult(`✗ Send failed: ${msg}`)
    } finally {
      setIsSending(false)
    }
  }

  function handleSend(subject: string, bodyHtml: string, filters: AudienceFilter[]) {
    send(subject, bodyHtml, filters)
  }

  function handleResend(n: Newsletter) {
    const filters: AudienceFilter[] =
      n.audience_filters && n.audience_filters.length > 0
        ? n.audience_filters
        : [{ type: n.audience_type === 'multi' ? 'all' : n.audience_type, value: n.audience_value }]
    send(n.subject, n.body_html, filters as AudienceFilter[])
  }

  // KPI derivations
  const thisMonth = newsletters.filter((n) => {
    const d = new Date(n.sent_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const totalRecipients = newsletters.reduce((sum, n) => sum + n.recipient_count, 0)
  const lastSent = newsletters[0]
    ? new Date(newsletters[0].sent_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  const kpis = [
    {
      label: 'Total sent',
      value: newsletters.length.toLocaleString(),
      bar: 'hsl(var(--on-surface))',
    },
    { label: 'Sent this month', value: thisMonth.toLocaleString(), bar: 'hsl(var(--primary))' },
    {
      label: 'Total recipients',
      value: totalRecipients.toLocaleString(),
      bar: 'hsl(var(--accent))',
    },
    { label: 'Last sent', value: lastSent, bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
          >
            mail
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 20,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Newsletter
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Compose and send branded email newsletters to members and staff via SendGrid.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
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
                fontFamily: "'Public Sans', sans-serif",
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
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Send result banner */}
      {sendResult && (
        <div
          style={{
            padding: '8px 14px',
            marginBottom: 14,
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            background: sendResult.startsWith('✓')
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            color: sendResult.startsWith('✓') ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            border: `1px solid ${sendResult.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{sendResult}</span>
          <button
            onClick={() => setSendResult(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 4px',
              color: 'inherit',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        </div>
      )}

      <ComposePanel isSending={isSending} onSend={handleSend} />

      <div style={{ marginTop: 20 }}>
        <HistoryPanel
          newsletters={newsletters}
          isLoading={isLoading}
          canDelete={canDelete}
          onDelete={async (ids) => {
            await newsletterService.deleteNewsletters(ids)
            await fetchNewsletters()
          }}
          onResend={handleResend}
        />
      </div>
    </div>
  )
}
