import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { PressRelease } from '@/types/admin'

type ReleaseInput = Omit<PressRelease, 'id' | 'createdAt' | 'updatedAt'>

const CATEGORIES = ['Statement', 'Announcement', 'Policy', 'Event', 'Response', 'Update']

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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const todayISODate = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ReleaseInput = {
  title: '',
  slug: '',
  category: 'Statement',
  excerpt: '',
  content: '',
  publishedAt: '',
  imageUrl: '',
  isOfficial: true,
}

export default function PressReleases() {
  const [releases, setReleases] = useState<PressRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ReleaseInput>(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const canEdit = !!adminService.getCurrentUser()

  const fetchReleases = () =>
    adminService
      .getPressReleases()
      .then(setReleases)
      .finally(() => setLoading(false))

  const reload = () => {
    setLoading(true)
    void fetchReleases()
  }

  useEffect(() => {
    void fetchReleases()
  }, [])

  if (!canEdit) {
    return (
      <div className="main">
        <AdminPageHeader title="Press Releases" description="Write and manage press releases" />
        <div className="panel" style={{ padding: 24, color: 'hsl(var(--on-surface-muted))' }}>
          You don’t have permission to manage press releases.
        </div>
      </div>
    )
  }

  const startNew = () => {
    setForm({ ...EMPTY_FORM, publishedAt: todayISODate() })
    setSlugTouched(false)
    setEditingId('new')
  }

  const startEdit = (r: PressRelease) => {
    setForm({
      title: r.title,
      slug: r.slug,
      category: r.category,
      excerpt: r.excerpt ?? '',
      content: r.content,
      publishedAt: r.publishedAt ? r.publishedAt.slice(0, 10) : todayISODate(),
      imageUrl: r.imageUrl ?? '',
      isOfficial: r.isOfficial,
    })
    setSlugTouched(true)
    setEditingId(r.id)
  }

  const cancel = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
  }

  const onTitle = (title: string) =>
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))

  const uploadCover = async (file: File) => {
    setUploading(true)
    try {
      const url = await contentService.uploadImage(file, 'press')
      if (url) setForm((f) => ({ ...f, imageUrl: url }))
      else toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.excerpt?.trim()) return toast.error('Excerpt is required (shown on the card)')
    if (!form.content.trim()) return toast.error('Body content is required')

    const payload: ReleaseInput = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
      publishedAt: new Date(form.publishedAt || todayISODate()).toISOString(),
    }

    setSaving(true)
    try {
      const ok =
        editingId === 'new'
          ? await adminService.createPressRelease(payload)
          : await adminService.updatePressRelease(editingId as string, payload)
      if (ok) {
        toast.success(editingId === 'new' ? 'Press release published' : 'Press release saved')
        cancel()
        reload()
      } else {
        toast.error('Save failed, check the slug is unique')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (r: PressRelease) => {
    if (!window.confirm(`Delete “${r.title}”? It will be removed from the public press page.`))
      return
    const ok = await adminService.deletePressRelease(r.id)
    if (ok) {
      toast.success('Press release deleted')
      reload()
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Press Releases"
        description="Write official statements published to the public /press page."
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
            {editingId === 'new' ? 'New press release' : 'Edit press release'}
          </h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="pr-title" style={labelSt}>
                Title *
              </label>
              <input
                id="pr-title"
                style={inputSt}
                value={form.title}
                onChange={(e) => onTitle(e.target.value)}
                placeholder="e.g. The Base Movement responds to the 2026 budget"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="pr-slug" style={labelSt}>
                  Slug (URL id)
                </label>
                <input
                  id="pr-slug"
                  style={{ ...inputSt, fontFamily: 'monospace' }}
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                  }}
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <label htmlFor="pr-category" style={labelSt}>
                  Category
                </label>
                <select
                  id="pr-category"
                  style={{ ...inputSt, cursor: 'pointer' }}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pr-date" style={labelSt}>
                  Published date
                </label>
                <input
                  id="pr-date"
                  type="date"
                  style={inputSt}
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pr-excerpt" style={labelSt}>
                Excerpt * (shown on the press card & at the top of the release)
              </label>
              <textarea
                id="pr-excerpt"
                style={{ ...inputSt, minHeight: 64, resize: 'vertical' }}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="A one or two sentence summary of the release."
              />
            </div>

            <div>
              <label htmlFor="pr-content" style={labelSt}>
                Body * (the full statement, paragraphs separated by a blank line)
              </label>
              <textarea
                id="pr-content"
                style={{ ...inputSt, minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write the full press release here…"
              />
            </div>

            {/* Cover image */}
            <div>
              <label style={labelSt}>Cover image (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {form.imageUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      width: 140,
                      height: 90,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <img
                      src={form.imageUrl}
                      alt="Cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      aria-label="Remove cover"
                      className="btn btn-dest btn-sm"
                      style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <label
                    className="btn btn-outline btn-sm"
                    style={{ cursor: uploading ? 'wait' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {uploading ? 'hourglass_top' : 'add_photo_alternate'}
                    </span>
                    {uploading ? 'Uploading…' : 'Upload cover'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadCover(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isOfficial}
                onChange={(e) => setForm((f) => ({ ...f, isOfficial: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                Official statement
              </span>
            </label>

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
                {saving ? 'Saving…' : editingId === 'new' ? 'Publish release' : 'Save changes'}
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
              New press release
            </button>
          </div>

          {loading ? (
            <div className="panel" style={{ padding: 24, color: 'hsl(var(--on-surface-muted))' }}>
              Loading…
            </div>
          ) : releases.length === 0 ? (
            <div
              className="panel"
              style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
            >
              No press releases yet. Click <strong>New press release</strong> to write the first
              one.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {releases.map((r) => (
                <div
                  key={r.id}
                  className="panel"
                  style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontSize: 14,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {r.title}
                      </span>
                      <span className="pill pill-mute">{r.category}</span>
                      {r.isOfficial && <span className="pill pill-ok">Official</span>}
                    </div>
                    <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      {r.publishedAt
                        ? new Date(r.publishedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button className="btn btn-outline-dest btn-sm" onClick={() => remove(r)}>
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
