import { normalizeMemberNetworkAssignment } from '@/lib/memberNetworkAssignment'
import { supabase } from '@/lib/supabase'
import { getCroppedImg } from '@/lib/imageUtils'
import { adminService } from '@/services/adminService'
import { discordService } from '@/services/discordService'
import { sessionStore } from '@/lib/sessionStore'
import type { RegistrationFormData } from '@/types/registration'
import type { Area } from 'react-easy-crop'

function normalizeRegistrationPhone(countryCode: string, contactNumber: string): string {
  const raw = contactNumber.trim().replace(/\s+/g, '')
  if (raw.startsWith('+')) return raw
  return `${countryCode}${raw.replace(/^0+/, '')}`
}

export function duplicateRegistrationMessage(
  field: 'email' | 'phone',
  authEmail: string | null,
  countryCode: string,
  contactNumber: string
): string {
  if (field === 'email') {
    return `An account with the email "${authEmail}" already exists. Please sign in with your email and password instead.`
  }

  return `An account with the phone number "${countryCode} ${contactNumber}" already exists. Please sign in with your phone number and password instead.`
}

async function findDuplicateRegistration(
  phoneNumber: string,
  authEmail: string | null
): Promise<'email' | 'phone' | null> {
  const [phoneRes, emailRes] = await Promise.all([
    supabase.from('users').select('phone_number').eq('phone_number', phoneNumber).limit(1),
    authEmail
      ? supabase.from('users').select('email').ilike('email', authEmail).limit(1)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (phoneRes.error) throw phoneRes.error
  if (emailRes.error) throw emailRes.error
  if (emailRes.data?.length) return 'email'
  if (phoneRes.data?.length) return 'phone'
  return null
}

export interface SubmitConfig {
  platform: string
  formData: RegistrationFormData
  photoUrl?: string | null
  selfieUrl?: string | null
  croppedAreaPixels?: Area | null
  usedScan: boolean
  refParam: string | null
  registeredBy?: string | null
}

export interface SubmitResult {
  regNo: string
  finalAvatarUrl: string | null
}

export const registrationService = {
  async submit(config: SubmitConfig): Promise<SubmitResult> {
    const { platform, formData, photoUrl, selfieUrl, croppedAreaPixels, usedScan, refParam } =
      config

    const authEmail = formData.email ? formData.email.trim() : null
    const cleanPhone = normalizeRegistrationPhone(formData.countryCode, formData.contactNumber)
    const duplicate = await findDuplicateRegistration(cleanPhone, authEmail)
    if (duplicate) {
      throw new Error(
        duplicateRegistrationMessage(
          duplicate,
          authEmail,
          formData.countryCode,
          formData.contactNumber
        )
      )
    }

    const yearStr = new Date().getFullYear().toString().slice(-2)
    const randomNum = String(Math.floor(1000 + Math.random() * 9000))
    const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`

    // 1. Determine auto-approval eligibility.
    // Photo upload is intentionally NOT required — gating on it kills conversion,
    // and it is a soft/optional verification step. Auto-approve when the required
    // steps pass: Ghana needs a constituency; Diaspora needs only a submitted form
    // (chapter assignment is optional). Flagged members are never created here.
    const ghanaReady = platform === 'GHANA' && !!formData.constituency
    const diasporaReady = platform === 'DIASPORA'
    const autoApproved = ghanaReady || diasporaReady
    const networkAssignment = normalizeMemberNetworkAssignment(platform, formData)

    // 2. Build the member profile row (avatar added afterwards, best-effort).
    const userRow = {
      national_id: formData.idNumber,
      // Normalize the name so scan/import artifacts (leading "1. ", double spaces)
      // don't leak into the record the way they did for the early bulk imports.
      full_name: formData.fullName
        .replace(/^\s*[0-9]+[.)]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim(),
      email: authEmail,
      registration_number: regNo,
      platform: networkAssignment.platform,
      country: networkAssignment.country,
      phone_number: cleanPhone,
      gender: formData.gender,
      region: networkAssignment.region,
      constituency: networkAssignment.constituency,
      chapter: networkAssignment.chapter,
      profession: formData.profession,
      job_industry_id: formData.job?.industryId ?? null,
      job_sub_category_id: formData.job?.subCategoryId ?? null,
      job_role_id: formData.job?.isOther ? null : (formData.job?.roleId ?? null),
      job_custom_title: formData.job?.isOther ? formData.job.customTitle.trim() || null : null,
      status: autoApproved ? 'Active' : 'Pending',
      verification_status: autoApproved ? 'Approved' : 'In Review',
      age_range: formData.ageRange,
      avatar_url: null,
      education_level: formData.educationLevel,
      emergency_name: formData.emergencyContactName,
      emergency_relationship: formData.emergencyRelationship,
      emergency_phone: formData.emergencyNumber,
      children_count: formData.children_count,
      residential_address: formData.residentialAddress,
      city: formData.city,
      registration_source: usedScan ? 'scan' : 'digital',
      referred_by: refParam || null,
      registered_by: config.registeredBy || null,
      voters_id_card: formData.votersIdCard || null,
      polling_station_code: formData.pollingStationCode || null,
    }

    // 3. Create the auth user AND the member row ATOMICALLY on the server. The
    //    edge function rolls back the auth user if the insert fails, so a failed
    //    attempt never leaves an orphaned account that blocks a retry.
    const { data: reg, error: fnError } = await supabase.functions.invoke('register-member', {
      body: {
        authEmail,
        phone: cleanPhone,
        password: formData.password,
        fullName: formData.fullName,
        userRow,
        refParam,
      },
    })

    // A non-2xx response surfaces as fnError with the JSON body on error.context.
    const regResult = (reg ??
      (await (fnError as { context?: Response })?.context?.json?.().catch(() => null))) as {
      success?: boolean
      error?: string
      field?: 'email' | 'phone'
      userId?: string
    } | null

    if (!regResult?.success) {
      if (regResult?.error === 'duplicate') {
        throw new Error(
          duplicateRegistrationMessage(
            regResult.field ?? (authEmail ? 'email' : 'phone'),
            authEmail,
            formData.countryCode,
            formData.contactNumber
          )
        )
      }
      throw new Error(
        regResult?.error || fnError?.message || 'Registration failed. Please try again.'
      )
    }

    const newUserId = regResult.userId as string

    // 4. Sign the new member in so the app has a session (mirrors the old signUp).
    const { data: authData } = await supabase.auth.signInWithPassword({
      password: formData.password!,
      ...(authEmail ? { email: authEmail } : { phone: cleanPhone }),
    })

    // 5. Upload avatar — optional, best-effort. The member already exists, so a
    //    failure here can never orphan anything; they can add a photo later.
    let finalAvatarUrl: string | null = null
    const avatarSource = selfieUrl || photoUrl
    if (avatarSource && authData?.user) {
      try {
        const croppedBlob = croppedAreaPixels
          ? await getCroppedImg(avatarSource, croppedAreaPixels)
          : await (await fetch(avatarSource)).blob()

        if (croppedBlob) {
          // Owner-folder path ({userId}/…) so it passes the avatars storage RLS.
          const fileName = adminService.generateAvatarPath(newUserId)
          const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
          if (!uploadError) {
            finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
            await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl } })
            await supabase.from('users').update({ avatar_url: finalAvatarUrl }).eq('id', newUserId)
          }
        }
      } catch (err) {
        console.error('Failed to process/upload avatar during registration:', err)
      }
    }

    discordService.memberRegistered(
      formData.fullName,
      platform,
      platform === 'GHANA' ? formData.region || '' : formData.country || '',
      regNo
    )

    // 4. Store session details in sessionStorage (tab-scoped, not persisted cross-session)
    sessionStore.setItem('isLoggedIn', 'true')
    sessionStore.setItem('userRegNo', regNo)
    sessionStore.setItem('userName', formData.fullName)
    sessionStore.setItem('userPlatform', platform)
    if (finalAvatarUrl) {
      sessionStore.setItem('userAvatar', finalAvatarUrl)
    }
    window.dispatchEvent(new Event('storage'))

    return {
      regNo,
      finalAvatarUrl,
    }
  },
}
