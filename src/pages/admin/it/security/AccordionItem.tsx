import type { Protocol } from './types'
import { toSafeHtml } from './markdownRenderer'

interface AccordionItemProps {
  protocol: Protocol
  isOpen: boolean
  onToggle: () => void
  onDelete: () => void
}

export function AccordionItem({ protocol, isOpen, onToggle, onDelete }: AccordionItemProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ borderBottom: '1px solid hsl(var(--border))' }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          cursor: 'pointer',
          background: isOpen ? 'hsl(var(--primary) / 0.04)' : 'transparent',
          transition: 'background 0.12s',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'hsl(var(--container-low))'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'transparent'
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            color: isOpen ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            transform: isOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.18s, color 0.18s',
            flexShrink: 0,
          }}
        >
          chevron_right
        </span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            color: isOpen ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            flexShrink: 0,
          }}
        >
          security
        </span>

        <span
          style={{
            flex: 1,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {protocol.title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {protocol.version && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-pill)',
                color: 'hsl(var(--on-surface-muted))',
                background: 'hsl(var(--container-low))',
              }}
            >
              {protocol.version}
            </span>
          )}
          {protocol.file_url && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                color: 'hsl(var(--destructive))',
                padding: '2px 8px',
                border: '1px solid hsl(var(--destructive) / 0.25)',
                borderRadius: 'var(--radius-pill)',
                background: 'hsl(var(--destructive) / 0.05)',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                picture_as_pdf
              </span>
              PDF
            </span>
          )}
          {protocol.markdown_content && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                color: 'hsl(var(--primary))',
                padding: '2px 8px',
                border: '1px solid hsl(var(--primary) / 0.25)',
                borderRadius: 'var(--radius-pill)',
                background: 'hsl(var(--primary) / 0.05)',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                article
              </span>
              Markdown
            </span>
          )}
          <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
            {fmtDate(protocol.created_at)}
          </span>
        </div>
      </div>

      {/* Expanded */}
      {isOpen && (
        <div style={{ padding: '0 20px 20px 52px' }}>
          {protocol.markdown_content && (
            <div
              style={{
                background: '#fff',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.7,
                marginBottom: protocol.file_url ? 14 : 16,
              }}
              dangerouslySetInnerHTML={{ __html: toSafeHtml(protocol.markdown_content) }}
            />
          )}

          {protocol.file_url && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'hsl(var(--destructive) / 0.04)',
                border: '1px solid hsl(var(--destructive) / 0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 14,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: 'hsl(var(--destructive))' }}
              >
                picture_as_pdf
              </span>
              <p
                style={{
                  margin: 0,
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Protocol Document{' '}
                <span style={{ fontWeight: 400, color: 'hsl(var(--on-surface-muted))' }}>
                  — PDF hosted on Supabase Storage
                </span>
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a
                  href={protocol.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    open_in_new
                  </span>
                  View
                </a>
                <a
                  href={protocol.file_url}
                  download
                  className="btn btn-primary btn-sm"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    download
                  </span>
                  Download
                </a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Added by {protocol.author_name} · {fmtDate(protocol.created_at)}
            </span>
            <button
              onClick={onDelete}
              className="btn btn-outline-dest btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                delete
              </span>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
