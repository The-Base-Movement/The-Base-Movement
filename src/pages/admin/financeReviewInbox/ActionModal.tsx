import { createPortal } from 'react-dom'
import Avatar from '@/pages/admin/financeReviewInbox/Avatar'
import type { ReviewModal } from '@/pages/admin/financeReviewInbox/types'

interface ActionModalProps {
  modal: ReviewModal
  actioning: boolean
  officerComment: string
  userTier: 1 | 2 | 3 | null
  tier1Max: number
  tier2Max: number
  onClose: () => void
  onCommentChange: (value: string) => void
  onConfirm: () => void
  fmtAmount: (n: number) => string
}

export default function ActionModal({
  modal,
  actioning,
  officerComment,
  userTier,
  tier1Max,
  tier2Max,
  onClose,
  onCommentChange,
  onConfirm,
  fmtAmount,
}: ActionModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 500,
          fontFamily: "'Public Sans', sans-serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(event) => event.stopPropagation()}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
          <Avatar
            url={modal.request.requester_avatar}
            name={modal.request.requester_name ?? 'Unknown'}
            size={28}
          />
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
            {modal.request.requester_name} · {fmtAmount(modal.request.amount)} ·{' '}
            {modal.request.chapter}
          </p>
        </div>

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
            {fmtAmount(userTier === 1 ? tier1Max : tier2Max)}). Acknowledging will pass it to the
            next approval tier.
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
              autoComplete="off"
              value={officerComment}
              onChange={(event) => onCommentChange(event.target.value)}
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
          <button className="btn btn-outline" onClick={onClose} disabled={actioning}>
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
            onClick={onConfirm}
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
    </div>,
    document.body
  )
}
