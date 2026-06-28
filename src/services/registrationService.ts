import { supabase } from '@/lib/supabase'
import { getCroppedImg } from '@/lib/imageUtils'
import { adminService } from '@/services/adminService'
import { discordService } from '@/services/discordService'
import { sessionStore } from '@/lib/sessionStore'
import type { RegistrationFormData } from '@/types/registration'
import type { Area } from 'react-easy-crop'

async function getDummyEmail(phone: string): Promise<string> {
  const clean = phone.replace('+', '').trim()
  const msgBuffer = new TextEncoder().encode(clean)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hashHex.slice(0, 16)}@thebase.org`
}

function normalizeRegistrationPhone(countryCode: string, contactNumber: string): string {
  const raw = contactNumber.trim().replace(/\s+/g, '')
  if (raw.startsWith('+')) return raw
  return `${countryCode}${raw.replace(/^0+/, '')}`
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

    const yearStr = new Date().getFullYear().toString().slice(-2)
    const randomNum = String(Math.floor(1000 + Math.random() * 9000))
    const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`

    const authEmail = formData.email ? formData.email.trim() : null
    const cleanPhone = normalizeRegistrationPhone(formData.countryCode, formData.contactNumber)
    const dummyEmail = await getDummyEmail(cleanPhone)
    const finalAuthEmail = authEmail || dummyEmail

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: finalAuthEmail,
      password: formData.password!,
      options: { data: { full_name: formData.fullName } },
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered')) {
        const usedEmail = authEmail && finalAuthEmail === authEmail
        if (usedEmail) {
          throw new Error(
            `An account with the email "${authEmail}" already exists. Please sign in with your email and password instead.`
          )
        } else {
          const displayPhone = formData.countryCode + ' ' + formData.contactNumber
          throw new Error(
            `An account with the phone number "${displayPhone}" already exists. Please sign in with your phone number and password instead.`
          )
        }
      }
      if (authError.status === 429 || authError.message?.toLowerCase().includes('rate')) {
        const seconds = authError.message?.match(/(\d+)\s*second/)?.[1] || '60'
        throw new Error(`RATE_LIMIT:${seconds}`)
      }
      throw authError
    }

    // 2. Upload avatar if photo/selfie exists
    let finalAvatarUrl = null
    const avatarSource = selfieUrl || photoUrl
    if (avatarSource && authData.user) {
      try {
        const croppedBlob = croppedAreaPixels
          ? await getCroppedImg(avatarSource, croppedAreaPixels)
          : await (await fetch(avatarSource)).blob()

        if (croppedBlob) {
          // Owner-folder path ({userId}/…) so it passes the avatars storage RLS.
          const fileName = adminService.generateAvatarPath(authData.user.id)
          const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
          if (!uploadError) {
            finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
            await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl } })
          }
        }
      } catch (err) {
        console.error('Failed to process/upload avatar during registration service execution:', err)
      }
    }

    // 3. Determine auto-approval eligibility
    const hasPhoto = !!finalAvatarUrl
    const ghanaReady = platform === 'GHANA' && hasPhoto && !!formData.constituency
    const diasporaReady = platform === 'DIASPORA' && hasPhoto
    const autoApproved = ghanaReady || diasporaReady

    // 4. Insert user profile into database
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user?.id,
      national_id: formData.idNumber,
      full_name: formData.fullName,
      email: authEmail,
      registration_number: regNo,
      platform,
      country: formData.country,
      phone_number: cleanPhone,
      gender: formData.gender,
      region: formData.region,
      constituency: formData.constituency,
      chapter: formData.chapter,
      profession: formData.profession,
      job_industry_id: formData.job?.industryId ?? null,
      job_sub_category_id: formData.job?.subCategoryId ?? null,
      job_role_id: formData.job?.isOther ? null : (formData.job?.roleId ?? null),
      job_custom_title: formData.job?.isOther ? formData.job.customTitle.trim() || null : null,
      status: autoApproved ? 'Active' : 'Pending',
      verification_status: autoApproved ? 'Approved' : 'In Review',
      age_range: formData.ageRange,
      avatar_url: finalAvatarUrl,
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
    })

    if (dbError) throw dbError

    // Award referral points to the referrer — fire-and-forget, must not block registration
    if (refParam && authData.user?.id) {
      const memberId = authData.user.id
      ;(async () => {
        try {
          const { error } = await supabase.rpc('award_referral_points', {
            p_new_member_id: memberId,
          })
          if (error) console.warn('[referral] registration points RPC failed:', error)
        } catch {
          // non-critical — registration already succeeded
        }
      })()
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
