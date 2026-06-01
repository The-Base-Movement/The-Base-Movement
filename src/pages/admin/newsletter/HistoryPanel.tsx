import { useState } from 'react'
import type { Newsletter } from '@/services/newsletterService'
import { buildAudienceLabel, buildAudienceFiltersLabel } from '@/services/newsletterService'

interface HistoryPanelProps {
  newsletters: Newsletter[]
  isLoading: boolean
  canDelete: boolean
  onDelete: (ids: string[]) => Promise<void>
  onResend: (newsletter: Newsletter) => void
  onDuplicate: (newsletter: Newsletter) => void
  onCancel: (id: string) => Promise<void>
}

function audienceLabel(n: Newsletter): string {
  if (n.audience_filters && n.audience_filters.length > 0) {
    return buildAudienceFiltersLabel(n.audience_filters)
  }
  return buildAudienceLabel(n.audience_type, n.audience_value)
}

export function HistoryPanel({
  newsletters,
  isLoading,
  canDelete,
  onDelete,
  onResend,
  onDuplicate,
  onCancel,
}: HistoryPanelProps) {
  const [search, setSearch] = useState('')
  const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filtered = newsletters.filter((n) => n.subject.toLowerCase().includes(search.toLowerCase()))
  const failedInView = filtered.filter((n) => n.status === 'failed')
  const allFailedSelected = failedInView.length > 0 && failedInView.every((n) => selected.has(n.id))

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAllFailed() {
    if (allFailedSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        failedInView.forEach((n) => next.delete(n.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        failedInView.forEach((n) => next.add(n.id))
        return next
      })
    }
  }

  async function handleDeleteConfirmed() {
    setIsDeleting(true)
    try {
      await onDelete(Array.from(selected))
      setSelected(new Set())
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const showCheckboxes = canDelete && failedInView.length > 0
  const selectedCount = selected.size

  return (
    <>
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div className="ph" style={{ marginBottom: 14 }}>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Send history
            </p>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '2px 0 0',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {newsletters.filter((n) => n.status === 'sent').length} sent
              {newsletters.some((n) => n.status === 'scheduled') &&
                ` · ${newsletters.filter((n) => n.status === 'scheduled').length} scheduled`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {canDelete && selectedCount > 0 && (
              <button
                className="btn btn-outline-dest btn-sm"
                onClick={() => setConfirmDelete(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  delete
                </span>
                Delete {selectedCount} selected
              </button>
            )}
            <input
              type="text"
              placeholder="Search by subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                outline: 'none',
                width: 200,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              padding: '20px 0',
            }}
          >
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              padding: '20px 0',
            }}
          >
            {search ? 'No newsletters match your search.' : 'No newsletters sent yet.'}
          </p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {showCheckboxes && (
                  <th style={{ padding: '6px 8px', width: 32 }}>
                    <input
                      type="checkbox"
                      checked={allFailedSelected}
                      onChange={toggleAllFailed}
                      title="Select all failed"
                      style={{ cursor: 'pointer', accentColor: 'hsl(var(--destructive))' }}
                    />
                  </th>
                )}
                {['Date', 'Subject', 'Audience', 'Recipients', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '6px 8px',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => {
                const isSelected = selected.has(n.id)
                const isSelectable = canDelete && n.status === 'failed'
                return (
                  <tr
                    key={n.id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      background: isSelected ? 'rgba(239,68,68,0.04)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = 'hsl(var(--container-low))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected
                        ? 'rgba(239,68,68,0.04)'
                        : 'transparent'
                    }}
                  >
                    {showCheckboxes && (
                      <td
                        style={{ padding: '10px 8px', width: 32 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSelectable) toggleRow(n.id)
                        }}
                      >
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(n.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: 'hsl(var(--destructive))' }}
                          />
                        )}
                      </td>
                    )}
                    <td
                      style={{
                        padding: '10px 8px',
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPreviewNewsletter(n)}
                    >
                      {n.status === 'scheduled' && n.scheduled_at ? (
                        <span style={{ color: 'hsl(var(--accent))' }}>
                          {new Date(n.scheduled_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : n.sent_at ? (
                        new Date(n.sent_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        color: 'hsl(var(--on-surface))',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPreviewNewsletter(n)}
                    >
                      {n.subject}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        color: 'hsl(var(--on-surface-muted))',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPreviewNewsletter(n)}
                    >
                      {audienceLabel(n)}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        color: 'hsl(var(--on-surface))',
                        textAlign: 'right',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPreviewNewsletter(n)}
                    >
                      <span>{n.recipient_count.toLocaleString()}</span>
                      {n.delivered_count > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 2,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          <span style={{ color: 'hsl(var(--primary))' }}>
                            ✓{n.delivered_count.toLocaleString()}
                          </span>
                          {n.bounce_count > 0 && (
                            <span style={{ color: 'hsl(var(--destructive))', marginLeft: 5 }}>
                              ✕{n.bounce_count.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td
                      style={{ padding: '10px 8px', cursor: 'pointer' }}
                      onClick={() => setPreviewNewsletter(n)}
                    >
                      <span
                        className={
                          n.status === 'sent'
                            ? 'pill pill-ok'
                            : n.status === 'scheduled'
                              ? 'pill pill-warn'
                              : 'pill pill-err'
                        }
                      >
                        {n.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      {n.status === 'failed' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onResend(n)
                          }}
                          title="Resend"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            refresh
                          </span>
                          Resend
                        </button>
                      ) : n.status === 'scheduled' ? (
                        <button
                          className="btn btn-outline-dest btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            void onCancel(n.id)
                          }}
                          title="Cancel scheduled send"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            cancel
                          </span>
                          Cancel
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicate(n)
                          }}
                          title="Duplicate & send again"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            content_copy
                          </span>
                          Duplicate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
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
          onClick={() => !isDeleting && setConfirmDelete(false)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: 380,
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Delete {selectedCount} failed record{selectedCount !== 1 ? 's' : ''}?
            </p>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                lineHeight: 1.6,
              }}
            >
              This permanently removes the selected failed newsletter
              {selectedCount !== 1 ? 's' : ''} from history. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-dest btn-sm"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen email preview */}
      {previewNewsletter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            background: '#e8e8e8',
          }}
        >
          {/* Preview header bar */}
          <div
            style={{
              background: 'hsl(var(--background))',
              borderBottom: '1px solid hsl(var(--border))',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {previewNewsletter.subject}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {audienceLabel(previewNewsletter)}
                {previewNewsletter.status === 'scheduled' ? (
                  <>
                    {' '}
                    ·{' '}
                    <span style={{ color: 'hsl(var(--accent))' }}>
                      Scheduled for{' '}
                      {previewNewsletter.scheduled_at
                        ? new Date(previewNewsletter.scheduled_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </>
                ) : (
                  <>
                    {' '}
                    · {previewNewsletter.recipient_count.toLocaleString()} recipients
                    {previewNewsletter.delivered_count > 0 && (
                      <>
                        {' '}
                        ·{' '}
                        <span style={{ color: 'hsl(var(--primary))' }}>
                          ✓{previewNewsletter.delivered_count.toLocaleString()} delivered
                        </span>
                        {previewNewsletter.bounce_count > 0 && (
                          <span style={{ color: 'hsl(var(--destructive))' }}>
                            {' '}
                            · ✕{previewNewsletter.bounce_count.toLocaleString()} bounced
                          </span>
                        )}
                        {previewNewsletter.open_count > 0 && (
                          <span> · {previewNewsletter.open_count.toLocaleString()} opens</span>
                        )}
                      </>
                    )}{' '}
                    ·{' '}
                    {previewNewsletter.sent_at
                      ? new Date(previewNewsletter.sent_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                    {previewNewsletter.status === 'failed' && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: 'hsl(var(--destructive))',
                          fontWeight: 'var(--font-weight-medium, 500)',
                        }}
                      >
                        · Failed
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {previewNewsletter.status === 'failed' ? (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    onResend(previewNewsletter)
                    setPreviewNewsletter(null)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    refresh
                  </span>
                  Resend
                </button>
              ) : previewNewsletter.status === 'scheduled' ? (
                <button
                  className="btn btn-outline-dest btn-sm"
                  onClick={() => {
                    void onCancel(previewNewsletter.id)
                    setPreviewNewsletter(null)
                  }}
                  title="Cancel this scheduled newsletter"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    cancel
                  </span>
                  Cancel scheduled
                </button>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onDuplicate(previewNewsletter)
                    setPreviewNewsletter(null)
                  }}
                  title="Duplicate & send again as a new newsletter"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    content_copy
                  </span>
                  Duplicate & send
                </button>
              )}
              <button
                onClick={() => setPreviewNewsletter(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                title="Close preview"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
          </div>

          {/* iframe renders the branded email at full fidelity */}
          <iframe
            srcDoc={previewNewsletter.body_html}
            title={previewNewsletter.subject}
            sandbox="allow-same-origin"
            style={{ flex: 1, border: 'none', background: '#e8e8e8' }}
          />
        </div>
      )}
    </>
  )
}
