import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { redirectService } from '@/services/redirectService'
import type { RedirectRule, RedirectRulePayload, RedirectStatusCode } from '@/types/redirects'

const STATUS_OPTIONS: RedirectStatusCode[] = [301, 302, 307, 308]

const emptyForm: RedirectRulePayload = {
  sourcePath: '',
  destinationPath: '',
  statusCode: 301,
  isActive: true,
  preserveQuery: true,
  notes: '',
}

function normalizePath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

function validateForm(form: RedirectRulePayload): string | null {
  const source = normalizePath(form.sourcePath)
  const destination = normalizePath(form.destinationPath)
  if (!source || !destination) return 'Source and destination are required.'
  if (!source.startsWith('/') || /^https?:\/\//i.test(source)) {
    return 'Source must be a local path, for example /old-page.'
  }
  if (source === '/') return 'The homepage cannot be used as a redirect source.'
  if (source === destination) return 'Source and destination cannot be the same.'
  if (destination.startsWith('//')) return 'Protocol-relative destinations are not allowed.'
  return null
}

export default function AdminRedirects() {
  const [rules, setRules] = useState<RedirectRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<RedirectRulePayload>(emptyForm)

  const loadRules = useCallback(async () => {
    setLoading(true)
    const data = await redirectService.getRedirectRules()
    setRules(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRules()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadRules])

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rules
    return rules.filter(
      (rule) =>
        rule.sourcePath.toLowerCase().includes(term) ||
        rule.destinationPath.toLowerCase().includes(term) ||
        rule.notes?.toLowerCase().includes(term)
    )
  }, [rules, search])

  const kpis = [
    { label: 'Total Rules', value: rules.length, bar: 'hsl(var(--on-surface))' },
    {
      label: 'Active',
      value: rules.filter((rule) => rule.isActive).length,
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Permanent',
      value: rules.filter((rule) => rule.statusCode === 301 || rule.statusCode === 308).length,
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Temporary',
      value: rules.filter((rule) => rule.statusCode === 302 || rule.statusCode === 307).length,
      bar: 'hsl(var(--destructive))',
    },
  ]

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function startEdit(rule: RedirectRule) {
    setEditingId(rule.id)
    setForm({
      sourcePath: rule.sourcePath,
      destinationPath: rule.destinationPath,
      statusCode: rule.statusCode,
      isActive: rule.isActive,
      preserveQuery: rule.preserveQuery,
      notes: rule.notes ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errorMessage = validateForm(form)
    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    const payload: RedirectRulePayload = {
      ...form,
      sourcePath: normalizePath(form.sourcePath),
      destinationPath: normalizePath(form.destinationPath),
      notes: form.notes?.trim() || null,
    }

    setSaving(true)
    const toastId = toast.loading(
      editingId ? 'Updating redirect rule...' : 'Creating redirect rule...'
    )
    try {
      const ok = editingId
        ? await redirectService.updateRedirectRule(editingId, payload)
        : Boolean(await redirectService.createRedirectRule(payload))

      if (!ok) throw new Error('Redirect rule could not be saved.')

      toast.success(editingId ? 'Redirect rule updated.' : 'Redirect rule created.', {
        id: toastId,
      })
      resetForm()
      await loadRules()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save redirect rule.', {
        id: toastId,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(rule: RedirectRule) {
    const ok = await redirectService.updateRedirectRule(rule.id, {
      sourcePath: rule.sourcePath,
      destinationPath: rule.destinationPath,
      statusCode: rule.statusCode,
      isActive: !rule.isActive,
      preserveQuery: rule.preserveQuery,
      notes: rule.notes,
    })
    if (ok) {
      toast.success(rule.isActive ? 'Redirect disabled.' : 'Redirect enabled.')
      await loadRules()
    } else {
      toast.error('Failed to update redirect status.')
    }
  }

  async function handleDelete(rule: RedirectRule) {
    if (!window.confirm(`Delete redirect from "${rule.sourcePath}"?`)) return
    const ok = await redirectService.deleteRedirectRule(rule.id)
    if (ok) {
      toast.success('Redirect rule deleted.')
      if (editingId === rule.id) resetForm()
      await loadRules()
    } else {
      toast.error('Failed to delete redirect rule.')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Redirects"
        icon="alt_route"
        description="Create and manage public URL redirects. Active rules are read by Vercel middleware before the app rewrite."
      />

      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <form className="panel" onSubmit={handleSubmit} style={{ padding: 18, marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: 'hsl(var(--on-surface))', fontSize: 16 }}>
              {editingId ? 'Edit redirect rule' : 'New redirect rule'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
              Use permanent 301 redirects for SEO moves and temporary redirects for short campaigns.
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>Source path</span>
            <input
              value={form.sourcePath}
              onChange={(event) => setForm((prev) => ({ ...prev, sourcePath: event.target.value }))}
              placeholder="/old-page"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>Destination</span>
            <input
              value={form.destinationPath}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, destinationPath: event.target.value }))
              }
              placeholder="/new-page"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>Status code</span>
            <select
              value={form.statusCode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  statusCode: Number(event.target.value) as RedirectStatusCode,
                }))
              }
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>Internal note</span>
          <textarea
            value={form.notes ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Why this redirect exists"
            rows={3}
            style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }}
          />
        </label>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Active
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={form.preserveQuery}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, preserveQuery: event.target.checked }))
                }
              />
              Preserve query string
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              save
            </span>
            {saving ? 'Saving...' : editingId ? 'Update redirect' : 'Create redirect'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search redirect rules..."
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
      </div>

      <div className="panel desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              {['Source', 'Destination', 'Code', 'Status', 'Query', 'Updated', 'Actions'].map(
                (heading) => (
                  <th key={heading} style={tableHeadStyle}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  Loading redirect rules...
                </td>
              </tr>
            ) : filteredRules.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  No redirect rules found
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <td style={tableCellStyle}>{rule.sourcePath}</td>
                  <td style={tableCellStyle}>{rule.destinationPath}</td>
                  <td style={tableCellStyle}>{rule.statusCode}</td>
                  <td style={tableCellStyle}>
                    <span className={`pill ${rule.isActive ? 'pill-ok' : 'pill-mute'}`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{rule.preserveQuery ? 'Yes' : 'No'}</td>
                  <td style={tableCellStyle}>{new Date(rule.updatedAt).toLocaleDateString()}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(rule)}>
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(rule)}>
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rule)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredRules.map((rule) => (
          <div key={rule.id} className="panel" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ color: 'hsl(var(--on-surface))', fontSize: 13 }}>
                {rule.sourcePath}
              </strong>
              <span className={`pill ${rule.isActive ? 'pill-ok' : 'pill-mute'}`}>
                {rule.statusCode}
              </span>
            </div>
            <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12, margin: '8px 0' }}>
              {rule.destinationPath}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(rule)}>
                Edit
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(rule)}>
                {rule.isActive ? 'Disable' : 'Enable'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rule)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 13,
  padding: '8px 10px',
  boxSizing: 'border-box',
}

const checkboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: 'hsl(var(--on-surface))',
  fontSize: 13,
}

const tableHeadStyle: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  color: 'hsl(var(--on-surface-muted))',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: 'hsl(var(--container-low))',
}

const tableCellStyle: React.CSSProperties = {
  padding: '12px 14px',
  color: 'hsl(var(--on-surface))',
  fontSize: 12,
  verticalAlign: 'middle',
}

const emptyCellStyle: React.CSSProperties = {
  padding: 28,
  textAlign: 'center',
  color: 'hsl(var(--on-surface-muted))',
  fontSize: 12,
}
