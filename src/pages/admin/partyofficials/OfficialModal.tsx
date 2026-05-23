import { createPortal } from 'react-dom'
import { inputSt, type PartyOfficial, type PartyTier } from './utils'

interface OfficialModalProps {
  isEditing: boolean
  setIsModalOpen: (open: boolean) => void
  formData: Partial<PartyOfficial>
  setFormData: React.Dispatch<React.SetStateAction<Partial<PartyOfficial>>>
  tiers: PartyTier[]
  handleUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  isUploading: boolean
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export function OfficialModal({
  isEditing,
  setIsModalOpen,
  formData,
  setFormData,
  tiers,
  handleUploadImage,
  isUploading,
  handleSubmit,
}: OfficialModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        overflowY: 'auto',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={() => setIsModalOpen(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 4,
          width: '100%',
          maxWidth: 900,
          margin: 'auto',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--on-surface))',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 15,
                color: '#fff',
                margin: 0,
              }}
            >
              {isEditing ? 'Edit Official' : 'Add Official'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              close
            </span>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24,
              }}
            >
              {/* Column 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label
                    htmlFor="official-name"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Name
                  </label>
                  <input
                    id="official-name"
                    name="name"
                    required
                    style={inputSt}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-role"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Role
                  </label>
                  <input
                    id="official-role"
                    name="role"
                    required
                    style={inputSt}
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-tier"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Tier
                  </label>
                  <select
                    id="official-tier"
                    name="tier"
                    required
                    style={{ ...inputSt, padding: '0 8px' }}
                    value={formData.tier || ''}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
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
                  <label
                    htmlFor="official-region"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Region (Optional)
                  </label>
                  <input
                    id="official-region"
                    name="region"
                    style={inputSt}
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label
                    htmlFor="official-bio"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Biography (Optional)
                  </label>
                  <textarea
                    id="official-bio"
                    name="bio"
                    style={{
                      ...inputSt,
                      flex: 1,
                      minHeight: 120,
                      padding: '12px',
                      resize: 'vertical',
                    }}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-avatar"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Avatar Image
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {formData.avatar_url && (
                      <img
                        src={formData.avatar_url}
                        alt="Preview"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          background: '#ccc',
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
                      Uploading to media library...
                    </span>
                  )}
                </div>
              </div>

              {/* Column 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label
                    htmlFor="official-facebook"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Facebook URL (Optional)
                  </label>
                  <input
                    id="official-facebook"
                    name="facebook_url"
                    style={inputSt}
                    value={formData.facebook_url || ''}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-instagram"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Instagram URL (Optional)
                  </label>
                  <input
                    id="official-instagram"
                    name="instagram_url"
                    style={inputSt}
                    value={formData.instagram_url || ''}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-twitter"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Twitter URL (Optional)
                  </label>
                  <input
                    id="official-twitter"
                    name="twitter_url"
                    style={inputSt}
                    value={formData.twitter_url || ''}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-linkedin"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    id="official-linkedin"
                    name="linkedin_url"
                    style={inputSt}
                    value={formData.linkedin_url || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="official-email"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      marginBottom: 6,
                    }}
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="official-email"
                    name="email"
                    type="email"
                    style={inputSt}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                borderTop: '1px solid hsl(var(--border))',
                paddingTop: 20,
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, height: 42 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 42 }}>
                {isEditing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
