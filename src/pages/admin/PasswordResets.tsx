/**
 * Password Resets Page Component
 * -------------------------------------------------------------
 * Component for tracking and monitoring phone-based SMS OTP recovery attempts.
 * Renders audit charts, status-based search filters, and masked phone numbers.
 */

import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { PasswordRecoveryRequest, PasswordResetRecord } from '@/services/adminService'
import { toast } from 'sonner'

// Helper function to format ISO timestamps into British standard format
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to mask phone numbers to protect member privacy
function maskPhone(phone: string) {
  if (phone.length <= 6) return phone
  return phone.slice(0, 4) + '•••••' + phone.slice(-3)
}

// Helper function to resolve the current operational state of a password reset record
function getStatus(r: PasswordResetRecord): 'used' | 'expired' | 'pending' {
  if (r.used) return 'used'
  if (new Date(r.expires_at) < new Date()) return 'expired'
  return 'pending'
}

type StatusFilter = 'all' | 'pending' | 'used' | 'expired'

// Main component rendering password reset audit KPIs and records table
export default function PasswordResets() {
  const [records, setRecords] = useState<PasswordResetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [recoveryRequests, setRecoveryRequests] = useState<PasswordRecoveryRequest[]>([])
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  // Load OTP recovery records from administrative services
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, requests] = await Promise.all([
        adminService.getPasswordResets(),
        adminService.getPasswordRecoveryRequests(),
      ])
      setRecords(data)
      setRecoveryRequests(requests)
    } catch {
      // RLS may block non-admin users; fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  const reviewRecoveryRequest = async (
    request: PasswordRecoveryRequest,
    decision: 'approve' | 'reject'
  ) => {
    setReviewingId(request.id)
    try {
      const notes = reviewNotes[request.id] ?? ''
      if (decision === 'approve') {
        await adminService.approvePasswordRecoveryRequest(request.id, notes)
      } else {
        await adminService.rejectPasswordRecoveryRequest(request.id, notes)
      }
      toast.success(`Recovery request ${decision === 'approve' ? 'approved' : 'rejected'}.`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review recovery request.')
    } finally {
      setReviewingId(null)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const total = records.length
  const used = records.filter((r) => r.used).length
  const pending = records.filter((r) => getStatus(r) === 'pending').length
  const expired = records.filter((r) => getStatus(r) === 'expired').length

  const filtered = records.filter((r) => {
    const statusMatch = filter === 'all' || getStatus(r) === filter
    const searchMatch = !search || r.phone.includes(search.replace(/\s/g, ''))
    return statusMatch && searchMatch
  })

  const kpis = [
    { label: 'Total Requests', value: total, bar: 'hsl(var(--on-surface))' },
    { label: 'Completed', value: used, bar: 'hsl(var(--primary))' },
    { label: 'Pending', value: pending, bar: 'hsl(var(--accent))' },
    { label: 'Expired', value: expired, bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Password Reset Requests
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            SMS OTP recovery attempts, phone-based resets only
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* KPIs */}
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
              {loading ? '—' : kpi.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search by phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                boxSizing: 'border-box',
                fontFamily: "'Public Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'pending', 'used', 'expired'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={filter === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                display: 'block',
                marginBottom: 8,
                animation: 'spin 1s linear infinite',
              }}
            >
              progress_activity
            </span>
            Loading reset history…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, display: 'block', marginBottom: 8 }}
            >
              lock_open
            </span>
            No reset requests found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))' }}>
                  {['Phone Number', 'Requested', 'Expires', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'hsl(var(--on-surface-muted))',
                        borderBottom: '1px solid hsl(var(--border))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const status = getStatus(r)
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 16px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                          >
                            phone
                          </span>
                          {maskPhone(r.phone)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                        {formatDateTime(r.created_at)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color:
                            new Date(r.expires_at) < new Date()
                              ? 'hsl(var(--destructive))'
                              : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {formatDateTime(r.expires_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`pill ${status === 'used' ? 'pill-ok' : status === 'expired' ? 'pill-err' : 'pill-warn'}`}
                        >
                          {status === 'used'
                            ? 'Completed'
                            : status === 'expired'
                              ? 'Expired'
                              : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid hsl(var(--border))',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Showing {filtered.length} of {total} requests · Phone numbers are masked for privacy
          </div>
        )}
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Manual Recovery Queue
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Review fallback requests from members who could not use SMS recovery.
            </p>
          </div>
          <span className="pill pill-warn">
            {recoveryRequests.filter((r) => r.status === 'pending').length} pending
          </span>
        </div>
        {loading ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            Loading recovery requests…
          </div>
        ) : recoveryRequests.length === 0 ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            No manual recovery requests found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))' }}>
                  {['Full Name', 'Old Number', 'Submitted', 'Status', 'Review'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'hsl(var(--on-surface-muted))',
                        borderBottom: '1px solid hsl(var(--border))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recoveryRequests.map((request, i) => {
                  const pendingRequest = request.status === 'pending'
                  const busy = reviewingId === request.id
                  return (
                    <tr
                      key={request.id}
                      style={{
                        borderBottom:
                          i < recoveryRequests.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 16px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {request.full_name}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'hsl(var(--on-surface-muted))',
                          minWidth: 180,
                        }}
                      >
                        {maskPhone(request.old_phone)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(request.submitted_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`pill ${request.status === 'approved' ? 'pill-ok' : request.status === 'rejected' ? 'pill-err' : 'pill-warn'}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', minWidth: 250 }}>
                        {pendingRequest ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <textarea
                              aria-label={`Review notes for ${request.full_name}`}
                              placeholder="Optional notes"
                              value={reviewNotes[request.id] ?? ''}
                              onChange={(e) =>
                                setReviewNotes((current) => ({
                                  ...current,
                                  [request.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              disabled={busy}
                              style={{
                                width: 150,
                                resize: 'vertical',
                                padding: '6px 8px',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12,
                                color: 'hsl(var(--on-surface))',
                                background: 'hsl(var(--background))',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            />
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => reviewRecoveryRequest(request, 'approve')}
                                disabled={busy}
                              >
                                {busy ? '…' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => reviewRecoveryRequest(request, 'reject')}
                                disabled={busy}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                            {request.review_notes || 'Reviewed'}
                          </span>
                        )}
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
  )
}
