import { useRef, useState, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { AudienceFilter, AudienceType } from '@/services/newsletterService'
import { newsletterService, formatRecipientCount } from '@/services/newsletterService'

interface FilterRowProps {
  filter: AudienceFilter
  onChange: (f: AudienceFilter) => void
  onRemove: () => void
  showRemove: boolean
  isFirst: boolean
}

function FilterRow({ filter, onChange, onRemove, showRemove }: FilterRowProps) {
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (filter.type === 'all') return
    let cancelled = false
    newsletterService
      .getAudienceOptions(filter.type as Exclude<AudienceType, 'all' | 'multi'>)
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [filter.type])

  const selectStyle: React.CSSProperties = {
    flex: 1,
    boxSizing: 'border-box',
    padding: '8px 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <select
        value={filter.type}
        onChange={(e) => {
          const t = e.target.value as AudienceFilter['type']
          onChange({ type: t, value: null })
        }}
        style={selectStyle}
      >
        <option value="all">All members</option>
        <option value="region">By region</option>
        <option value="constituency">By constituency</option>
        <option value="chapter">By chapter</option>
        <option value="role">By role</option>
      </select>

      {filter.type !== 'all' && (
        <select
          value={filter.value ?? ''}
          onChange={(e) => onChange({ ...filter, value: e.target.value || null })}
          style={selectStyle}
        >
          <option value="">— select —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {showRemove && (
        <button
          onClick={onRemove}
          title="Remove"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      )}
    </div>
  )
}

interface ComposePanelProps {
  isSending: boolean
  onSend: (subject: string, bodyHtml: string, filters: AudienceFilter[]) => void
}

export function ComposePanel({ isSending, onSend }: ComposePanelProps) {
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  const [subject, setSubject] = useState('')
  const [filters, setFilters] = useState<AudienceFilter[]>([{ type: 'all', value: null }])
  const [totalCount, setTotalCount] = useState<number | null>(null)

  const filtersComplete = filters.every((f) => f.type === 'all' || f.value !== null)
  const isAllMode = filters.length === 1 && filters[0].type === 'all'

  // Recalculate total recipient count whenever filters change to a complete state
  useEffect(() => {
    if (!filtersComplete) return
    let cancelled = false
    Promise.all(
      filters.map((f) =>
        newsletterService.getRecipientCount(f.type as Exclude<AudienceType, 'multi'>, f.value)
      )
    )
      .then((counts) => {
        if (!cancelled) setTotalCount(counts.reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [filters, filtersComplete])

  function updateFilter(index: number, updated: AudienceFilter) {
    setFilters((prev) => prev.map((f, i) => (i === index ? updated : f)))
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index))
  }

  function addFilter() {
    setFilters((prev) => [...prev, { type: 'region', value: null }])
  }

  function handleSend() {
    const body = editorRef.current?.getContent() ?? ''
    onSend(subject, body, filters)
  }

  const canSend =
    !isSending &&
    subject.trim().length > 0 &&
    filtersComplete &&
    (totalCount === null || totalCount > 0)

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    fontFamily: "'Public Sans', sans-serif",
  }

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="ph" style={{ marginBottom: 18 }}>
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
            Compose newsletter
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Sent via SendGrid · wrapped in branded template
          </p>
        </div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Movement update — June 2026"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            outline: 'none',
          }}
        />
      </div>

      {/* Audience filters */}
      <div style={{ marginBottom: 6 }}>
        <label style={labelStyle}>
          Audience{filters.length > 1 ? ` (${filters.length} targets)` : ''}
        </label>
        {filters.map((f, i) => (
          <FilterRow
            key={i}
            filter={f}
            isFirst={i === 0}
            showRemove={filters.length > 1}
            onChange={(updated) => updateFilter(i, updated)}
            onRemove={() => removeFilter(i)}
          />
        ))}
        {!isAllMode && (
          <button
            onClick={addFilter}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontSize: 12,
              color: 'hsl(var(--primary))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              add
            </span>
            Add audience
          </button>
        )}
      </div>

      {/* Recipient count */}
      {filtersComplete && totalCount !== null && (
        <p
          style={{
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            marginBottom: 14,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
          >
            people
          </span>
          ~{formatRecipientCount(totalCount)}
          {filters.length > 1 && (
            <span style={{ marginLeft: 4, opacity: 0.7 }}>(duplicates removed at send time)</span>
          )}
        </p>
      )}

      {/* TinyMCE body */}
      <div style={{ marginBottom: 18, marginTop: 14 }}>
        <label style={labelStyle}>Body</label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          onInit={(_, editor) => {
            editorRef.current = editor
          }}
          initialValue=""
          init={{
            height: 400,
            menubar: false,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'charmap',
              'searchreplace',
              'wordcount',
            ],
            toolbar:
              'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link | removeformat',
            statusbar: false,
            content_style:
              'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#1f2520; line-height:1.65; background:white; }',
            branding: false,
          }}
        />
      </div>

      {/* Send button */}
      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!canSend}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          send
        </span>
        {isSending ? 'Sending…' : 'Send newsletter'}
      </button>
    </div>
  )
}
