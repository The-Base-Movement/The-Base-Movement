import { useState, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { sessionStore } from '@/lib/sessionStore'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { memberService } from '@/services/memberService'
import { authService } from '@/services/authService'
import { userActivityService } from '@/services/userActivityService'
import { dataURLtoBlob, getCroppedImg } from '@/lib/imageUtils'
import { toast } from 'sonner'
import { cleanPhoneInput } from '@/lib/phoneValidation'
import { getDistrictForConstituency } from '@/lib/pollingCascade'
import { usePerformance } from '@/context/PerformanceContext'
import { MembershipCardPanel } from './settings/MembershipCardPanel'
import { VerificationStatusPanel } from './settings/VerificationStatusPanel'
import { VoterRegistrationPanel } from './settings/VoterRegistrationPanel'
import { PersonalInfoForm } from './settings/PersonalInfoForm'
import { KycDocuments } from '@/components/KycDocuments'
import {
  jobTaxonomyService,
  emptyJobSelection,
  type JobSelection,
} from '@/services/jobTaxonomyService'
import { PerformancePrefsPanel } from './settings/PerformancePrefsPanel'
import { ProfileSettingsHeader } from './settings/ProfileSettingsHeader'
import { DangerZonePanel } from './settings/DangerZonePanel'
import { NotificationsPanel } from './settings/NotificationsPanel'
import MonthlyDuesNotificationSettings from '@/components/settings/MonthlyDuesNotificationSettings'

interface FormState {
  fullName: string
  nationalId: string
  votersIdCard: string
  email: string
  phone: string
  countryCode: string
  region: string
  constituency: string
  district: string
  profession: string
  bio: string
  gender: string
  birthYear: string
  religion: string
  partyAffiliation: string
  secondaryPhone: string
  secondaryCountryCode: string
  joinedDate: string
  status: string
  chapter: string
  country: string
  city: string
  digitalAddress: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatLocalPhone(value: string, countryCode: string) {
  const digits = onlyDigits(value).replace(/^0+/, '')
  if (!digits) return ''
  if (countryCode === '+233' && digits.length === 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

function getDialingCodeForCountry(
  country: string,
  countries: { name: string; dialing_code: string; is_diaspora: boolean }[],
  phone: string
) {
  const countryCode = countries.find((c) => c.name === country)?.dialing_code
  if (countryCode) return countryCode

  const normalizedPhone = phone.replace(/\s+/g, '')
  const matchedCode = countries
    .map((c) => c.dialing_code)
    .concat('+233')
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .find((code) => normalizedPhone.startsWith(code))

  return matchedCode || '+233'
}

function splitProfilePhone(
  phone: string,
  country: string,
  countries: { name: string; dialing_code: string; is_diaspora: boolean }[]
) {
  const countryCode = getDialingCodeForCountry(country, countries, phone)
  const phoneDigits = onlyDigits(phone)
  const codeDigits = onlyDigits(countryCode)
  const localDigits = phoneDigits.startsWith(codeDigits)
    ? phoneDigits.slice(codeDigits.length).replace(/^0+/, '')
    : phoneDigits.replace(/^0+/, '')

  return {
    countryCode,
    phone: formatLocalPhone(localDigits, countryCode),
  }
}

function normalizeProfilePhone(countryCode: string, phone: string) {
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`
  const codeDigits = onlyDigits(code)
  let localDigits = onlyDigits(phone)

  if (localDigits.startsWith(codeDigits)) {
    localDigits = localDigits.slice(codeDigits.length)
  }

  return `${code}${localDigits.replace(/^0+/, '')}`
}

const modalLabelStyle: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
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
  const [authId, setAuthId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState('')

  const [form, setForm] = useState<FormState>({
    fullName: '',
    nationalId: '',
    votersIdCard: '',
    email: '',
    phone: '',
    countryCode: '+233',
    region: '',
    constituency: '',
    district: '',
    profession: '',
    bio: '',
    gender: 'Male / 26-35',
    birthYear: '',
    religion: '',
    partyAffiliation: '',
    secondaryPhone: '',
    secondaryCountryCode: '+233',
    joinedDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: 'Active Member',
    chapter: '',
    country: userPlatform === 'GHANA' ? 'Ghana' : '',
    city: '',
    digitalAddress: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
  })

  const [job, setJob] = useState<JobSelection>(emptyJobSelection)
  const [availableChapters, setAvailableChapters] = useState<string[]>([])
  const [dbCountries, setDbCountries] = useState<
    { name: string; dialing_code: string; is_diaspora: boolean }[]
  >([])
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null)
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 })
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarRotation, setAvatarRotation] = useState(0)
  const [avatarCropPixels, setAvatarCropPixels] = useState<Area | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)

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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setAuthId(user?.id ?? null)

      let profile = regNo ? await adminService.getMemberProfile(regNo) : null
      if (!profile && user?.id) {
        profile = await adminService.getMemberProfileByAuthId(user.id)
        if (profile?.id) sessionStore.setItem('userRegNo', profile.id)
      }

      if (!profile) {
        setLoading(false)
        return
      }

      if (profile) {
        setAccountName(profile.name)
        const profileCountry = profile.country || (userPlatform === 'GHANA' ? 'Ghana' : '')
        const phoneParts = splitProfilePhone(profile.phone || '', profileCountry, uniqueCountries)
        const secondaryParts = splitProfilePhone(
          profile.secondaryPhone || '',
          profileCountry,
          uniqueCountries
        )
        // District is read-only/DB-derived: prefer the stored value, else resolve
        // it from the (locked) region + constituency. May stay blank if unresolved.
        let district = profile.district || ''
        if (!district && profile.region && profile.constituency) {
          district = (await getDistrictForConstituency(profile.region, profile.constituency)) || ''
        }
        setForm({
          fullName: profile.name,
          nationalId: profile.nationalId || '',
          votersIdCard: profile.votersIdCard || '',
          email: profile.email || '',
          phone: phoneParts.phone,
          countryCode: phoneParts.countryCode,
          region: profile.region || '',
          constituency: profile.constituency || '',
          district,
          profession: profile.profession || 'Member',
          bio: '',
          gender:
            profile.gender && profile.ageRange
              ? `${profile.gender} / ${profile.ageRange}`
              : 'Male / 26-35',
          birthYear: profile.birthYear ? String(profile.birthYear) : '',
          religion: profile.religion || '',
          partyAffiliation: profile.partyAffiliation || '',
          secondaryPhone: secondaryParts.phone,
          secondaryCountryCode: secondaryParts.countryCode,
          joinedDate: profile.joined,
          status: profile.status === 'Active' ? 'Active Member' : profile.status,
          chapter: profile.chapter || '',
          country: profileCountry,
          city: profile.city || '',
          digitalAddress: profile.digitalAddress || '',
          emergencyName: profile.emergencyName || '',
          emergencyRelationship: profile.emergencyRelationship || '',
          emergencyPhone: profile.emergencyPhone || '',
        })
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl)
          sessionStore.setItem('userAvatar', profile.avatarUrl)
        }

        // national_id is encrypted + column-locked, so it isn't returned by the
        // profile select — decrypt the member's own value via a self-scoped RPC.
        const ownNid = await memberService.getOwnNationalId()
        if (ownNid) setForm((f) => ({ ...f, nationalId: ownNid }))

        // Preload the saved job selection for editing.
        const { data: jobRow } = await supabase
          .from('users')
          .select('job_industry_id, job_sub_category_id, job_role_id, job_custom_title')
          .eq('registration_number', profile.id)
          .maybeSingle()
        if (jobRow) setJob(jobTaxonomyService.toSelection(jobRow))
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
        setAvatarDraftUrl(result)
        setAvatarCrop({ x: 0, y: 0 })
        setAvatarZoom(1)
        setAvatarRotation(0)
        setAvatarCropPixels(null)
      })
      reader.readAsDataURL(e.target.files[0])
      e.target.value = ''
    }
  }

  const handleApplyAvatarCrop = async () => {
    if (!avatarDraftUrl) return
    setAvatarSaving(true)
    try {
      const blob = avatarCropPixels
        ? await getCroppedImg(avatarDraftUrl, avatarCropPixels, avatarRotation)
        : await (await fetch(avatarDraftUrl)).blob()
      if (!blob) throw new Error('Unable to crop selected image')

      // Persist the photo immediately so it is saved even if the member never
      // clicks "Save" on the profile form (the uploader lives in a separate
      // panel from the form). The avatars bucket RLS keys writes to a folder
      // named after the auth user id, so the path must be {userId}/….
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      const regNo = sessionStore.getItem('userRegNo')
      if (!authUser || !regNo) {
        toast.error('Your session has expired. Please sign in again.')
        return
      }

      const previousAvatarUrl = avatarUrl
      const fileName = adminService.generateAvatarPath(authUser.id)
      const { error: uploadError } = await adminService.uploadAvatar(fileName, blob)
      if (uploadError) {
        toast.error('Failed to upload profile photo. Please try again.')
        return
      }
      const publicUrl = adminService.getAvatarPublicUrl(fileName)

      await adminService.updateMemberProfile(regNo, { avatarUrl: publicUrl })

      // Remove the superseded photo so old files don't pile up in storage.
      // Best-effort; only runs after the new avatar is safely persisted.
      await adminService.deleteAvatarByPublicUrl(previousAvatarUrl)

      setAvatarUrl(publicUrl)
      sessionStore.setItem('userAvatar', publicUrl)
      window.dispatchEvent(new Event('storage'))
      setAvatarDraftUrl(null)
      toast.success('Profile photo updated')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save profile photo. Please try again.'
      )
    } finally {
      setAvatarSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    let val = value
    if (field === 'phone') {
      val = cleanPhoneInput(val, form.countryCode)
    } else if (field === 'secondaryPhone') {
      val = cleanPhoneInput(val, form.secondaryCountryCode)
    }
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const regNo = sessionStore.getItem('userRegNo')
    if (!regNo) return

    if (!form.partyAffiliation) {
      toast.error('Party affiliation / CSO is required.')
      return
    }

    if (form.emergencyName) {
      const nameClean = form.emergencyName.trim()
      if (!/^[\p{L}\s'-]+$/u.test(nameClean)) {
        toast.error(
          'Emergency contact name can only contain letters, spaces, hyphens, and apostrophes.'
        )
        return
      }
    }

    setLoading(true)
    let finalAvatarUrl = avatarUrl
    const normalizedPhone = normalizeProfilePhone(form.countryCode, form.phone)
    const normalizedSecondary = form.secondaryPhone.trim()
      ? normalizeProfilePhone(form.secondaryCountryCode, form.secondaryPhone)
      : ''

    if (avatarUrl && avatarUrl.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(avatarUrl)
        if (blob) {
          // The avatars bucket RLS keys writes to a folder named after the auth
          // user id, so the path must be {userId}/…, not the registration number.
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()
          if (!authUser) {
            toast.error('Your session has expired. Please sign in again.')
            setLoading(false)
            return
          }
          const fileName = adminService.generateAvatarPath(authUser.id)
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
        setLoading(false)
        return
      }
    }

    try {
      await adminService.updateMemberProfile(regNo, {
        name: form.fullName,
        nationalId: form.nationalId.trim(),
        votersIdCard: form.votersIdCard.trim(),
        email: form.email,
        phone: normalizedPhone,
        // When a birth year is set, age_range is DB-derived — send gender only so
        // memberService doesn't overwrite the trigger-computed age_range.
        gender: form.birthYear ? form.gender.split(' / ')[0] : form.gender,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        religion: form.religion,
        partyAffiliation: form.partyAffiliation,
        secondaryPhone: normalizedSecondary,
        district: form.district,
        // Chapter is Diaspora-only; Ghana Network members are organised by constituency
        ...(userPlatform !== 'GHANA' && { chapter: form.chapter }),
        avatarUrl: finalAvatarUrl || undefined,
        profession: form.profession,
        country: form.country,
        city: form.city,
        digitalAddress: form.digitalAddress,
        emergencyName: form.emergencyName,
        emergencyRelationship: form.emergencyRelationship,
        emergencyPhone: form.emergencyPhone,
        job,
      })
      await authService.updateProfile({
        full_name: form.fullName,
        avatar_url: finalAvatarUrl || undefined,
        phone: normalizedPhone,
      })
      if (finalAvatarUrl) {
        setAvatarUrl(finalAvatarUrl)
      }

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
          {authId && <KycDocuments userId={authId} />}
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
            job={job}
            onJobChange={setJob}
          />

          <PerformancePrefsPanel
            lowBandwidthMode={lowBandwidthMode}
            onToggle={() => setLowBandwidthMode(!lowBandwidthMode)}
          />

          <NotificationsPanel />

          <MonthlyDuesNotificationSettings />

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

          <DangerZonePanel fullName={accountName} />
        </form>
      </div>

      {avatarDraftUrl && (
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
          onClick={() => setAvatarDraftUrl(null)}
        >
          <div
            className="panel"
            style={{
              width: 'min(440px, 100%)',
              overflow: 'hidden',
              background: 'hsl(var(--background))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ph">
              <h3>Crop profile photo</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAvatarDraftUrl(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
            <div
              style={{
                position: 'relative',
                height: 320,
                background: 'hsl(var(--on-surface))',
              }}
            >
              <Cropper
                image={avatarDraftUrl}
                crop={avatarCrop}
                zoom={avatarZoom}
                rotation={avatarRotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setAvatarCrop}
                onCropComplete={(_area, areaPixels) => setAvatarCropPixels(areaPixels)}
                onZoomChange={setAvatarZoom}
                onRotationChange={setAvatarRotation}
              />
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <label htmlFor="avatar-zoom" style={{ ...modalLabelStyle, margin: 0 }}>
                  Zoom
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setAvatarRotation((r) => (r - 90 + 360) % 360)}
                    title="Rotate 90° Left"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      rotate_left
                    </span>
                    Left
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setAvatarRotation((r) => (r + 90) % 360)}
                    title="Rotate 90° Right"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      rotate_right
                    </span>
                    Right
                  </button>
                </div>
              </div>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={avatarZoom}
                onChange={(e) => setAvatarZoom(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAvatarDraftUrl(null)}
                  disabled={avatarSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyAvatarCrop}
                  disabled={avatarSaving}
                >
                  {avatarSaving ? 'Saving…' : 'Apply photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
