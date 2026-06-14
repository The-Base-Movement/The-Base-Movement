import type { JobSelection } from '@/services/jobTaxonomyService'

export interface RegistrationFormData {
  idNumber: string
  fullName: string
  countryCode: string
  country: string
  children_count: number
  contactNumber: string
  ageRange: string
  gender: string
  password?: string
  email?: string
  residentialAddress: string
  region: string
  constituency: string
  chapter: string
  profession: string
  /** Structured job selection from the approved taxonomy (drives `profession`). */
  job?: JobSelection
  educationLevel: string
  emergencyContactName: string
  emergencyRelationship: string
  emergencyNumber: string
  city?: string
}

export interface Region {
  id: number
  name: string
}

export interface Constituency {
  region_id: number
  name: string
}
