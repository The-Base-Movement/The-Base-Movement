/**
 * OfficialForm — full-page add/edit for a party official.
 * -------------------------------------------------------------
 * Replaces the old OfficialModal. Three-column layout:
 *   left   → avatar + social links
 *   middle → TinyMCE biography editor (rich HTML)
 *   right  → core details (name, role, tier, region, order)
 * Routed at /admin/party-officials/new and /admin/party-officials/:id/edit,
 * returning to the list on save/cancel.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Editor } from '@tinymce/tinymce-react'
import { toast } from 'sonner'
import { contentService } from '@/services/contentService'
import { partyOfficialsService } from '@/services/partyOfficialsService'
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { inputSt, type PartyOfficial, type PartyTier } from './utils'

const LIST_PATH = '/admin/party-officials'

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-semibold, 600)',
  marginBottom: 6,
}

const SOCIAL_FIELDS: {
  key: keyof PartyOfficial
  label: string
  icon: string
  type?: string
}[] = [
  { key: 'facebook_url', label: 'Facebook URL', icon: 'group' },
  { key: 'instagram_url', label: 'Instagram URL', icon: 'photo_camera' },
  { key: 'twitter_url', label: 'Twitter / X URL', icon: 'tag' },
  { key: 'linkedin_url', label: 'LinkedIn URL', icon: 'work' },
  { key: 'email', label: 'Email', icon: 'mail', type: 'email' },
]

const EMPTY: Partial<PartyOfficial> = {
  name: '',
  role: '',
  tier: '',
  region: '',
  bio: '',
  avatar_url: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  linkedin_url: '',
  email: '',
  order_index: 0,
}

export default function OfficialForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isDark = useIsDarkTheme()
  const isEditing = !!id

  const [tiers, setTiers] = useState<PartyTier[]>([])
  const [formData, setFormData] = useState<Partial<PartyOfficial>>(EMPTY)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    partyOfficialsService
      .getTiers()
      .then(setTiers)
      .catch(() => {})
    if (!id) return
    partyOfficialsService
      .getOfficialById(id)
      .then((official) => {
        if (official) setFormData(official)
        else {
          toast.error('Official not found')
          navigate(LIST_PATH)
        }
      })
      .catch(() => toast.error('Failed to load official'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const set = (patch: Partial<PartyOfficial>) => setFormData((prev) => ({ ...prev, ...patch }))

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, 'party-officials')
      if (url) {
        set({ avatar_url: url })
        toast.success('Image uploaded to media library')
      } else toast.error('Upload failed')
    } catch {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.role) {
      toast.error('Name and role are required')
      return
    }
    const payload = {
      name: formData.name,
      role: formData.role,
      tier: formData.tier,
      region: formData.region || null,
      bio: formData.bio || null,
      avatar_url: formData.avatar_url || null,
      facebook_url: formData.facebook_url || null,
      instagram_url: formData.instagram_url || null,
      twitter_url: formData.twitter_url || null,
      linkedin_url: formData.linkedin_url || null,
      email: formData.email || null,
      order_index: formData.order_index || 0,
    }
    setSaving(true)
    try {
      if (isEditing && id) {
        await partyOfficialsService.updateOfficial(id, payload)
        toast.success('Official updated')
      } else {
        await partyOfficialsService.createOfficial(payload)
        toast.success('Official created')
      }
      navigate(LIST_PATH)
    } catch {
      toast.error(isEditing ? 'Failed to update official' : 'Failed to create official')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title={isEditing ? 'Edit Official' : 'Add Official'}
        icon="badge"
        description="Structure the biography with the rich editor. Social links sit on the left, core details on the right."
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => navigate(LIST_PATH)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              arrow_back
            </span>
            Back to Officials
          </button>
        }
      />

      {loading ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>Loading…</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1fr) minmax(360px, 2fr) minmax(220px, 1fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Left — avatar + social links */}
            <div
              className="panel"
              style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label htmlFor="official-avatar" style={labelSt}>
                  Avatar Image
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {formData.avatar_url && (
                    <img
                      src={formData.avatar_url}
                      alt="Preview"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        background: 'hsl(var(--container-low))',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <input
                    id="official-avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={isUploading}
                    style={{ fontSize: 12, width: '100%' }}
                  />
                </div>
                {isUploading && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 4,
                      display: 'block',
                    }}
                  >
                    Uploading to media library…
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  borderTop: '1px solid hsl(var(--border))',
                  paddingTop: 14,
                }}
              >
                Social Links
              </div>

              {SOCIAL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`official-${f.key}`} style={labelSt}>
                    {f.label} (Optional)
                  </label>
                  <input
                    id={`official-${f.key}`}
                    name={f.key}
                    type={f.type || 'text'}
                    autoComplete={f.type === 'email' ? 'email' : 'url'}
                    style={inputSt}
                    value={(formData[f.key] as string) || ''}
                    onChange={(e) => set({ [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* Middle — biography editor */}
            <div
              className="panel"
              style={{ padding: 18, display: 'flex', flexDirection: 'column' }}
            >
              <label style={labelSt}>Biography</label>
              <Editor
                key={`${id ?? 'new'}-${isDark ? 'dark' : 'light'}`}
                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                value={formData.bio ?? ''}
                onEditorChange={(content) => set({ bio: content })}
                init={{
                  height: 560,
                  menubar: false,
                  plugins: [
                    'advlist',
                    'autolink',
                    'lists',
                    'link',
                    'image',
                    'charmap',
                    'preview',
                    'searchreplace',
                    'visualblocks',
                    'insertdatetime',
                    'table',
                    'wordcount',
                  ],
                  toolbar:
                    'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link image | removeformat',
                  statusbar: false,
                  content_style: isDark
                    ? 'body { font-family: "Public Sans", sans-serif; font-size:15px; color:#f1f5f9; line-height:1.7; background:#0f1110; }'
                    : 'body { font-family: "Public Sans", sans-serif; font-size:15px; color:#1f2520; line-height:1.7; background:white; }',
                  skin: isDark ? 'oxide-dark' : 'oxide',
                  content_css: isDark ? 'dark' : 'default',
                  branding: false,
                  images_upload_handler: async (blobInfo: {
                    blob: () => Blob
                    filename: () => string
                  }) => {
                    const file = new File([blobInfo.blob()], blobInfo.filename(), {
                      type: blobInfo.blob().type,
                    })
                    const url = await contentService.uploadImage(file, 'party-officials')
                    if (!url) throw new Error('Upload failed')
                    return url
                  },
                }}
              />
            </div>

            {/* Right — core details */}
            <div
              className="panel"
              style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label htmlFor="official-name" style={labelSt}>
                  Name
                </label>
                <input
                  id="official-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  style={inputSt}
                  value={formData.name || ''}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="official-role" style={labelSt}>
                  Role
                </label>
                <input
                  id="official-role"
                  name="role"
                  type="text"
                  required
                  autoComplete="organization-title"
                  style={inputSt}
                  value={formData.role || ''}
                  onChange={(e) => set({ role: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="official-tier" style={labelSt}>
                  Tier
                </label>
                <select
                  id="official-tier"
                  name="tier"
                  required
                  style={{ ...inputSt, padding: '0 8px' }}
                  value={formData.tier || ''}
                  onChange={(e) => set({ tier: e.target.value })}
                >
                  <option value="" disabled>
                    Select a tier
                  </option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="official-region" style={labelSt}>
                  Region (Optional)
                </label>
                <input
                  id="official-region"
                  name="region"
                  type="text"
                  autoComplete="off"
                  style={inputSt}
                  value={formData.region || ''}
                  onChange={(e) => set({ region: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="official-order" style={labelSt}>
                  Order Index
                </label>
                <input
                  id="official-order"
                  name="order_index"
                  type="number"
                  style={inputSt}
                  value={formData.order_index ?? 0}
                  onChange={(e) => set({ order_index: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="panel"
            style={{ padding: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(LIST_PATH)}
              style={{ minWidth: 120, height: 42 }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: 160, height: 42 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Official'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
