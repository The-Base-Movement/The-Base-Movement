import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import DOMPurify from 'dompurify'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { ITLayoutContext } from './ITLayoutContext'
import { SortToggle } from '@/components/ui/SortToggle'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Protocol {
  id: string
  title: string
  markdown_content: string | null
  file_url: string | null
  version: string | null
  author_name: string
  created_at: string
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function toSafeHtml(md: string): string {
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const raw = escaped
    .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 5px;font-size:13px;font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:18px 0 7px;font-size:15px;font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:0 0 12px;font-size:18px;font-weight:600">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /```([\s\S]*?)```/g,
      '<pre style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:4px;padding:12px;overflow-x:auto;font-size:12px;margin:10px 0"><code>$1</code></pre>'
    )
    .replace(
      /`(.+?)`/g,
      '<code style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:3px;padding:1px 5px;font-size:12px">$1</code>'
    )
    .replace(
      /^- \[ \] (.+)$/gm,
      '<div style="display:flex;gap:8px;align-items:center;margin:3px 0"><span style="width:13px;height:13px;border:1.5px solid #ccc;border-radius:2px;display:inline-block;flex-shrink:0"></span><span>$1</span></div>'
    )
    .replace(
      /^- \[x\] (.+)$/gm,
      '<div style="display:flex;gap:8px;align-items:center;margin:3px 0;opacity:0.6;text-decoration:line-through"><span style="width:13px;height:13px;background:#16a34a;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:9px">✓</span><span>$1</span></div>'
    )
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:14px 0"/>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#15803d;text-decoration:underline">$1</a>'
    )
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br/>')

  return DOMPurify.sanitize(`<p style="margin:0">${raw}</p>`, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'strong',
      'em',
      'code',
      'pre',
      'li',
      'ul',
      'ol',
      'a',
      'br',
      'hr',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
    ALLOW_DATA_ATTR: false,
  })
}

// ─── PDF Drop Zone ────────────────────────────────────────────────────────────

interface DropZoneProps {
  file: File | null
  onFile: (f: File | null) => void
}

function PDFDropZone({ file, onFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      onFile(dropped)
    } else if (dropped) {
      toast.error('Only PDF files are accepted')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        PDF Upload{' '}
        <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(optional)</span>
      </p>

      {file ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: '2px solid hsl(var(--primary))',
            borderRadius: 'var(--radius-md)',
            background: 'hsl(var(--primary) / 0.04)',
            padding: 24,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--destructive))' }}
          >
            picture_as_pdf
          </span>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 2px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                wordBreak: 'break-all',
              }}
            >
              {file.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button type="button" onClick={() => onFile(null)} className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              close
            </span>
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: `2px dashed ${dragging ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            borderRadius: 'var(--radius-md)',
            background: dragging ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--container-low))',
            cursor: 'pointer',
            padding: 32,
            transition: 'border-color 0.15s, background 0.15s',
            minHeight: 200,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 44,
              color: dragging ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              opacity: 0.45,
              transition: 'color 0.15s',
            }}
          >
            upload_file
          </span>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: dragging ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                transition: 'color 0.15s',
              }}
            >
              {dragging ? 'Drop the PDF here' : 'Drag & drop a PDF'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              or click to browse · max 20 MB
            </p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        id="pdf-upload"
        name="pdfUpload"
        type="file"
        accept="application/pdf"
        aria-label="Upload PDF document"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Markdown Editor ──────────────────────────────────────────────────────────

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({
  protocol,
  isOpen,
  onToggle,
  onDelete,
}: {
  protocol: Protocol
  isOpen: boolean
  onToggle: () => void
  onDelete: () => void
}) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITSecurity() {
  const { setCurrentLabel } = usePageLabel()
  useEffect(() => {
    setCurrentLabel('Security Protocols')
  }, [setCurrentLabel])

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { setHeader } = useContext(ITLayoutContext)
  useEffect(() => {
    setHeader({
      title: 'Security Protocols',
      icon: 'security',
      description: 'IT security policies, procedures and reference documents for the team.',
      actions: (
        <button
          className={formOpen ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}
          onClick={() => {
            setFormOpen((o) => !o)
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {formOpen ? 'close' : 'add'}
          </span>
          {formOpen ? 'Cancel' : 'Add protocol'}
        </button>
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen])

  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('it_security_protocols')
        .select('id, title, markdown_content, file_url, version, created_at, created_by')
        .order('created_at', { ascending: false })
      if (error) throw error

      const creatorIds = [
        ...new Set((data ?? []).map((p) => p.created_by).filter(Boolean)),
      ] as string[]
      let nameMap: Record<string, string> = {}
      if (creatorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', creatorIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      }

      setProtocols(
        (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          markdown_content: p.markdown_content,
          file_url: p.file_url,
          version: p.version,
          created_at: p.created_at,
          author_name: nameMap[p.created_by] ?? 'Unknown',
        }))
      )
    } catch {
      toast.error('Failed to load protocols')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function reset() {
    setTitle('')
    setVersion('')
    setMarkdown('')
    setPdfFile(null)
    setProgress(null)
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!markdown.trim() && !pdfFile) {
      toast.error('Provide markdown content, a PDF, or both')
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let fileUrl: string | null = null

      if (pdfFile) {
        setProgress('Uploading PDF to Supabase Storage…')
        const slug = title.trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40)
        const path = `${user.id}/${Date.now()}-${slug}.pdf`

        const { error: upErr } = await supabase.storage
          .from('it-security-protocols')
          .upload(path, pdfFile, { contentType: 'application/pdf' })
        if (upErr) throw upErr

        fileUrl = supabase.storage.from('it-security-protocols').getPublicUrl(path).data.publicUrl
        setProgress('PDF uploaded — saving record…')
      }

      const { error: insErr } = await supabase.from('it_security_protocols').insert({
        title: title.trim(),
        version: version.trim() || null,
        markdown_content: markdown.trim() || null,
        file_url: fileUrl,
        created_by: user.id,
      })
      if (insErr) throw insErr

      toast.success('Protocol saved')
      reset()
      setFormOpen(false)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save protocol')
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  async function handleDelete(id: string, fileUrl: string | null) {
    if (!confirm('Delete this protocol? This cannot be undone.')) return
    try {
      if (fileUrl) {
        const BUCKET = 'it-security-protocols'
        const marker = `/storage/v1/object/public/${BUCKET}/`
        const idx = fileUrl.indexOf(marker)
        if (idx !== -1) {
          const storagePath = decodeURIComponent(fileUrl.slice(idx + marker.length))
          await supabase.storage.from(BUCKET).remove([storagePath])
        }
      }
      const { error } = await supabase.from('it_security_protocols').delete().eq('id', id)
      if (error) throw error
      toast.success('Protocol deleted')
      setProtocols((prev) => prev.filter((p) => p.id !== id))
      if (openId === id) setOpenId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 38,
    padding: '0 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 13,
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div>
      {/* ── Form ───────────────────────────────────────────────────────── */}
      {formOpen && (
        <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              add_circle
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              New Security Protocol
            </p>
          </div>

          {/* Title + Version */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(100px,120px)',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <label
                htmlFor="protocol-title"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input
                id="protocol-title"
                name="protocolTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Password Management Policy"
                style={inputSt}
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="protocol-version"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Version
              </label>
              <input
                id="protocol-version"
                name="protocolVersion"
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                style={inputSt}
              />
            </div>
          </div>

          {/* Split editor — stacks to single column below 640 px */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              marginBottom: 20,
              alignItems: 'stretch',
            }}
          >
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
            <PDFDropZone file={pdfFile} onFile={setPdfFile} />
          </div>

          {/* Upload progress */}
          {progress && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'hsl(var(--primary) / 0.06)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                fontSize: 12,
                color: 'hsl(var(--primary))',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}
              >
                sync
              </span>
              {progress}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFormOpen(false)
                reset()
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving || (!markdown.trim() && !pdfFile) || !title.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                save
              </span>
              {saving ? 'Saving…' : 'Save protocol'}
            </button>
          </div>
        </div>
      )}

      {/* ── Protocol list ───────────────────────────────────────────────── */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '13px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
          >
            policy
          </span>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Saved Protocols
          </p>
          {!loading && protocols.length > 0 && (
            <span className="pill pill-ok" style={{ fontSize: 9 }}>
              {protocols.length} {protocols.length === 1 ? 'protocol' : 'protocols'}
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <SortToggle value={sortDir} onChange={setSortDir} />
          </div>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderBottom: '1px solid hsl(var(--border))',
                background: i % 2 === 0 ? 'hsl(var(--container-low))' : '#fff',
                opacity: 0.5 - i * 0.1,
              }}
            />
          ))
        ) : protocols.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '52px 24px',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 44, display: 'block', marginBottom: 12, opacity: 0.2 }}
            >
              policy
            </span>
            <p style={{ margin: '0 0 16px', fontSize: 14 }}>No protocols saved yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setFormOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                add
              </span>
              Add first protocol
            </button>
          </div>
        ) : (
          [...protocols]
            .sort((a, b) => {
              const cmp = a.title.localeCompare(b.title)
              return sortDir === 'asc' ? cmp : -cmp
            })
            .map((p) => (
              <AccordionItem
                key={p.id}
                protocol={p}
                isOpen={openId === p.id}
                onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
                onDelete={() => handleDelete(p.id, p.file_url)}
              />
            ))
        )}
      </div>
    </div>
  )
}
