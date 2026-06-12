import { supabase } from '@/lib/supabase'
import { getCroppedImg } from '@/lib/imageUtils'
import { adminService } from '@/services/adminService'
import { discordService } from '@/services/discordService'
import { sessionStore } from '@/lib/sessionStore'
import type { RegistrationFormData } from '@/types/registration'
import type { Area } from 'react-easy-crop'

export interface SubmitConfig {
  platform: string
  formData: RegistrationFormData
  photoUrl?: string | null
  selfieUrl?: string | null
  croppedAreaPixels?: Area | null
  usedScan: boolean
  refParam: string | null
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
    const cleanPhone =
      formData.countryCode + formData.contactNumber.replace(/^0+/, '').replace(/\s+/g, '')
    const dummyEmail = `${cleanPhone.replace('+', '')}@thebase.org`
    const finalAuthEmail = authEmail || dummyEmail

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: finalAuthEmail,
      password: formData.password!,
      options: { data: { full_name: formData.fullName } },
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered')) {
        throw new Error(
          'An account with this primary phone number (or email) already exists. Try signing in instead.'
        )
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
          const fileName = adminService.generateAvatarPath(regNo)
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

    // 3. Insert user profile into database
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
      status: 'Pending',
      verification_status: 'In Review',
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
