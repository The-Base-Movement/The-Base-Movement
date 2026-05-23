import { useState } from 'react'
import type { Area } from 'react-easy-crop'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getCroppedImg } from '@/lib/imageUtils'
import { adminService } from '@/services/adminService'
import type { RegistrationFormData } from '@/types/registration'

interface SubmitConfig {
  platform: string
  formData: RegistrationFormData
  photoUrl: string | null
  selfieUrl: string | null
  croppedAreaPixels: Area | null
  usedScan: boolean
  refParam: string | null
}

export function useRegistrationSubmit() {
  const [isLoading, setIsLoading] = useState(false)
  const [regNumber, setRegNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitRegistration = async (config: SubmitConfig) => {
    const { platform, formData, photoUrl, selfieUrl, croppedAreaPixels, usedScan, refParam } =
      config
    setIsLoading(true)
    try {
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const randomNum = String(Math.floor(1000 + Math.random() * 9000))
      const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`
      setRegNumber(regNo)

      const authEmail = formData.email ? formData.email.trim() : null
      const cleanPhone =
        formData.countryCode + formData.contactNumber.replace(/^0+/, '').replace(/\s+/g, '')
      const dummyEmail = `${cleanPhone.replace('+', '')}@thebase.org`
      const finalAuthEmail = authEmail || dummyEmail

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalAuthEmail,
        password: formData.password!,
        options: { data: { full_name: formData.fullName } },
      })

      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered')) {
          throw new Error(
            'An account with this phone number already exists. Try signing in instead.'
          )
        }
        throw authError
      }

      let finalAvatarUrl = null
      const avatarSource = selfieUrl || photoUrl
      if (avatarSource && authData.user) {
        try {
          // If we have croppedAreaPixels, it was from the ID card cropper.
          // If we have a selfieUrl, we might not have cropped it yet.
          // For now, let's use the cropped version if available, or just the blob.
          const croppedBlob = croppedAreaPixels
            ? await getCroppedImg(avatarSource, croppedAreaPixels)
            : await (await fetch(avatarSource)).blob()

          if (croppedBlob) {
            const fileName = adminService.generateAvatarPath(regNo)
            const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
            if (!uploadError) {
              finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
              await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl } })
            } else {
              toast.error('Profile picture upload failed. You can update it in settings later.')
            }
          }
        } catch (err) {
          console.error('Failed to process/upload avatar:', err)
        }
      }

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

      // Automatically store session keys so the user's dashboard can fetch the profile
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userRegNo', regNo)
      localStorage.setItem('userName', formData.fullName)
      localStorage.setItem('userPlatform', platform)
      if (finalAvatarUrl) {
        localStorage.setItem('userAvatar', finalAvatarUrl)
      }
      window.dispatchEvent(new Event('storage'))

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error((error as Error)?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, regNumber, submitted, setSubmitted, submitRegistration }
}
