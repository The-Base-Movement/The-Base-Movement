import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  monthlyDuesService,
  type FinanceDuesPaymentRow,
  type MonthlyDuesConsent,
  type MonthlyDuesEnrollment,
} from '@/services/monthlyDuesService'
import { computeDuesKpis } from '@/services/financeAnalyticsService'
import MonthlyDuesSettings from '@/components/admin/finance/MonthlyDuesSettings'

const FONT = "'Public Sans', sans-serif"

function fmtGhs(n: number) {
  return `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusPill(status: string) {
  if (status === 'paid') return 'pill-ok'
  if (status === 'due' || status === 'pending') return 'pill-warn'
  if (status === 'failed' || status === 'overdue') return 'pill-err'
  return 'pill-mute'
}

/** A payment can be manually verified only when no provider settled it. */
function canVerifyOffline(payment: FinanceDuesPaymentRow) {
  return (
    !payment.provider_transaction_id &&
    ['due', 'pending', 'failed', 'overdue'].includes(payment.status)
  )
}

export default function MonthlyDuesPanel() {
  const [payments, setPayments] = useState<FinanceDuesPaymentRow[]>([])
  const [enrollments, setEnrollments] = useState<MonthlyDuesEnrollment[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [consentHistory, setConsentHistory] = useState<MonthlyDuesConsent[] | null>(null)
  const [consentMemberName, setConsentMemberName] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [paymentRows, enrollmentRows] = await Promise.all([
        monthlyDuesService.listFinancePayments(),
        monthlyDuesService.listFinanceEnrollments(),
      ])
      setPayments(paymentRows)
      setEnrollments(enrollmentRows)
    } catch {
      toast.error('Could not load monthly dues data.')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const kpis = useMemo(() => computeDuesKpis(enrollments, payments), [enrollments, payments])

  const months = useMemo(
    () => [...new Set(payments.map((p) => p.dues_month.slice(0, 10)))].sort().reverse(),
    [payments]
  )

  const filtered = useMemo(() => {
    let list = payments
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.member_name ?? '').toLowerCase().includes(q) ||
          (p.member_reg_no ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (monthFilter !== 'all') list = list.filter((p) => p.dues_month.slice(0, 10) === monthFilter)
    return list
  }, [payments, search, statusFilter, monthFilter])

  const handleVerifyOffline = async (payment: FinanceDuesPaymentRow) => {
    const notes = window.prompt(
      'Verification notes are required (how was this payment received?)',
      ''
    )
    if (!notes || !notes.trim()) {
      if (notes !== null) toast.error('Verification notes are required.')
      return
    }
    setBusy(true)
    try {
      await monthlyDuesService.verifyOfflinePayment(payment.id, notes.trim())
      toast.success('Offline payment verified.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleShowConsent = async (payment: FinanceDuesPaymentRow) => {
    try {
      setConsentMemberName(payment.member_name ?? payment.member_id)
      setConsentHistory(await monthlyDuesService.getMemberConsentHistory(payment.member_id))
    } catch {
      toast.error('Could not load consent history.')
    }
  }

  const kpiTiles = [
    { label: 'Enrolled', value: kpis.enrolled, bar: 'hsl(var(--on-surface))' },
    { label: 'Paid', value: kpis.paid, bar: 'hsl(var(--primary))' },
    { label: 'Due', value: kpis.due, bar: 'hsl(var(--accent))' },
    { label: 'Overdue', value: kpis.overdue, bar: 'hsl(var(--destructive))' },
    { label: 'Opted Out', value: kpis.optedOut, bar: 'hsl(var(--on-surface-muted))' },
    { label: 'Collected', value: fmtGhs(kpis.collectedGhs), bar: 'hsl(var(--primary))' },
  ]

  const th: React.CSSProperties = {
    padding: '11px 14px',
    textAlign: 'left',
    fontFamily: FONT,
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 12,
    color: 'hsl(var(--on-surface))',
    fontFamily: FONT,
    fontWeight: 'var(--font-weight-medium, 500)',
    whiteSpace: 'nowrap',
  }
  const selectStyle: React.CSSProperties = {
    height: 34,
    padding: '0 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color: 'hsl(var(--on-surface))',
    fontSize: 12,
    fontFamily: FONT,
    cursor: 'pointer',
    boxSizing: 'border-box',
  }

  return (
    <>
      <MonthlyDuesSettings onSaved={load} />

      {/* KPIs */}
      <div className="kpis" style={{ margin: '20px 0' }}>
        {kpiTiles.map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
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
              {k.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <input
          type="text"
          aria-label="Search members"
          placeholder="Search member or reg no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            height: 34,
            padding: '0 10px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--on-surface))',
            fontSize: 12,
            fontFamily: FONT,
            boxSizing: 'border-box',
            minWidth: 200,
          }}
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          {['due', 'pending', 'paid', 'failed', 'overdue', 'waived', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m.slice(0, 7)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Member', 'Month', 'Due', 'Amount', 'Mode', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={td}>
                    {p.member_name ?? '—'}
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: 'monospace',
                      }}
                    >
                      {p.member_reg_no ?? p.member_id.slice(0, 8)}
                    </span>
                  </td>
                  <td style={td}>{p.dues_month.slice(0, 7)}</td>
                  <td style={{ ...td, color: 'hsl(var(--on-surface-muted))' }}>
                    {p.due_date.slice(0, 10)}
                  </td>
                  <td style={td}>{fmtGhs(p.amount_ghs)}</td>
                  <td style={{ ...td, color: 'hsl(var(--on-surface-muted))' }}>
                    {p.payment_mode === 'offline'
                      ? 'Offline'
                      : p.payment_mode === 'recurring_hubtel'
                        ? 'Recurring'
                        : 'Hubtel'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`pill ${statusPill(p.status)}`}>{p.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                    {canVerifyOffline(p) && (
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={busy}
                        onClick={() => handleVerifyOffline(p)}
                      >
                        Verify offline
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleShowConsent(p)}
                      title="Consent history"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        history
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...td, textAlign: 'center', padding: '32px 14px' }}>
                    No dues records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-only">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              style={{
                padding: '14px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontFamily: FONT,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {p.member_name ?? p.member_reg_no ?? '—'}
                </p>
                <span className={`pill ${statusPill(p.status)}`}>{p.status}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: FONT,
                }}
              >
                <span>{p.dues_month.slice(0, 7)}</span>
                <span>·</span>
                <span>{fmtGhs(p.amount_ghs)}</span>
                <span>·</span>
                <span>Due {p.due_date.slice(0, 10)}</span>
              </div>
              {canVerifyOffline(p) && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  disabled={busy}
                  onClick={() => handleVerifyOffline(p)}
                >
                  Verify offline
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consent history modal */}
      {consentHistory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setConsentHistory(null)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 520,
              width: '92%',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: 13, fontFamily: FONT }}>
              Consent history — {consentMemberName}
            </h3>
            {consentHistory.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: FONT,
                }}
              >
                No consent records.
              </p>
            ) : (
              consentHistory.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid hsl(var(--border))',
                    fontSize: 12,
                    fontFamily: FONT,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                    {new Date(c.recorded_at).toLocaleString('en-GB')} · {c.source}
                  </span>
                  <br />
                  Email {c.email_enabled ? 'on' : 'off'} · SMS {c.sms_enabled ? 'on' : 'off'} ·
                  Enrollment {c.dues_enrollment_enabled ? 'on' : 'off'} · Recurring{' '}
                  {c.recurring_payment_authorized ? 'authorized' : 'not authorized'}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
