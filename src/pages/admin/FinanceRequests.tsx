import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { financeService, type FinanceRequest } from '@/services/financeService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { toast } from 'sonner'

type RequestType = FinanceRequest['request_type']

interface ReviewModal {
  request: FinanceRequest
  action: 'Approved' | 'Rejected'
}

function statusPill(status: FinanceRequest['status']) {
  if (status === 'Approved') return <span className="pill pill-ok">Approved</span>
  if (status === 'Rejected') return <span className="pill pill-err">Rejected</span>
  return <span className="pill pill-warn">Pending</span>
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtAmount(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
}

const REQUEST_TYPES: RequestType[] = [
  'BudgetAllocation',
  'ExpenseReimbursement',
  'InventoryReplenishment',
]

const TYPE_LABELS: Record<RequestType, string> = {
  BudgetAllocation: 'Budget Allocation',
  ExpenseReimbursement: 'Expense Reimbursement',
  InventoryReplenishment: 'Inventory Replenishment',
}

export default function FinanceRequests() {
  // Re-read in useEffect to handle hard-refresh case where adminService
  // hasn't finished async initialize() when the component first renders.
  const [currentUser, setCurrentUser] = useState(adminService.getCurrentUser())
  const canReview = currentUser?.role === 'FINANCE_OFFICER' || currentUser?.role === 'SUPER_ADMIN'

  useEffect(() => {
    const u = adminService.getCurrentUser()
    if (u) setCurrentUser(u)
  }, [])

  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [reqType, setReqType] = useState<RequestType>('BudgetAllocation')
  const [chapter, setChapter] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Review modal
  const [modal, setModal] = useState<ReviewModal | null>(null)
  const [officerComment, setOfficerComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  async function loadRequests() {
    try {
      const data = await financeService.getRequests()
      setRequests(data)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!chapter.trim()) {
      toast.error('Chapter is required')
      return
    }
    if (isNaN(parsed) || parsed < 0.01) {
      toast.error('Amount must be at least 0.01')
      return
    }
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    setSubmitting(true)
    try {
      await financeService.createRequest({
        request_type: reqType,
        chapter: chapter.trim(),
        amount: parsed,
        description: description.trim(),
      })
      toast.success('Request submitted')
      setChapter('')
      setAmount('')
      setDescription('')
      setReqType('BudgetAllocation')
      await loadRequests()
    } catch {
      toast.error('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  function openModal(request: FinanceRequest, action: 'Approved' | 'Rejected') {
    setOfficerComment('')
    setModal({ request, action })
  }

  async function handleReview() {
    if (!modal) return
    if (!officerComment.trim()) {
      toast.error('A comment is required')
      return
    }

    setReviewing(true)
    try {
      await financeService.reviewRequest(modal.request.id, modal.action, officerComment.trim())
      toast.success(`Request ${modal.action.toLowerCase()} successfully`)
      setModal(null)
      await loadRequests()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('no longer available')) {
        toast.warning('This request is no longer available for review')
        setModal(null)
        await loadRequests()
      } else {
        toast.error('Failed to review request')
      }
    } finally {
      setReviewing(false)
    }
  }

  // KPI derivations
  const totalCount = requests.length
  const pendingCount = requests.filter((r) => r.status === 'Pending').length
  const approvedCount = requests.filter((r) => r.status === 'Approved').length

  // For non-finance-officer users, show only their own requests in the "My Requests" table.
  // RLS already filters on the DB side; for finance officers who see all, we split the view.
  const myRequests = canReview
    ? requests.filter((r) => r.requester_id === currentUser?.id)
    : requests

  const pendingRequests = requests.filter((r) => r.status === 'Pending')

  const kpis = [
    { label: 'Total Requests', value: totalCount, bar: 'hsl(var(--on-surface))' },
    { label: 'Pending', value: pendingCount, bar: 'hsl(var(--accent))' },
    { label: 'Approved', value: approvedCount, bar: 'hsl(var(--primary))' },
  ]

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <AdminPageHeader
        title="Finance Requests"
        icon="account_balance_wallet"
        description="Submit and manage internal finance requests"
      />

      {/* KPI Tiles */}
      {!loading && (
        <div className="kpis" style={{ marginBottom: 28 }}>
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
      )}

      {/* Panel A — Submit a Request */}
      <div className="panel" style={{ padding: 24, marginBottom: 28 }}>
        <div className="ph" style={{ marginBottom: 20 }}>
          <div>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Submit a Request
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
              Fill in the form below to submit a finance request for review.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Request Type */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Request Type
              </label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as RequestType)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Chapter
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Accra Central"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              />
            </div>

            {/* Amount */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Amount (GHS)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the purpose of this request..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
                fontSize: 14,
                boxSizing: 'border-box',
                fontFamily: "'Public Sans', sans-serif",
                resize: 'vertical',
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>

        {/* My Requests Table */}
        <div style={{ marginTop: 32 }}>
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              margin: '0 0 12px',
            }}
          >
            My Submitted Requests
          </h3>

          {loading ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>Loading…</p>
          ) : myRequests.length === 0 ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
              No requests submitted yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Date', 'Type', 'Chapter', 'Amount', 'Status', 'Officer Comment'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        verticalAlign: 'middle',
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                        {fmtDate(r.created_at)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface))' }}>
                        {TYPE_LABELS[r.request_type]}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface))' }}>
                        {r.chapter}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: 'hsl(var(--on-surface))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtAmount(r.amount)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{statusPill(r.status)}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                        {(r.status === 'Approved' || r.status === 'Rejected') && r.officer_comment
                          ? r.officer_comment
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Panel B — Review Inbox (Finance Officer / Super Admin only) */}
      {canReview && (
        <div className="panel" style={{ padding: 24, marginBottom: 28 }}>
          <div className="ph" style={{ marginBottom: 20 }}>
            <div>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Review Inbox
                {pendingCount > 0 && (
                  <span className="pill pill-warn" style={{ fontSize: 11 }}>
                    {pendingCount} pending
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
                Approve or reject pending finance requests from the team.
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>Loading…</p>
          ) : pendingRequests.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 14,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, display: 'block', marginBottom: 8 }}
              >
                inbox
              </span>
              No pending requests to review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    background: 'hsl(var(--container-low))',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 14,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {r.requester_name ?? 'Unknown'}
                    </p>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {TYPE_LABELS[r.request_type]} · {r.chapter} · {fmtAmount(r.amount)}
                    </p>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {r.description}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      Submitted {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openModal(r, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline-dest btn-sm"
                      onClick={() => openModal(r, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              width: '100%',
              maxWidth: 480,
              fontFamily: "'Public Sans', sans-serif",
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color:
                  modal.action === 'Approved' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
              }}
            >
              {modal.action === 'Approved' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '0 0 20px' }}>
              {modal.request.requester_name} · {fmtAmount(modal.request.amount)} ·{' '}
              {modal.request.chapter}
            </p>

            <div
              style={{
                background: 'hsl(var(--container-low))',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {modal.request.description}
            </div>

            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Officer Comment <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <textarea
              value={officerComment}
              onChange={(e) => setOfficerComment(e.target.value)}
              rows={3}
              placeholder="Provide a reason or note for this decision…"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
                fontSize: 14,
                boxSizing: 'border-box',
                fontFamily: "'Public Sans', sans-serif",
                resize: 'vertical',
                marginBottom: 20,
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
                disabled={reviewing}
              >
                Cancel
              </button>
              <button
                className={modal.action === 'Approved' ? 'btn btn-primary' : 'btn btn-dest'}
                onClick={handleReview}
                disabled={reviewing || !officerComment.trim()}
              >
                {reviewing
                  ? 'Processing…'
                  : modal.action === 'Approved'
                    ? 'Confirm Approve'
                    : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
