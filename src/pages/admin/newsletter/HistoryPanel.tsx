import { useState } from 'react'
import type { Newsletter } from '@/services/newsletterService'
import { buildAudienceLabel } from '@/services/newsletterService'

interface HistoryPanelProps {
  newsletters: Newsletter[]
  isLoading: boolean
  canDelete: boolean
  onDelete: (ids: string[]) => Promise<void>
}

export function HistoryPanel({ newsletters, isLoading, canDelete, onDelete }: HistoryPanelProps) {
  const [search, setSearch] = useState('')
  const [viewingBody, setViewingBody] = useState<Newsletter | null>(null)
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
              {newsletters.length} newsletter{newsletters.length !== 1 ? 's' : ''} sent
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
                {['Date', 'Subject', 'Audience', 'Recipients', 'Status'].map((h) => (
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
                      cursor: 'pointer',
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
                      }}
                      onClick={() => setViewingBody(n)}
                    >
                      {new Date(n.sent_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
                      }}
                      onClick={() => setViewingBody(n)}
                    >
                      {n.subject}
                    </td>
                    <td
                      style={{ padding: '10px 8px', color: 'hsl(var(--on-surface-muted))' }}
                      onClick={() => setViewingBody(n)}
                    >
                      {buildAudienceLabel(n.audience_type, n.audience_value)}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        color: 'hsl(var(--on-surface))',
                        textAlign: 'right',
                      }}
                      onClick={() => setViewingBody(n)}
                    >
                      {n.recipient_count.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px' }} onClick={() => setViewingBody(n)}>
                      <span className={n.status === 'sent' ? 'pill pill-ok' : 'pill pill-err'}>
                        {n.status}
                      </span>
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

      {/* View body modal */}
      {viewingBody && (
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
          onClick={() => setViewingBody(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: 680,
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                  {viewingBody.subject}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {buildAudienceLabel(viewingBody.audience_type, viewingBody.audience_value)} ·{' '}
                  {viewingBody.recipient_count.toLocaleString()} recipients
                </p>
              </div>
              <button
                onClick={() => setViewingBody(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ __html: viewingBody.body_html }}
            />
          </div>
        </div>
      )}
    </>
  )
}
