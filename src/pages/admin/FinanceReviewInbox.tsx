import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { financeService, type FinanceRequest } from '@/services/financeService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { toast } from 'sonner'
import {
  processFundRequest,
  tierNameFromNumber,
  isPermitted,
  isPassUp,
  type ApprovalAction,
} from '@/lib/fundApproval'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const TYPE_LABELS: Record<FinanceRequest['request_type'], string> = {
  BudgetAllocation: 'Budget Allocation',
  ExpenseReimbursement: 'Expense Reimbursement',
  InventoryReplenishment: 'Inventory Replenishment',
}

function statusPill(status: FinanceRequest['status']) {
  if (status === 'Approved') return <span className="pill pill-ok">Approved</span>
  if (status === 'Rejected') return <span className="pill pill-err">Rejected</span>
  return <span className="pill pill-warn">Pending</span>
}

type ActingTier = 1 | 2 | 3

function getActingTier(role: string | undefined): ActingTier | null {
  if (role === 'FINANCE_OFFICER') return 1
  if (role === 'EXECUTIVE' || role === 'ORGANIZER') return 2
  if (role === 'SUPER_ADMIN' || role === 'FOUNDER' || role === 'ADMIN') return 3
  return null
}

function canActOn(request: FinanceRequest, userTier: ActingTier): boolean {
  return request.approval_tier === userTier
}

/** Resolve which button set to show using the approval engine */
function resolveMode(
  request: FinanceRequest,
  userTier: ActingTier,
  tier1Max: number,
  tier2Max: number
): 'approve_deny' | 'acknowledge' {
  const tier = tierNameFromNumber(userTier)
  // Probe with 'Approve' — if not permitted or needs pass-up, show Acknowledge
  const probe = processFundRequest(tier, request.amount, 'Approve', tier1Max, tier2Max)
  if (isPassUp(probe.outcome)) return 'acknowledge'
  if (!isPermitted(probe.outcome)) return 'acknowledge'
  return 'approve_deny'
}

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

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

// ─── Approval Chain Tracker ───────────────────────────────────────────────────

interface ChainTrackerProps {
  request: FinanceRequest
  tier1Max: number
  tier2Max: number
}

function ApprovalChainTracker({ request, tier1Max, tier2Max }: ChainTrackerProps) {
  const activeTier = request.status === 'Pending' ? request.approval_tier : null
  const resolvedAtTier = request.status !== 'Pending' ? request.approval_tier : null

  const tierDefs = [
    {
      n: 1,
      role: 'Finance Officer',
      icon: 'account_balance_wallet',
      range: `GHS 0 – ${tier1Max.toLocaleString()}`,
    },
    {
      n: 2,
      role: 'Executives',
      icon: 'corporate_fare',
      range: `GHS ${(tier1Max + 1).toLocaleString()} – ${tier2Max.toLocaleString()}`,
    },
    {
      n: 3,
      role: 'Founder / Appointed',
      icon: 'shield',
      range: `GHS ${(tier2Max + 1).toLocaleString()}+`,
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginTop: 16,
        padding: '14px 16px',
        background: 'hsl(var(--container-low))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {tierDefs.map((tier, i) => {
        const isActive = activeTier === tier.n
        const isResolved = resolvedAtTier === tier.n
        const isPast =
          (activeTier != null && tier.n < activeTier) ||
          (resolvedAtTier != null && tier.n < resolvedAtTier)
        const isFuture = activeTier != null && tier.n > activeTier

        let nodeColor = 'hsl(var(--border))'
        let textColor = 'hsl(var(--on-surface-muted))'
        let iconName = tier.icon

        if (isActive) {
          nodeColor = 'hsl(var(--primary))'
          textColor = 'hsl(var(--on-surface))'
        } else if (isPast) {
          nodeColor = 'hsl(var(--primary))'
          iconName = 'check_circle'
          textColor = 'hsl(var(--on-surface-muted))'
        } else if (isResolved) {
          nodeColor =
            request.status === 'Approved' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'
          iconName = request.status === 'Approved' ? 'check_circle' : 'cancel'
          textColor = 'hsl(var(--on-surface))'
        } else if (isFuture) {
          nodeColor = 'hsl(var(--border))'
          textColor = 'hsl(var(--on-surface-muted))'
        }

        return (
          <div key={tier.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Node */}
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    isActive || isResolved || isPast ? nodeColor : 'hsl(var(--container-low))',
                  border: `2px solid ${nodeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 0 4px ${nodeColor}22` : 'none',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color: isActive || isResolved || isPast ? '#fff' : nodeColor,
                  }}
                >
                  {iconName}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: isActive
                    ? 'var(--font-weight-medium, 500)'
                    : 'var(--font-weight-normal, 400)',
                  fontSize: 10,
                  color: textColor,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {tier.role}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 9,
                  color: 'hsl(var(--on-surface-muted))',
                  textAlign: 'center',
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                {tier.range}
              </p>
              {isActive && (
                <span
                  style={{
                    marginTop: 4,
                    fontSize: 8,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'hsl(var(--primary))',
                    background: 'hsl(var(--primary) / 0.1)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Awaiting
                </span>
              )}
            </div>

            {/* Connector line (not after last node) */}
            {i < tierDefs.length - 1 && (
              <div
                style={{
                  height: 2,
                  width: 32,
                  flexShrink: 0,
                  background: isPast || isResolved ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  marginBottom: 28,
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal types ──────────────────────────────────────────────────────────────

type ModalAction = 'Approved' | 'Rejected' | 'Acknowledged'

interface ReviewModal {
  request: FinanceRequest
  action: ModalAction
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceReviewInbox() {
  const [currentUser] = useState(adminService.getCurrentUser())
  const userTier = getActingTier(currentUser?.role)
  const canSeeInbox = userTier !== null

  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tier1Max, setTier1Max] = useState(50)
  const [tier2Max, setTier2Max] = useState(100)

  const [modal, setModal] = useState<ReviewModal | null>(null)
  const [officerComment, setOfficerComment] = useState('')
  const [actioning, setActioning] = useState(false)

  async function loadAll() {
    try {
      const [data, settings] = await Promise.all([
        financeService.getRequests(),
        adminService.getSiteSettings(),
      ])
      setRequests(data)
      const t1 = parseFloat(String(settings['finance_tier1_max'] ?? '50'))
      const t2 = parseFloat(String(settings['finance_tier2_max'] ?? '100'))
      if (!isNaN(t1)) setTier1Max(t1)
      if (!isNaN(t2)) setTier2Max(t2)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  function openModal(request: FinanceRequest, action: ModalAction) {
    setOfficerComment('')
    setModal({ request, action })
  }

  async function handleAction() {
    if (!modal || !userTier) return
    if (modal.action !== 'Acknowledged' && !officerComment.trim()) {
      toast.error('A comment is required')
      return
    }

    // Run the approval engine before touching the DB
    const engineAction: ApprovalAction =
      modal.action === 'Acknowledged'
        ? 'Acknowledge'
        : modal.action === 'Approved'
          ? 'Approve'
          : 'Deny'
    const result = processFundRequest(
      tierNameFromNumber(userTier),
      modal.request.amount,
      engineAction,
      tier1Max,
      tier2Max
    )

    if (!isPermitted(result.outcome)) {
      toast.error(result.message)
      return
    }

    setActioning(true)
    try {
      if (isPassUp(result.outcome)) {
        await financeService.acknowledgeRequest(modal.request.id)
        toast.success(result.message) // "Pass to the next level"
      } else {
        await financeService.reviewRequest(
          modal.request.id,
          modal.action as 'Approved' | 'Rejected',
          officerComment.trim()
        )
        toast.success(result.message) // "Processed at … tier"
      }
      setModal(null)
      await loadAll()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('no longer available')) {
        toast.warning('This request is no longer available for review')
        setModal(null)
        await loadAll()
      } else {
        toast.error('Failed to process request')
      }
    } finally {
      setActioning(false)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'Pending')
  const resolvedRequests = requests.filter(
    (r) => r.status === 'Approved' || r.status === 'Rejected'
  )

  // Only show requests that are at the current user's tier
  const myTierPending = userTier ? pendingRequests.filter((r) => canActOn(r, userTier)) : []

  // Requests at other tiers (pending but not mine to act on now)
  const otherTierPending = pendingRequests.filter((r) => !userTier || !canActOn(r, userTier))

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <AdminPageHeader
        title="Review Inbox"
        icon="inbox"
        description="Approve, reject, or pass up pending finance requests through the approval chain."
      />

      <FinanceSubNav pendingCount={pendingRequests.length} />

      {/* Access guard */}
      {!canSeeInbox && (
        <div
          className="panel"
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }}
          >
            lock
          </span>
          <p style={{ margin: 0, fontSize: 14 }}>
            You do not have permission to review finance requests.
          </p>
        </div>
      )}

      {canSeeInbox && (
        <>
          {/* KPI strip */}
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
            {[
              { label: 'Pending', value: pendingRequests.length, bar: 'hsl(var(--accent))' },
              {
                label: 'Approved',
                value: requests.filter((r) => r.status === 'Approved').length,
                bar: 'hsl(var(--primary))',
              },
              {
                label: 'Rejected',
                value: requests.filter((r) => r.status === 'Rejected').length,
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
                  {loading ? '—' : kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* My tier — actionable requests */}
          {!loading && pendingRequests.length > 0 && (
            <div className="panel" style={{ marginBottom: 24 }}>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--accent))' }}
                >
                  pending_actions
                </span>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Awaiting Your Decision
                </p>
                {myTierPending.length > 0 && (
                  <span className="pill pill-warn" style={{ marginLeft: 'auto' }}>
                    {myTierPending.length} pending
                  </span>
                )}
              </div>

              <div style={{ padding: 20 }}>
                {myTierPending.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.25 }}
                    >
                      inbox
                    </span>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      No requests waiting for your tier right now.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {myTierPending.map((r) => {
                      const mode = resolveMode(r, userTier!, tier1Max, tier2Max)
                      return (
                        <div
                          key={r.id}
                          style={{
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Request header */}
                          <div
                            style={{
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
                                {TYPE_LABELS[r.request_type]} · {r.chapter} ·{' '}
                                <strong style={{ color: 'hsl(var(--on-surface))' }}>
                                  {fmtAmount(r.amount)}
                                </strong>
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
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                Submitted {fmtDate(r.created_at)}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                flexShrink: 0,
                                flexWrap: 'wrap',
                              }}
                            >
                              {mode === 'approve_deny' ? (
                                <>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openModal(r, 'Approved')}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: 13 }}
                                    >
                                      check
                                    </span>
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-outline-dest btn-sm"
                                    onClick={() => openModal(r, 'Rejected')}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: 13 }}
                                    >
                                      close
                                    </span>
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="btn btn-accent btn-sm"
                                  onClick={() => openModal(r, 'Acknowledged')}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 13 }}
                                  >
                                    arrow_upward
                                  </span>
                                  Acknowledge & Pass Up
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Chain tracker */}
                          <div style={{ padding: '12px 20px 16px' }}>
                            <ApprovalChainTracker
                              request={r}
                              tier1Max={tier1Max}
                              tier2Max={tier2Max}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requests at other tiers — visible but not actionable */}
          {!loading && otherTierPending.length > 0 && (
            <div className="panel" style={{ marginBottom: 24 }}>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  hourglass_top
                </span>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  In Progress — Other Tiers
                </p>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {otherTierPending.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      opacity: 0.75,
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 18px',
                        background: 'hsl(var(--container-low))',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 2px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {r.requester_name ?? 'Unknown'} ·{' '}
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                          {TYPE_LABELS[r.request_type]}
                        </span>{' '}
                        · {fmtAmount(r.amount)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {r.description} · Submitted {fmtDate(r.created_at)}
                      </p>
                    </div>
                    <div style={{ padding: '10px 18px 14px' }}>
                      <ApprovalChainTracker request={r} tier1Max={tier1Max} tier2Max={tier2Max} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state (no pending at all) */}
          {!loading && pendingRequests.length === 0 && (
            <div
              className="panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 44, display: 'block', marginBottom: 10, opacity: 0.2 }}
              >
                inbox
              </span>
              <p style={{ margin: 0, fontSize: 14 }}>No pending requests to review.</p>
            </div>
          )}

          {/* Resolved history */}
          {!loading && resolvedRequests.length > 0 && (
            <div className="panel">
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  history
                </span>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Resolved
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background: 'hsl(var(--container-low))',
                        borderBottom: '1px solid hsl(var(--border))',
                      }}
                    >
                      {[
                        'Requester',
                        'Type',
                        'Chapter',
                        'Amount',
                        'Status',
                        'Resolved At Tier',
                        'Reviewed',
                        'Comment',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontSize: 10,
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
                    {resolvedRequests.map((r) => (
                      <tr
                        key={r.id}
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.requester_name ?? 'Unknown'}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            color: 'hsl(var(--on-surface-muted))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {TYPE_LABELS[r.request_type]}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                          {r.chapter}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fmtAmount(r.amount)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>{statusPill(r.status)}</td>
                        <td style={{ padding: '10px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                          Tier {r.approval_tier}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            color: 'hsl(var(--on-surface-muted))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.reviewed_at ? fmtDate(r.reviewed_at) : '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            color: 'hsl(var(--on-surface-muted))',
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.officer_comment ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action modal */}
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
              maxWidth: 500,
              fontFamily: "'Public Sans', sans-serif",
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 17,
                fontWeight: 'var(--font-weight-medium, 500)',
                color:
                  modal.action === 'Approved'
                    ? 'hsl(var(--primary))'
                    : modal.action === 'Rejected'
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--accent))',
              }}
            >
              {modal.action === 'Approved'
                ? 'Approve Request'
                : modal.action === 'Rejected'
                  ? 'Reject Request'
                  : 'Acknowledge & Pass Up'}
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '0 0 16px' }}>
              {modal.request.requester_name} · {fmtAmount(modal.request.amount)} ·{' '}
              {modal.request.chapter}
            </p>

            {modal.action === 'Acknowledged' ? (
              <div
                style={{
                  background: 'hsl(var(--accent) / 0.08)',
                  border: '1px solid hsl(var(--accent) / 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--accent))', flexShrink: 0, marginTop: 1 }}
                >
                  info
                </span>
                This request exceeds your tier's ceiling (
                {fmtAmount(userTier === 1 ? tier1Max : tier2Max)}). Acknowledging will pass it to
                the next approval tier.
              </div>
            ) : (
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
            )}

            {modal.action !== 'Acknowledged' && (
              <>
                <label
                  htmlFor="officer-comment"
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
                  id="officer-comment"
                  name="officer-comment"
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
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
                disabled={actioning}
              >
                Cancel
              </button>
              <button
                className={
                  modal.action === 'Approved'
                    ? 'btn btn-primary'
                    : modal.action === 'Rejected'
                      ? 'btn btn-dest'
                      : 'btn btn-accent'
                }
                onClick={handleAction}
                disabled={actioning || (modal.action !== 'Acknowledged' && !officerComment.trim())}
              >
                {actioning
                  ? 'Processing…'
                  : modal.action === 'Approved'
                    ? 'Confirm Approve'
                    : modal.action === 'Rejected'
                      ? 'Confirm Reject'
                      : 'Confirm Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
