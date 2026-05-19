import type { AdminUser } from '@/services/adminService'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
  avatarUrl: string
}

interface ProfileSettingsTabProps {
  profileForm: ProfileForm
  setProfileForm: (form: ProfileForm) => void
  isUploading: boolean
  isSaving: boolean
  adminData: AdminUser | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleAvatarClick: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveProfile: () => void
}

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 800,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

export function ProfileSettingsTab({
  profileForm,
  setProfileForm,
  isUploading,
  isSaving,
  adminData,
  fileInputRef,
  handleAvatarClick,
  handleFileChange,
  handleSaveProfile,
}: ProfileSettingsTabProps) {
  const initials =
    profileForm.fullName
      .split(' ')
      .map((n) => n[0])
      .join('') || 'HQ'
  const formatRole = (role: string) =>
    role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span>Profile</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Manage your public and internal administrative identity.
        </span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isUploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: 'hsl(var(--on-surface))' }}
                  >
                    progress_activity
                  </span>
                </div>
              )}
              {profileForm.avatarUrl ? (
                <img
                  src={profileForm.avatarUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  decoding="async"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {initials}
                </span>
              )}
            </div>
            <input
              type="file"
              id="avatar-upload"
              name="avatar-upload"
              aria-label="Upload profile avatar"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                photo_camera
              </span>
            </button>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Profile Image
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '3px 0 0',
              }}
            >
              PNG, JPG up to 2MB
            </p>
          </div>
        </div>

        {/* Form grid */}
        <div className="settings-form-grid">
          <div>
            <label htmlFor="input-1798f5" style={labelSt}>
              Full name
            </label>
            <input
              name="name-1798f5"
              id="input-1798f5"
              style={inputSt}
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="input-44682c" style={labelSt}>
              Email address
            </label>
            <input
              name="name-44682c"
              id="input-44682c"
              style={{ ...inputSt, opacity: 0.5, cursor: 'not-allowed' }}
              value={profileForm.email}
              disabled
            />
          </div>
          <div>
            <label style={labelSt}>Administrative role</label>
            <div
              style={{
                ...inputSt,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.6,
                cursor: 'default',
              }}
            >
              {adminData?.role ? formatRole(adminData.role) : 'HQ Officer'}
            </div>
          </div>
          <div>
            <label htmlFor="input-d429d4" style={labelSt}>
              Phone number
            </label>
            <input
              name="name-d429d4"
              id="input-d429d4"
              style={inputSt}
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+233 XX XXX XXXX"
            />
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid hsl(var(--border))',
            paddingTop: 20,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn btn-primary"
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{ minWidth: 180, justifyContent: 'center' }}
          >
            {isSaving ? 'Syncing…' : 'Synchronize Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
