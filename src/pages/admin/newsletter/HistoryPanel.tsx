import { useState } from 'react'
import type { Newsletter } from '@/services/newsletterService'
import { buildAudienceLabel } from '@/services/newsletterService'

interface HistoryPanelProps {
  newsletters: Newsletter[]
  isLoading: boolean
}

export function HistoryPanel({ newsletters, isLoading }: HistoryPanelProps) {
  const [search, setSearch] = useState('')
  const [viewingBody, setViewingBody] = useState<Newsletter | null>(null)

  const filtered = newsletters.filter((n) => n.subject.toLowerCase().includes(search.toLowerCase()))

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
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setViewingBody(n)}
                  style={{ borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
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
                  >
                    {n.subject}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'hsl(var(--on-surface-muted))' }}>
                    {buildAudienceLabel(n.audience_type, n.audience_value)}
                  </td>
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'hsl(var(--on-surface))',
                      textAlign: 'right',
                    }}
                  >
                    {n.recipient_count.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={n.status === 'sent' ? 'pill pill-ok' : 'pill pill-err'}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
