/**
 * Finance Requests Operations Page
 * -------------------------------------------------------------
 * Allows administrative personnel to submit and track budget allocations,
 * expense reimbursements, and inventory replenishment requests.
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { financeService, type FinanceRequest } from '@/services/financeService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'
import { toast } from 'sonner'
import type { Region, Chapter } from '@/types/admin'

type ScopeType = 'region' | 'chapter'

type RequestType = FinanceRequest['request_type']

// Helper to render formatted badge status pill element for request statuses
function statusPill(status: FinanceRequest['status']) {
  if (status === 'Approved') return <span className="pill pill-ok">Approved</span>
  if (status === 'Rejected') return <span className="pill pill-err">Rejected</span>
  return <span className="pill pill-warn">Pending</span>
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

// Utility to format raw numeric values to Ghanaian Cedi currency string representation
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

// ─── Sub-nav ─────────────────────────────────────────────────────────────────

// Sub-navigation bar component for filtering between request submission and review inbox views
function FinanceSubNav({ pendingCount }: { pendingCount: number }) {
  const location = useLocation()
  const tabs = [
    { to: '/admin/finance-requests', label: 'Finance Requests', icon: 'request_quote' },
    {
      to: '/admin/finance-requests/review-inbox',
      label: 'Review Inbox',
      icon: 'inbox',
      badge: pendingCount,
    },
  ]
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        borderBottom: '1px solid hsl(var(--border))',
        paddingBottom: 0,
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={active ? 'btn-active-tab' : 'btn-inactive-tab'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              marginBottom: -1,
              textDecoration: 'none',
              fontSize: 12,
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {tab.icon}
            </span>
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                style={{
                  background: 'hsl(var(--accent))',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-pill)',
                  lineHeight: 1.4,
                }}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Primary page component managing interior finance request submissions and history table
export default function FinanceRequests() {
  const [currentUser, setCurrentUser] = useState(adminService.getCurrentUser())
  const canReview = currentUser?.role === 'FINANCE_OFFICER' || currentUser?.role === 'SUPER_ADMIN'

  useEffect(() => {
    const timer = setTimeout(() => {
      const u = adminService.getCurrentUser()
      if (u) setCurrentUser(u)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [reqType, setReqType] = useState<RequestType>('BudgetAllocation')
  const [scope, setScope] = useState<ScopeType>('region')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedConstituency, setSelectedConstituency] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [submitting, setSubmitting] = useState(false)

  const [regions, setRegions] = useState<Region[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])

  useEffect(() => {
    adminService
      .getRegions()
      .then(setRegions)
      .catch(() => {})
    adminService
      .getChapters()
      .then(setChapters)
      .catch(() => {})
  }, [])

  const constituenciesForRegion = useMemo(() => {
    if (!selectedRegion) return []
    const r = regions.find((reg) => reg.name === selectedRegion)
    return r?.constituencies ?? []
  }, [regions, selectedRegion])

  const chapter = useMemo(() => {
    if (scope === 'chapter') return selectedChapter
    if (!selectedRegion) return ''
    if (selectedConstituency) return `${selectedRegion} — ${selectedConstituency}`
    return selectedRegion
  }, [scope, selectedRegion, selectedConstituency, selectedChapter])

  // Asynchronously loads all submitted finance requests from the database
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
    const timer = setTimeout(() => {
      loadRequests()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Submits a new budget or reimbursement request form to the database
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!chapter) {
      toast.error(scope === 'region' ? 'Region is required' : 'Chapter is required')
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
        category,
      })
      toast.success('Request submitted')
      setSelectedRegion('')
      setSelectedConstituency('')
      setSelectedChapter('')
      setAmount('')
      setDescription('')
      setCategory('Other')
      setReqType('BudgetAllocation')
      await loadRequests()
    } catch {
      toast.error('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCount = requests.length
  const pendingCount = requests.filter((r) => r.status === 'Pending').length
  const approvedCount = requests.filter((r) => r.status === 'Approved').length

  const myRequests = canReview
    ? requests.filter((r) => r.requester_id === currentUser?.id)
    : requests

  const [mySearch, setMySearch] = useState('')
  const [mySortOrder, setMySortOrder] = useState<'asc' | 'desc'>('asc')
  const [detailRequest, setDetailRequest] = useState<FinanceRequest | null>(null)

  const sortedMyRequests = useMemo(() => {
    const list = myRequests.filter((r) => {
      const q = mySearch.toLowerCase()
      return (
        (r.description || '').toLowerCase().includes(q) ||
        (r.chapter || '').toLowerCase().includes(q) ||
        TYPE_LABELS[r.request_type].toLowerCase().includes(q)
      )
    })
    return list.sort((a, b) => {
      const descA = a.description || ''
      const descB = b.description || ''
      return mySortOrder === 'asc' ? descA.localeCompare(descB) : descB.localeCompare(descA)
    })
  }, [myRequests, mySearch, mySortOrder])

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
        actions={
          canReview ? (
            <Link
              to="/admin/finance-requests/review-inbox"
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                inbox
              </span>
              Review Inbox
              {pendingCount > 0 && (
                <span
                  style={{
                    background: 'hsl(var(--accent))',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-pill)',
                    lineHeight: 1.4,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          ) : undefined
        }
      />

      <FinanceSubNav pendingCount={canReview ? pendingCount : 0} />

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

      {/* Submit a Request */}
      <div className="panel" style={{ padding: 24 }}>
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
            <div>
              <label
                htmlFor="req-type"
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
                id="req-type"
                name="req-type"
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

            <div>
              <label
                htmlFor="req-category"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Category
              </label>
              <select
                id="req-category"
                name="req-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                <option value="Logistics">Logistics</option>
                <option value="Transport">Transport</option>
                <option value="Venues">Venues</option>
                <option value="Other">Other</option>
              </select>
            </div>

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
                Region / Chapter
              </label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as ScopeType)
                  setSelectedRegion('')
                  setSelectedConstituency('')
                  setSelectedChapter('')
                }}
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
                <option value="region">Region</option>
                <option value="chapter">Chapter</option>
              </select>
            </div>

            {scope === 'region' ? (
              <>
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
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value)
                      setSelectedConstituency('')
                    }}
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
                    <option value="">Select region</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRegion && constituenciesForRegion.length > 0 && (
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
                      Constituency{' '}
                      <span style={{ color: 'hsl(var(--on-surface-muted))', fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <select
                      value={selectedConstituency}
                      onChange={(e) => setSelectedConstituency(e.target.value)}
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
                      <option value="">Entire region</option>
                      {constituenciesForRegion.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
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
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
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
                  <option value="">Select chapter</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="req-amount"
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
                id="req-amount"
                name="req-amount"
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

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="req-description"
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
              id="req-description"
              name="req-description"
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              My Submitted Requests
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                id="my-requests-search"
                name="my-requests-search"
                type="text"
                placeholder="Search requests…"
                value={mySearch}
                onChange={(e) => setMySearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  outline: 'none',
                  width: 180,
                  boxSizing: 'border-box',
                }}
              />
              <SortToggle value={mySortOrder} onChange={setMySortOrder} />
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>Loading…</p>
          ) : sortedMyRequests.length === 0 ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
              {mySearch ? 'No matching requests found.' : 'No requests submitted yet.'}
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
                    {[
                      'Date',
                      'Type',
                      'Region / Chapter',
                      'Amount',
                      'Status',
                      'Approved By',
                      'Officer Comment',
                    ].map((h) => (
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
                  {sortedMyRequests.map((r) => {
                    const { date, time } = fmtDate(r.created_at)
                    const comment =
                      (r.status === 'Approved' || r.status === 'Rejected') && r.officer_comment
                        ? r.officer_comment
                        : '—'
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDetailRequest(r)}
                        style={{
                          borderBottom: '1px solid hsl(var(--border))',
                          verticalAlign: 'middle',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--container-low))'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = ''
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                          <span>{date}</span>
                          <br />
                          <span style={{ fontSize: 11, opacity: 0.7 }}>{time}</span>
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
                          {r.status !== 'Pending' && r.approver_name ? r.approver_name : '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            color: 'hsl(var(--on-surface-muted))',
                            maxWidth: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={comment !== '—' ? comment : undefined}
                        >
                          {comment}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Request Detail Modal ─────────────────────────────────── */}
      {detailRequest &&
        (() => {
          const r = detailRequest
          const { date, time } = fmtDate(r.created_at)
          const rows: { label: string; value: React.ReactNode }[] = [
            { label: 'Request Type', value: TYPE_LABELS[r.request_type] },
            { label: 'Category', value: r.category || '—' },
            { label: 'Region / Chapter', value: r.chapter || '—' },
            { label: 'Amount', value: fmtAmount(r.amount) },
            { label: 'Status', value: statusPill(r.status) },
            { label: 'Submitted', value: `${date} at ${time}` },
            {
              label: 'Approved By',
              value: r.status !== 'Pending' && r.approver_name ? r.approver_name : '—',
            },
            {
              label: 'Officer Comment',
              value:
                (r.status === 'Approved' || r.status === 'Rejected') && r.officer_comment
                  ? r.officer_comment
                  : '—',
            },
            { label: 'Description', value: r.description || '—' },
          ]
          return (
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
              onClick={() => setDetailRequest(null)}
            >
              <div
                style={{
                  background: 'hsl(var(--card))',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '80vh',
                  overflow: 'auto',
                  padding: 28,
                  margin: 16,
                  fontFamily: "'Public Sans', sans-serif",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Request Details
                  </h3>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDetailRequest(null)}
                    style={{ padding: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      close
                    </span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {rows.map((row) => (
                    <div key={row.label}>
                      <p
                        style={{
                          margin: '0 0 2px',
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {row.label}
                      </p>
                      <div style={{ fontSize: 14, color: 'hsl(var(--on-surface))' }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
