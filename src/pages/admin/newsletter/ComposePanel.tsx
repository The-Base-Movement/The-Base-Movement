import { useRef, useState, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { AudienceType } from '@/services/newsletterService'
import { newsletterService, formatRecipientCount } from '@/services/newsletterService'

interface ComposePanelProps {
  isSending: boolean
  onSend: (
    subject: string,
    bodyHtml: string,
    audienceType: AudienceType,
    audienceValue: string | null
  ) => void
}

export function ComposePanel({ isSending, onSend }: ComposePanelProps) {
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  const [subject, setSubject] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [audienceValue, setAudienceValue] = useState<string | null>(null)
  const [audienceOptions, setAudienceOptions] = useState<string[]>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)

  // Fetch audience value options whenever the type changes (and isn't 'all')
  useEffect(() => {
    if (audienceType !== 'all') {
      newsletterService
        .getAudienceOptions(audienceType)
        .then(setAudienceOptions)
        .catch(() => {})
    }
  }, [audienceType])

  // Fetch recipient count whenever we have a complete selection
  useEffect(() => {
    if (audienceType === 'all' || audienceValue) {
      newsletterService
        .getRecipientCount(audienceType, audienceValue)
        .then(setRecipientCount)
        .catch(() => {})
    }
  }, [audienceType, audienceValue])

  function handleSend() {
    const body = editorRef.current?.getContent() ?? ''
    onSend(subject, body, audienceType, audienceValue)
  }

  const canSend =
    !isSending &&
    subject.trim().length > 0 &&
    (audienceType === 'all' || audienceValue !== null) &&
    (recipientCount === null || recipientCount > 0)

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

  const inputStyle: React.CSSProperties = {
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
          style={inputStyle}
        />
      </div>

      {/* Audience type + value */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Audience</label>
          <select
            value={audienceType}
            onChange={(e) => {
              setAudienceType(e.target.value as AudienceType)
              setAudienceValue(null)
              setAudienceOptions([])
              setRecipientCount(null)
            }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="all">All members</option>
            <option value="region">By region</option>
            <option value="constituency">By constituency</option>
            <option value="chapter">By chapter</option>
            <option value="role">By role</option>
          </select>
        </div>

        {audienceType !== 'all' && (
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>
              {audienceType.charAt(0).toUpperCase() + audienceType.slice(1)}
            </label>
            <select
              value={audienceValue ?? ''}
              onChange={(e) => setAudienceValue(e.target.value || null)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">— select —</option>
              {audienceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Recipient count preview */}
      {recipientCount !== null && (
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
          ~{formatRecipientCount(recipientCount)}
        </p>
      )}

      {/* TinyMCE body */}
      <div style={{ marginBottom: 18 }}>
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
