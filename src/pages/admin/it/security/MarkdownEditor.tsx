import { useState } from 'react'
import { toSafeHtml } from './markdownRenderer'

interface MarkdownEditorProps {
  value: string
  onChange: (v: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Markdown Content
        </p>
        <div
          style={{
            display: 'flex',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}
        >
          {(['write', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '4px 12px',
                background: tab === t ? 'hsl(var(--primary))' : 'transparent',
                color: tab === t ? '#fff' : 'hsl(var(--on-surface-muted))',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                transition: 'all 0.1s',
              }}
            >
              {t === 'write' ? 'Write' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          id="protocol-markdown"
          name="markdownContent"
          aria-label="Markdown content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`# Protocol Title\n\n## Scope\nDescribe what this protocol covers.\n\n## Rules\n- Rule one\n- Rule two\n\n## Reference Links\n[Policy Document](https://example.com)`}
          style={{
            flex: 1,
            width: '100%',
            minHeight: 260,
            padding: '12px 14px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 13,
            lineHeight: 1.7,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 260,
            padding: '14px 16px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: '#fff',
            overflowY: 'auto',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{
            __html: value.trim()
              ? toSafeHtml(value)
              : '<p style="margin:0;color:#9ca3af;font-style:italic">Nothing to preview yet.</p>',
          }}
        />
      )}

      {tab === 'write' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {['# H1', '## H2', '**bold**', '*italic*', '`code`', '[text](url)', '- item'].map(
            (hint) => (
              <span
                key={hint}
                style={{
                  fontSize: 10,
                  fontFamily: "'Courier New', monospace",
                  color: 'hsl(var(--on-surface-muted))',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 3,
                  padding: '1px 6px',
                }}
              >
                {hint}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}
