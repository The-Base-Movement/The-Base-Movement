import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { sessionStore } from '@/lib/sessionStore'
import { toast } from 'sonner'

// Nudge new members to add a profile photo (the one thing missing after
// registration) and reward completion with a 100% "Verified" badge. The photo
// upload reuses the same avatar helpers as the Settings page.

const DISMISS_KEY = 'profile_photo_prompt_dismissed'

interface Props {
  avatarUrl?: string | null
  regNo: string
  hasCoreDetails: boolean
}

export function ProfileCompletion({ avatarUrl, regNo, hasCoreDetails }: Props) {
  const [avatar, setAvatar] = useState<string | null>(avatarUrl ?? null)
  // First-time nudge: open automatically when the photo is missing and the member
  // hasn't dismissed it before. Computed at mount (no effect → no cascading render).
  const [modalOpen, setModalOpen] = useState(
    () => !avatarUrl && typeof window !== 'undefined' && !localStorage.getItem(DISMISS_KEY)
  )
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const checks = [
    { label: 'Account created', done: true },
    { label: 'Registration details', done: hasCoreDetails },
    { label: 'Profile photo', done: !!avatar },
  ]
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)
  const complete = pct === 100

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setModalOpen(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      const fileName = adminService.generateAvatarPath(user.id)
      const { error } = await adminService.uploadAvatar(fileName, file)
      if (error) throw error
      const publicUrl = adminService.getAvatarPublicUrl(fileName)
      await adminService.updateMemberProfile(regNo, { avatarUrl: publicUrl })
      setAvatar(publicUrl)
      sessionStore.setItem('userAvatar', publicUrl)
      window.dispatchEvent(new Event('storage')) // refresh sidebar/topbar avatar
      localStorage.setItem(DISMISS_KEY, '1')
      setModalOpen(false)
      toast.success("Profile photo added — you're 100% verified!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (complete) {
    return (
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          marginBottom: 'var(--stack-md, 24px)',
          background: 'hsl(var(--primary) / 0.06)',
          border: '1px solid hsl(var(--primary) / 0.25)',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 26, color: 'hsl(var(--primary))' }}
        >
          verified
        </span>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Profile 100% complete
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Your profile is verified and complete.
          </p>
        </div>
        <span className="pill pill-ok" style={{ marginLeft: 'auto', fontSize: 11 }}>
          Verified
        </span>
      </div>
    )
  }

  return (
    <>
      <div
        className="panel"
        style={{
          padding: '16px 18px',
          marginBottom: 'var(--stack-md, 24px)',
          background: 'hsl(var(--accent) / 0.06)',
          border: '1px solid hsl(var(--accent) / 0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 24, color: 'hsl(var(--accent))' }}
          >
            account_circle
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Your profile is {pct}% complete
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Add a profile photo to reach 100% and get your verified badge.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
              add_a_photo
            </span>
            Add photo
          </button>
        </div>
        {/* Progress bar */}
        <div
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 'var(--radius-pill)',
            background: 'hsl(var(--border))',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'hsl(var(--accent))',
              transition: 'width .3s',
            }}
          />
        </div>
      </div>

      {modalOpen &&
        createPortal(
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
            onClick={dismiss}
          >
            <div
              className="panel"
              style={{ width: '100%', maxWidth: 420, padding: 24, textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: 'hsl(var(--accent))', display: 'block' }}
              >
                add_a_photo
              </span>
              <h3
                style={{
                  margin: '12px 0 6px',
                  fontSize: 17,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Complete your profile
              </h3>
              <p
                style={{
                  margin: '0 0 18px',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.55,
                }}
              >
                Your profile is {pct}% complete. Add a profile photo to reach 100% and earn your
                verified badge.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ width: '100%', marginBottom: 8 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, marginRight: 6 }}
                >
                  upload
                </span>
                {uploading ? 'Uploading…' : 'Upload a photo'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={dismiss}
                disabled={uploading}
                style={{ width: '100%' }}
              >
                Maybe later
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
