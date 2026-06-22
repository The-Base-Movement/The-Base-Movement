/**
 * RequestsQueue Component
 * -------------------------------------------------------------
 * Displays a list of pending asset allocation requests, providing action inputs
 * for reviewers to approve or deny requests with optional comments.
 */

import { useState } from 'react'
import type { AssetRequest } from './types'

interface Props {
  requests: AssetRequest[]
  reviewerId: string
  onApprove: (
    requestId: string,
    assetId: string,
    assignTo: string,
    returnDate: string | null,
    note: string,
    reviewerId: string
  ) => Promise<boolean>
  onDeny: (requestId: string, note: string, reviewerId: string) => Promise<boolean>
}

/**
 * RequestsQueue
 * -------------------------------------------------------------
 * Mounts queue list items and handles intermediate approval/denial
 * states, comment text inputs, and submission events.
 */
export function RequestsQueue({ requests, reviewerId, onApprove, onDeny }: Props) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'approve' | 'deny' | null>(null)

  function openAction(id: string, m: 'approve' | 'deny') {
    setActionId(id)
    setMode(m)
    setNote('')
  }

  async function handleConfirm() {
    if (!actionId || !mode) return
    const req = requests.find((r) => r.id === actionId)
    if (!req) return
    setSaving(true)
    if (mode === 'approve') {
      await onApprove(
        req.id,
        req.asset_id,
        req.requested_by,
        req.expected_return_date,
        note,
        reviewerId
      )
    } else {
      await onDeny(req.id, note, reviewerId)
    }
    setSaving(false)
    setActionId(null)
    setMode(null)
  }

  if (!requests.length) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No pending requests.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {requests.map((req) => (
        <div
          key={req.id}
          className="panel"
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 2px',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {req.asset_name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                Requested by <strong>{req.requester_name}</strong> ·{' '}
                {new Date(req.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            {actionId !== req.id && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openAction(req.id, 'approve')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-outline-dest btn-sm"
                  onClick={() => openAction(req.id, 'deny')}
                >
                  Deny
                </button>
              </div>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontStyle: 'italic',
            }}
          >
            "{req.reason}"
          </p>
          {req.expected_return_date && (
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Return by:{' '}
              {new Date(req.expected_return_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
          {actionId === req.id && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <label htmlFor={`asset-request-review-note-${req.id}`} style={{ display: 'none' }}>
                Review note
              </label>
              <textarea
                id={`asset-request-review-note-${req.id}`}
                name="assetRequestReviewNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  mode === 'approve'
                    ? 'Optional note to requester…'
                    : 'Reason for denial (recommended)…'
                }
                rows={2}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setActionId(null)
                    setMode(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  className={mode === 'approve' ? 'btn btn-primary btn-sm' : 'btn btn-dest btn-sm'}
                  disabled={saving}
                  onClick={handleConfirm}
                >
                  {saving ? 'Saving…' : mode === 'approve' ? 'Confirm Approve' : 'Confirm Deny'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
