import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
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
import FinanceSubNav from '@/pages/admin/financeReviewInbox/FinanceSubNav'
import Avatar from '@/pages/admin/financeReviewInbox/Avatar'
import ApprovalChainTracker from '@/pages/admin/financeReviewInbox/ApprovalChainTracker'
import ActionModal from '@/pages/admin/financeReviewInbox/ActionModal'
import KpiSummary from '@/pages/admin/financeReviewInbox/KpiSummary'
import type { ModalAction, ReviewModal, TierLeader } from '@/pages/admin/financeReviewInbox/types'

function fmtDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
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

function resolveMode(
  request: FinanceRequest,
  userTier: ActingTier,
  tier1Max: number,
  tier2Max: number
): 'approve_deny' | 'acknowledge' {
  const tier = tierNameFromNumber(userTier)
  const probe = processFundRequest(tier, request.amount, 'Approve', tier1Max, tier2Max)
  if (isPassUp(probe.outcome)) return 'acknowledge'
  if (!isPermitted(probe.outcome)) return 'acknowledge'
  return 'approve_deny'
}

export default function FinanceReviewInbox() {
  const [currentUser] = useState(adminService.getCurrentUser())
  const userTier = getActingTier(currentUser?.role)
  const canSeeInbox = userTier !== null

  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [tierLeaders, setTierLeaders] = useState<TierLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [tier1Max, setTier1Max] = useState(50)
  const [tier2Max, setTier2Max] = useState(100)

  const [modal, setModal] = useState<ReviewModal | null>(null)
  const [officerComment, setOfficerComment] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [actioning, setActioning] = useState(false)

  const [detailRequest, setDetailRequest] = useState<FinanceRequest | null>(null)
  const [resolvedSearch, setResolvedSearch] = useState('')
  const [resolvedStatusFilter, setResolvedStatusFilter] = useState<'all' | 'Approved' | 'Rejected'>(
    'all'
  )

  async function loadAll() {
    try {
      const [data, settings, tierData, mfaFactors] = await Promise.all([
        financeService.getRequests(),
        adminService.getSiteSettings(),
        financeService.getFinanceTierLeaders(),
        authService.listMfaFactors(),
      ])

      setRequests(data)
      const totp = mfaFactors?.totp?.find((f) => f.status === 'verified')
      if (totp) {
        setFactorId(totp.id)
      }

      const t1 = parseFloat(String(settings['finance_tier1_max'] ?? '50'))
      const t2 = parseFloat(String(settings['finance_tier2_max'] ?? '100'))
      if (!isNaN(t1)) setTier1Max(t1)
      if (!isNaN(t2)) setTier2Max(t2)

      if (tierData.admins.length) {
        setTierLeaders(
          tierData.admins.map((admin) => {
            const profile = tierData.profiles[admin.id]
            const tier: 1 | 2 | 3 =
              admin.role === 'FINANCE_OFFICER'
                ? 1
                : admin.role === 'EXECUTIVE' || admin.role === 'ORGANIZER'
                  ? 2
                  : 3
            return {
              id: admin.id,
              name: profile?.full_name ?? 'Unknown',
              avatarUrl: profile?.avatar_url ?? null,
              tier,
            }
          })
        )
      }
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll()
  }, [])

  function openModal(request: FinanceRequest, action: ModalAction) {
    setOfficerComment('')
    setMfaCode('')
    setModal({ request, action })
  }

  async function handleAction() {
    if (!modal || !userTier) return
    if (!factorId) {
      toast.error('You must enroll an Authenticator App (2FA) to verify this action.')
      return
    }
    if (modal.action !== 'Acknowledged' && !officerComment.trim()) {
      toast.error('A comment is required')
      return
    }
    if (mfaCode.trim().length < 6) {
      toast.error('Please enter a 6-digit verification code.')
      return
    }

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
        await financeService.acknowledgeRequest(modal.request.id, factorId, mfaCode.trim())
        toast.success(result.message)
      } else {
        await financeService.reviewRequest(
          modal.request.id,
          modal.action as 'Approved' | 'Rejected',
          officerComment.trim(),
          factorId,
          mfaCode.trim()
        )
        toast.success(result.message)
      }
      setModal(null)
      await loadAll()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.toLowerCase().includes('no longer available')) {
        toast.warning('This request is no longer available for review')
        setModal(null)
        await loadAll()
      } else if (msg.toLowerCase().includes('mfa') || msg.toLowerCase().includes('code')) {
        toast.error(msg)
      } else {
        toast.error('Failed to process request')
      }
    } finally {
      setActioning(false)
    }
  }

  const pendingRequests = requests.filter((request) => request.status === 'Pending')
  const resolvedRequests = requests.filter(
    (request) => request.status === 'Approved' || request.status === 'Rejected'
  )
  const myTierPending = userTier
    ? pendingRequests.filter((request) => canActOn(request, userTier))
    : []
  const otherTierPending = pendingRequests.filter(
    (request) => !userTier || !canActOn(request, userTier)
  )

  const filteredResolved = useMemo(() => {
    let list = resolvedRequests
    if (resolvedStatusFilter !== 'all') {
      list = list.filter((r) => r.status === resolvedStatusFilter)
    }
    if (resolvedSearch.trim()) {
      const q = resolvedSearch.toLowerCase()
      list = list.filter(
        (r) =>
          (r.requester_name ?? '').toLowerCase().includes(q) ||
          (r.chapter ?? '').toLowerCase().includes(q) ||
          TYPE_LABELS[r.request_type].toLowerCase().includes(q) ||
          (r.officer_comment ?? '').toLowerCase().includes(q) ||
          (r.approver_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [resolvedRequests, resolvedStatusFilter, resolvedSearch])

  function exportCsv() {
    const headers = [
      'Requester',
      'Type',
      'Region / Diaspora',
      'Amount',
      'Status',
      'Resolved At Tier',
      'Approved By',
      'Reviewed',
      'Comment',
      'Description',
    ]
    const rows = filteredResolved.map((r) => {
      const reviewed = r.reviewed_at ? fmtDate(r.reviewed_at) : null
      return [
        r.requester_name ?? '',
        TYPE_LABELS[r.request_type],
        r.chapter ?? '',
        r.amount.toFixed(2),
        r.status,
        `Tier ${r.approval_tier}`,
        r.approver_name ?? '',
        reviewed ? `${reviewed.date} ${reviewed.time}` : '',
        r.officer_comment ?? '',
        r.description ?? '',
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-resolved-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <AdminPageHeader
        title="Review Inbox"
        icon="inbox"
        description="Approve, reject, or pass up pending finance requests through the approval chain."
      />

      <FinanceSubNav pendingCount={pendingRequests.length} />

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
          <KpiSummary
            items={[
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
            ]}
          />

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
                    {myTierPending.map((request) => {
                      const mode = resolveMode(request, userTier!, tier1Max, tier2Max)
                      return (
                        <div
                          key={request.id}
                          style={{
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                          }}
                        >
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
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 4,
                                }}
                              >
                                <Avatar
                                  url={request.requester_avatar}
                                  name={request.requester_name ?? 'Unknown'}
                                  size={30}
                                />
                                <p
                                  style={{
                                    margin: 0,
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 14,
                                    color: 'hsl(var(--on-surface))',
                                  }}
                                >
                                  {request.requester_name ?? 'Unknown'}
                                </p>
                              </div>
                              <p
                                style={{
                                  margin: '0 0 2px',
                                  fontSize: 13,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {TYPE_LABELS[request.request_type]} · {request.chapter} ·{' '}
                                <strong style={{ color: 'hsl(var(--on-surface))' }}>
                                  {fmtAmount(request.amount)}
                                </strong>
                              </p>
                              <p
                                style={{
                                  margin: '0 0 2px',
                                  fontSize: 13,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {request.description}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                Submitted {fmtDate(request.created_at).date} at{' '}
                                {fmtDate(request.created_at).time}
                              </p>
                            </div>

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
                                    onClick={() => openModal(request, 'Approved')}
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
                                    onClick={() => openModal(request, 'Rejected')}
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
                                  onClick={() => openModal(request, 'Acknowledged')}
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

                          <div style={{ padding: '12px 20px 16px' }}>
                            <ApprovalChainTracker
                              request={request}
                              tier1Max={tier1Max}
                              tier2Max={tier2Max}
                              tierLeaders={tierLeaders}
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
                {otherTierPending.map((request) => (
                  <div
                    key={request.id}
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
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <Avatar
                          url={request.requester_avatar}
                          name={request.requester_name ?? 'Unknown'}
                          size={26}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {request.requester_name ?? 'Unknown'}
                        </p>
                      </div>
                      <p
                        style={{
                          margin: '0 0 2px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                          {TYPE_LABELS[request.request_type]}
                        </span>{' '}
                        · {fmtAmount(request.amount)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {request.description} · Submitted {fmtDate(request.created_at).date}
                      </p>
                    </div>
                    <div style={{ padding: '10px 18px 14px' }}>
                      <ApprovalChainTracker
                        request={request}
                        tier1Max={tier1Max}
                        tier2Max={tier2Max}
                        tierLeaders={tierLeaders}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && pendingRequests.length === 0 && (
            <div
              className="panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 24,
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
                  flexWrap: 'wrap',
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

                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search…"
                    value={resolvedSearch}
                    onChange={(e) => setResolvedSearch(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontFamily: "'Public Sans', sans-serif",
                      color: 'hsl(var(--on-surface))',
                      background: 'hsl(var(--background))',
                      outline: 'none',
                      width: 160,
                      boxSizing: 'border-box',
                    }}
                  />
                  <select
                    value={resolvedStatusFilter}
                    onChange={(e) =>
                      setResolvedStatusFilter(e.target.value as 'all' | 'Approved' | 'Rejected')
                    }
                    style={{
                      padding: '6px 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontFamily: "'Public Sans', sans-serif",
                      color: 'hsl(var(--on-surface))',
                      background: 'hsl(var(--background))',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="all">All statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={exportCsv}
                    title="Export to CSV"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      download
                    </span>
                    Export
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr
                        style={{
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        {[
                          'Requester',
                          'Type',
                          'Region / Diaspora',
                          'Amount',
                          'Status',
                          'Resolved At Tier',
                          'Approved By',
                          'Reviewed',
                          'Comment',
                        ].map((header) => (
                          <th
                            key={header}
                            style={{
                              padding: '8px 16px',
                              textAlign: 'left',
                              fontSize: 10,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'hsl(var(--on-surface-muted))',
                              whiteSpace: 'nowrap',
                              background: 'hsl(var(--container-low))',
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResolved.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              padding: '32px 16px',
                              textAlign: 'center',
                              color: 'hsl(var(--on-surface-muted))',
                              fontSize: 13,
                            }}
                          >
                            No matching resolved requests.
                          </td>
                        </tr>
                      ) : (
                        filteredResolved.map((request) => {
                          const reviewed = request.reviewed_at ? fmtDate(request.reviewed_at) : null
                          const comment = request.officer_comment ?? '—'
                          return (
                            <tr
                              key={request.id}
                              onClick={() => setDetailRequest(request)}
                              style={{
                                borderBottom: '1px solid hsl(var(--border))',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(event) =>
                                (event.currentTarget.style.background = 'hsl(var(--container-low))')
                              }
                              onMouseLeave={(event) => (event.currentTarget.style.background = '')}
                            >
                              <td
                                style={{
                                  padding: '10px 16px',
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  color: 'hsl(var(--on-surface))',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Avatar
                                    url={request.requester_avatar}
                                    name={request.requester_name ?? 'Unknown'}
                                    size={24}
                                  />
                                  {request.requester_name ?? 'Unknown'}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface-muted))',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {TYPE_LABELS[request.request_type]}
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {request.chapter}
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface))',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {fmtAmount(request.amount)}
                              </td>
                              <td style={{ padding: '10px 16px' }}>{statusPill(request.status)}</td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                Tier {request.approval_tier}
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface-muted))',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {request.approver_name ?? '—'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
                                  color: 'hsl(var(--on-surface-muted))',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {reviewed ? (
                                  <>
                                    <span>{reviewed.date}</span>
                                    <br />
                                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                                      {reviewed.time}
                                    </span>
                                  </>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td
                                style={{
                                  padding: '10px 16px',
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {detailRequest &&
        (() => {
          const r = detailRequest
          const reviewed = r.reviewed_at ? fmtDate(r.reviewed_at) : null
          const submitted = fmtDate(r.created_at)
          const rows: { label: string; value: React.ReactNode }[] = [
            {
              label: 'Requester',
              value: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar url={r.requester_avatar} name={r.requester_name ?? 'Unknown'} size={24} />
                  {r.requester_name ?? 'Unknown'}
                </div>
              ),
            },
            { label: 'Request Type', value: TYPE_LABELS[r.request_type] },
            { label: 'Category', value: r.category || '—' },
            { label: 'Region / Diaspora', value: r.chapter || '—' },
            { label: 'Amount', value: fmtAmount(r.amount) },
            { label: 'Status', value: statusPill(r.status) },
            { label: 'Resolved At Tier', value: `Tier ${r.approval_tier}` },
            { label: 'Submitted', value: `${submitted.date} at ${submitted.time}` },
            { label: 'Approved By', value: r.approver_name ?? '—' },
            { label: 'Reviewed', value: reviewed ? `${reviewed.date} at ${reviewed.time}` : '—' },
            { label: 'Officer Comment', value: r.officer_comment || '—' },
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
                  maxWidth: 540,
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

      {modal && (
        <ActionModal
          modal={modal}
          actioning={actioning}
          officerComment={officerComment}
          mfaCode={mfaCode}
          userTier={userTier}
          tier1Max={tier1Max}
          tier2Max={tier2Max}
          onClose={() => setModal(null)}
          onCommentChange={setOfficerComment}
          onMfaCodeChange={setMfaCode}
          onConfirm={handleAction}
          fmtAmount={fmtAmount}
        />
      )}
    </div>
  )
}
