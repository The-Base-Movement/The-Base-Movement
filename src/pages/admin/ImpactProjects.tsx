import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminService } from '@/services/adminService'
import {
  impactContentService,
  type ImpactProject,
  type ImpactProjectInput,
} from '@/services/impactContentService'

const MAX_IMAGES = 4

const labelSt: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  marginBottom: 6,
}

const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  borderRadius: 'var(--radius-sm)',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const EMPTY_FORM: ImpactProjectInput = {
  title: '',
  summary: '',
  notes: '',
  images: [],
  location: '',
  datePerformed: null,
  isPublished: false,
  sortOrder: 0,
}

export default function ImpactProjects() {
  const [projects, setProjects] = useState<ImpactProject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ImpactProjectInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Any admin (in the admins table) can manage — same gate as blog_posts (is_admin()).
  // The nav item's MANAGE_BLOGS permission controls who discovers this page.
  const canEdit = !!adminService.getCurrentUser()

  const fetchProjects = () =>
    impactContentService
      .getAllProjects()
      .then(setProjects)
      .finally(() => setLoading(false))

  const reload = () => {
    setLoading(true)
    void fetchProjects()
  }

  useEffect(() => {
    void fetchProjects()
  }, [])

  if (!canEdit) {
    return (
      <div className="main">
        <AdminPageHeader
          title="Charitable Works"
          description="Manage the public /impact showcase"
        />
        <div className="panel" style={{ padding: 24, color: 'hsl(var(--on-surface-muted))' }}>
          You don’t have permission to manage charitable works.
        </div>
      </div>
    )
  }

  const startNew = () => {
    setForm({ ...EMPTY_FORM, sortOrder: projects.length })
    setEditingId('new')
  }

  const startEdit = (p: ImpactProject) => {
    const { id: _id, createdAt: _c, ...rest } = p
    setForm(rest)
    setEditingId(p.id)
  }

  const cancel = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const uploadSlot = async (file: File) => {
    if (form.images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images`)
      return
    }
    setUploading(true)
    try {
      const url = await impactContentService.uploadImage(file)
      if (url) setForm((f) => ({ ...f, images: [...f.images, url] }))
      else toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const res =
        editingId === 'new'
          ? await impactContentService.createProject(form)
          : await impactContentService.updateProject(editingId as string, form)
      if (res.success) {
        toast.success(editingId === 'new' ? 'Project created' : 'Project saved')
        cancel()
        reload()
      } else {
        toast.error(res.error ?? 'Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: ImpactProject) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return
    const res = await impactContentService.deleteProject(p.id)
    if (res.success) {
      toast.success('Project deleted')
      reload()
    } else {
      toast.error(res.error ?? 'Delete failed')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Charitable Works"
        description="Manage the public /impact showcase, each project shows up to 4 images and notes."
      />

      {editingId ? (
        <div className="panel" style={{ padding: 24 }}>
          <h2
            style={{
              margin: '0 0 20px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
            }}
          >
            {editingId === 'new' ? 'New project' : 'Edit project'}
          </h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="ip-title" style={labelSt}>
                Title *
              </label>
              <input
                id="ip-title"
                style={inputSt}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Back-to-school drive, Ablekuma North"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="ip-location" style={labelSt}>
                  Location (optional)
                </label>
                <input
                  id="ip-location"
                  style={inputSt}
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Kumasi, Ashanti"
                />
              </div>
              <div>
                <label htmlFor="ip-date" style={labelSt}>
                  Date (optional)
                </label>
                <input
                  id="ip-date"
                  type="date"
                  style={inputSt}
                  value={form.datePerformed ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, datePerformed: e.target.value || null }))
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="ip-summary" style={labelSt}>
                Card summary (short, shown on the card)
              </label>
              <textarea
                id="ip-summary"
                style={{ ...inputSt, minHeight: 60, resize: 'vertical' }}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="One or two sentences describing the project."
              />
            </div>

            <div>
              <label htmlFor="ip-notes" style={labelSt}>
                Notes (full write-up, shown when the card opens)
              </label>
              <textarea
                id="ip-notes"
                style={{ ...inputSt, minHeight: 140, resize: 'vertical' }}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Tell the story of the work, what was done, who it helped, the outcome."
              />
            </div>

            {/* Images */}
            <div>
              <label style={labelSt}>Images (up to {MAX_IMAGES}, first is the card cover)</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 12,
                }}
              >
                {form.images.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      aspectRatio: '4 / 3',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {i === 0 && (
                      <span
                        className="pill pill-ok"
                        style={{ position: 'absolute', top: 6, left: 6, fontSize: 9 }}
                      >
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                      className="btn btn-dest btn-sm"
                      style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        close
                      </span>
                    </button>
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <label
                    style={{
                      aspectRatio: '4 / 3',
                      border: '1px dashed hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: uploading ? 'wait' : 'pointer',
                      color: 'hsl(var(--on-surface-muted))',
                      background: 'hsl(var(--container-low))',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {uploading ? 'hourglass_top' : 'add_photo_alternate'}
                    </span>
                    <span style={{ fontSize: 11 }}>{uploading ? 'Uploading…' : 'Add image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadSlot(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Publish + order */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                  Published (visible on the public page)
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                  Sort order
                </span>
                <input
                  type="number"
                  style={{ ...inputSt, width: 80 }}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                borderTop: '1px solid hsl(var(--border))',
                paddingTop: 16,
              }}
            >
              <button className="btn btn-outline" onClick={cancel} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
                {saving ? 'Saving…' : 'Save project'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={startNew}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                add
              </span>
              New project
            </button>
          </div>

          {loading ? (
            <div className="panel" style={{ padding: 24, color: 'hsl(var(--on-surface-muted))' }}>
              Loading…
            </div>
          ) : projects.length === 0 ? (
            <div
              className="panel"
              style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
            >
              No charitable works yet. Click <strong>New project</strong> to add the first one.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="panel"
                  style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div
                    style={{
                      flex: '0 0 72px',
                      width: 72,
                      height: 54,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      background: 'hsl(var(--container-low))',
                    }}
                  >
                    {p.images[0] && (
                      <img
                        src={p.images[0]}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontSize: 14,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {p.title}
                      </span>
                      <span className={`pill ${p.isPublished ? 'pill-ok' : 'pill-mute'}`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      {p.images.length} image{p.images.length === 1 ? '' : 's'}
                      {p.location ? ` · ${p.location}` : ''}
                    </span>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-outline-dest btn-sm" onClick={() => remove(p)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
