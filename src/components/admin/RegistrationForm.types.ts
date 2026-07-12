import type { Area } from 'react-easy-crop'

export interface RegistrationFormData {
  fullName: string
  countryCode: string
  country: string
  contactNumber: string
  ageRange: string
  gender: string
  password: string
  email: string
  residentialAddress: string
  region: string
  constituency: string
  chapter: string
  profession: string
  educationLevel: string
  emergencyContactName: string
  emergencyRelationship: string
  emergencyNumber: string
  ghanaCardNumber: string
  votersIdCard?: string
  pollingStationCode?: string
}

export interface RegistrationSubmission extends RegistrationFormData {
  registrationNumber: string
  platform: string
  photoUrl: string | null
  croppedAreaPixels?: Area | null
}

export type RegistrationChangeHandler = (field: keyof RegistrationFormData, value: string) => void
