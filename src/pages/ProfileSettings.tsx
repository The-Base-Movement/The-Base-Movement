import { useState, useEffect } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { userActivityService } from '@/services/userActivityService'
import { dataURLtoBlob } from '@/lib/imageUtils'
import { toast } from 'sonner'
import { usePerformance } from '@/context/PerformanceContext'
import { MembershipCardPanel } from './settings/MembershipCardPanel'
import { VerificationStatusPanel } from './settings/VerificationStatusPanel'
import { VoterRegistrationPanel } from './settings/VoterRegistrationPanel'
import { PersonalInfoForm } from './settings/PersonalInfoForm'
import { PerformancePrefsPanel } from './settings/PerformancePrefsPanel'
import { ProfileSettingsHeader } from './settings/ProfileSettingsHeader'
import { DangerZonePanel } from './settings/DangerZonePanel'
import { NotificationsPanel } from './settings/NotificationsPanel'

interface FormState {
  fullName: string
  email: string
  phone: string
  countryCode: string
  region: string
  constituency: string
  profession: string
  bio: string
  gender: string
  joinedDate: string
  status: string
  chapter: string
  country: string
  city: string
  residentialAddress: string
}

export default function ProfileSettings() {
  const { lowBandwidthMode, setLowBandwidthMode } = usePerformance()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    sessionStore.getItem('userAvatar')
  )
  const [userPlatform] = useState(() => sessionStore.getItem('userPlatform') || '')
  const [userRegNo] = useState(() => sessionStore.getItem('userRegNo') || '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+233',
    region: '',
    constituency: '',
    profession: '',
    bio: '',
    gender: 'Male / 26 - 40',
    joinedDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: 'Active Member',
    chapter: 'TBM Ghana Chapter',
    country: userPlatform === 'GHANA' ? 'Ghana' : '',
    city: '',
    residentialAddress: '',
  })

  const [availableChapters, setAvailableChapters] = useState<string[]>([])
  const [dbCountries, setDbCountries] = useState<
    { name: string; dialing_code: string; is_diaspora: boolean }[]
  >([])

  useEffect(() => {
    async function loadProfile() {
      const [chapters, countries] = await Promise.all([
        adminService.getChapters(),
        adminService.getCountries(),
      ])

      setAvailableChapters(chapters.map((c) => c.name))
      const uniqueCountries = Array.from(new Map(countries.map((c) => [c.name, c])).values())
      setDbCountries(uniqueCountries)

      const regNo = sessionStore.getItem('userRegNo')
      if (!regNo) {
        setLoading(false)
        return
      }

      const profile = await adminService.getMemberProfile(regNo)
      if (profile) {
        setForm({
          fullName: profile.name,
          email: profile.email || '',
          phone: profile.phone || '',
          countryCode: '+233',
          region: profile.region || '',
          constituency: profile.constituency || '',
          profession: profile.profession || 'Member',
          bio: '',
          gender:
            profile.gender && profile.ageRange
              ? `${profile.gender} / ${profile.ageRange}`
              : 'Male / 26 - 40',
          joinedDate: profile.joined,
          status: profile.status === 'Active' ? 'Active Member' : profile.status,
          chapter: profile.chapter || 'TBM Ghana Chapter',
          country: profile.country || (userPlatform === 'GHANA' ? 'Ghana' : ''),
          city: profile.city || '',
          residentialAddress: profile.residentialAddress || '',
        })
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl)
          sessionStore.setItem('userAvatar', profile.avatarUrl)
        }
      }

      setLoading(false)
    }
    loadProfile()
  }, [userPlatform])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || null
        setAvatarUrl(result)
        if (result) sessionStore.setItem('userAvatar', result)
        window.dispatchEvent(new Event('storage'))
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const regNo = sessionStore.getItem('userRegNo')
    if (!regNo) return

    setLoading(true)
    let finalAvatarUrl = avatarUrl

    if (avatarUrl && avatarUrl.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(avatarUrl)
        if (blob) {
          const fileName = adminService.generateAvatarPath(regNo)
          const { error: uploadError } = await adminService.uploadAvatar(fileName, blob)
          if (uploadError) {
            toast.error('Failed to upload profile photo. Please try again.')
            setLoading(false)
            return
          }
          finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
        }
      } catch {
        toast.error('Failed to upload profile photo')
      }
    }

    try {
      await adminService.updateMemberProfile(regNo, {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        chapter: form.chapter,
        avatarUrl: finalAvatarUrl || undefined,
        profession: form.profession,
        city: form.city,
        residentialAddress: form.residentialAddress,
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await userActivityService.logActivity(
          user.id,
          'profile_update',
          'Updated profile information'
        )
      }
      toast.success('Official Profile Synchronized')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 12,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 36,
            color: 'hsl(var(--primary))',
            animation: 'spin 1.2s linear infinite',
          }}
        >
          sync
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Syncing profile with HQ…
        </p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <ProfileSettingsHeader />

      <div className="profile-cols">
        {/* ── Left column ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MembershipCardPanel
            form={form}
            avatarUrl={avatarUrl}
            userRegNo={userRegNo}
            onAvatarChange={handleAvatarChange}
          />
          <VerificationStatusPanel />
          <VoterRegistrationPanel region={form.region} constituency={form.constituency} />
        </div>

        {/* ── Right column: form ────────────── */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PersonalInfoForm
            form={form}
            userRegNo={userRegNo}
            userPlatform={userPlatform}
            dbCountries={dbCountries}
            availableChapters={availableChapters}
            onChange={handleChange}
            onFormSet={setForm}
          />

          <PerformancePrefsPanel
            lowBandwidthMode={lowBandwidthMode}
            onToggle={() => setLowBandwidthMode(!lowBandwidthMode)}
          />

          <NotificationsPanel />

          {/* Save action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="submit" className="btn btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                lock_reset
              </span>
              Save changes
            </button>
            {saved && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'hsl(var(--primary))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 12,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  verified
                </span>
                Information synchronized
              </div>
            )}
          </div>

          <DangerZonePanel />
        </form>
      </div>
    </div>
  )
}
