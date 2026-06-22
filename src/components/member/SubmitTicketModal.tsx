/**
 * SubmitTicketModal Component (Member Surface)
 * -------------------------------------------------------------
 * A modal form allowing members to submit new helpdesk support tickets.
 * Flow:
 * 1. "dept" step: Displays available departments filtered by user authorization roles.
 * 2. "form" step: Gathers subject title, description detail, priority rating, and optional file attachments (max 10MB each).
 * Once completed, triggers onSubmit callback prop.
 */

import { useState, useRef } from 'react'
import type { HelpdeskDepartment } from '@/components/admin/Helpdesk/types'

interface Props {
  departments: HelpdeskDepartment[]
  userRole?: string | null
  onClose: () => void
  onSubmit: (payload: {
    department_id: string
    subject: string
    description: string
    priority: 'low' | 'medium' | 'high'
    files: File[]
  }) => Promise<boolean>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  marginBottom: 6,
}

/**
 * SubmitTicketModal component definition.
 */
export function SubmitTicketModal({ departments, userRole, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<'dept' | 'form'>('dept')
  const [selectedDept, setSelectedDept] = useState<HelpdeskDepartment | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleDepts = departments.filter((d) => {
    if (!d.restricted_submitter_roles?.length) return true
    return !!userRole && d.restricted_submitter_roles.includes(userRole)
  })

  /**
   * Submits the ticket payload and file attachments via the onSubmit prop callback.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDept || !subject.trim() || !description.trim()) return
    setSaving(true)
    const ok = await onSubmit({
      department_id: selectedDept.id,
      subject,
      description,
      priority,
      files,
    })
    setSaving(false)
    if (ok) onClose()
  }

  /**
   * Filters uploaded file list to enforce a maximum size limit of 10 MB per file.
   */
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024)
    if (valid.length < selected.length) alert('Some files exceed the 10 MB limit and were skipped.')
    setFiles((prev) => [...prev, ...valid])
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 16,
              color: 'hsl(var(--on-surface))',
            }}
          >
            {step === 'dept' ? 'Choose a Department' : `Submit to ${selectedDept?.name}`}
          </p>
          {step === 'form' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('dept')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_back
              </span>
            </button>
          )}
        </div>

        {step === 'dept' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            {visibleDepts.map((d) => (
              <button
                key={d.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--container-low))',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  transition: 'border-color 0.1s, background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.background = 'hsl(var(--container-low))'
                }}
                onClick={() => {
                  setSelectedDept(d)
                  setStep('form')
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
                >
                  {d.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {d.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail…"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                style={inputStyle}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Attachments{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0 }}>
                  (optional, max 10 MB each)
                </span>
              </label>
              <div
                style={{
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'hsl(var(--container-low))',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 24, color: 'hsl(var(--on-surface-muted))' }}
                >
                  upload_file
                </span>
                <p
                  style={{ margin: '6px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}
                >
                  Click to browse or drag files here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFiles}
                />
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {files.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'hsl(var(--container-low))',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {f.name}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0 4px' }}
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving || !subject.trim() || !description.trim()}
              >
                {saving ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
