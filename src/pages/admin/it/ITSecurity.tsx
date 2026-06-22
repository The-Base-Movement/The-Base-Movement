/**
 * IT Security Page Component
 * -------------------------------------------------------------
 * Component for administering security protocols, policies, and reference PDFs.
 * Supports PDF document uploads, markdown editing, and accordion listings.
 */

import { useState, useEffect, useCallback, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { ITLayoutContext } from './ITLayoutContext'
import { SortToggle } from '@/components/ui/SortToggle'
import { toast } from 'sonner'
import type { Protocol } from './security/types'
import { PDFDropZone } from './security/PDFDropZone'
import { MarkdownEditor } from './security/MarkdownEditor'
import { AccordionItem } from './security/AccordionItem'

// Main security protocols management page component
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

  // Fetch security protocol records and resolve creator usernames
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
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  // Clear form state variables
  function reset() {
    setTitle('')
    setVersion('')
    setMarkdown('')
    setPdfFile(null)
    setProgress(null)
  }

  // Save new protocol details, uploading PDF attachment to storage bucket if present
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

  // Delete target protocol record and remove associated file from storage bucket
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
  const labelSt: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 6,
  }

  const sorted = [...protocols].sort((a, b) => {
    const cmp = a.title.localeCompare(b.title)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      {formOpen ? (
        <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
            {/* Form inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div>
                  <label htmlFor="protocol-title" style={labelSt}>
                    Protocol title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    id="protocol-title"
                    name="protocolTitle"
                    type="text"
                    placeholder="e.g. Server Access & SSH Key Management"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputSt}
                  />
                </div>
                <div style={{ width: 100 }}>
                  <label htmlFor="protocol-version" style={labelSt}>
                    Version
                  </label>
                  <input
                    id="protocol-version"
                    name="protocolVersion"
                    type="text"
                    placeholder="e.g. v1.2"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    style={inputSt}
                  />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <MarkdownEditor value={markdown} onChange={setMarkdown} />
              </div>
            </div>

            {/* Drop zone / Submit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <PDFDropZone file={pdfFile} onFile={setPdfFile} />
              </div>

              <div
                style={{
                  padding: '16px 20px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                {progress && (
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: 12,
                      color: 'hsl(var(--primary))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {progress}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      reset()
                      setFormOpen(false)
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={saving || !title.trim() || (!markdown.trim() && !pdfFile)}
                    onClick={handleSave}
                    style={{ flex: 1 }}
                  >
                    {saving ? 'Saving…' : 'Publish protocol'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SortToggle value={sortDir} onChange={setSortDir} label="Name" />
        </div>
      )}

      {/* Accordion List */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 48,
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                opacity: 0.5 - i * 0.08,
              }}
            />
          ))
        ) : sorted.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 44, display: 'block', marginBottom: 10, opacity: 0.2 }}
            >
              security
            </span>
            <p style={{ margin: 0, fontSize: 13 }}>No security protocols published yet.</p>
          </div>
        ) : (
          sorted.map((p) => (
            <AccordionItem
              key={p.id}
              protocol={p}
              isOpen={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
              onDelete={() => handleDelete(p.id, p.file_url)}
            />
          ))
        )}
      </div>
    </div>
  )
}
