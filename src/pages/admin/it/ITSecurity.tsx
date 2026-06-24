/**
 * IT Security Page Component
 * -------------------------------------------------------------
 * Component for administering security protocols, policies, and reference PDFs.
 * Supports PDF document uploads, markdown editing, and accordion listings.
 */

import { useState, useEffect, useCallback, useContext } from 'react'
import { itService } from '@/services/itService'
import { adminService } from '@/services/adminService'
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

  const [gatePassphrase, setGatePassphrase] = useState('')
  const [gateLoaded, setGateLoaded] = useState(false)
  const [gateSaving, setGateSaving] = useState(false)
  const [showGatePass, setShowGatePass] = useState(false)

  useEffect(() => {
    adminService.getSiteSettings().then((s) => {
      const val = s.admin_gate_passphrase
      if (typeof val === 'string') setGatePassphrase(val)
      setGateLoaded(true)
    })
  }, [])

  const handleSavePassphrase = async () => {
    if (!gatePassphrase.trim()) {
      toast.error('Passphrase cannot be empty.')
      return
    }
    setGateSaving(true)
    try {
      await adminService.updateSiteSetting('admin_gate_passphrase', gatePassphrase.trim())
      toast.success('Admin gate passphrase updated.')
    } catch {
      toast.error('Failed to update passphrase.')
    } finally {
      setGateSaving(false)
    }
  }

  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  // Fetch security protocol records and resolve creator usernames
  const load = useCallback(async () => {
    try {
      const data = await itService.getSecurityProtocols()
      setProtocols(data)
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
      const userId = await itService.getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')

      let fileUrl: string | null = null

      if (pdfFile) {
        setProgress('Uploading PDF to Supabase Storage…')
        const slug = title.trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40)
        const path = `${userId}/${Date.now()}-${slug}.pdf`
        fileUrl = await itService.uploadSecurityProtocol(pdfFile, path)
        setProgress('PDF uploaded — saving record…')
      }

      await itService.createSecurityProtocol({
        title: title.trim(),
        version: version.trim() || null,
        markdown_content: markdown.trim() || null,
        file_url: fileUrl,
        created_by: userId,
      })

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
      let storagePath: string | undefined
      if (fileUrl) {
        const BUCKET = 'it-security-protocols'
        const marker = `/storage/v1/object/public/${BUCKET}/`
        const idx = fileUrl.indexOf(marker)
        if (idx !== -1) storagePath = decodeURIComponent(fileUrl.slice(idx + marker.length))
      }
      await itService.deleteSecurityProtocol(id, storagePath)
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
      {/* Admin Gate Passphrase */}
      <div className="panel" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
          >
            passkey
          </span>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Admin Gate Passphrase
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Required before the admin login page is visible. Share only with authorized staff.
            </p>
          </div>
        </div>
        {gateLoaded ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showGatePass ? 'text' : 'password'}
                value={gatePassphrase}
                onChange={(e) => setGatePassphrase(e.target.value)}
                placeholder="Enter a strong passphrase"
                style={{
                  width: '100%',
                  height: 40,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0 38px 0 12px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowGatePass((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showGatePass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={gateSaving}
              onClick={handleSavePassphrase}
            >
              {gateSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
        )}
      </div>

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
