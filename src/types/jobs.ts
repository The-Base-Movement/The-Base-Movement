export type JobType = 'full-time' | 'part-time' | 'contract' | 'volunteer' | 'internship'
export type JobStatus = 'draft' | 'published' | 'closed'
export type PlatformFilter = 'ALL' | 'GHANA' | 'DIASPORA'
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'

export interface Job {
  id: string
  title: string
  organization: string
  description: string
  requirements?: string
  location?: string
  job_type: JobType
  category: string
  salary_range?: string
  platform_filter: PlatformFilter
  deadline?: string
  banner_url?: string
  status: JobStatus
  posted_by?: string
  created_at: string
  updated_at: string
  application_count?: number
}

export interface JobApplication {
  id: string
  job_id: string
  member_id: string
  cover_letter: string
  resume_url?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  member?: {
    full_name: string
    registration_number: string
    email: string
    avatar_url?: string
  }
}

export interface JobFilters {
  search?: string
  category?: string
  job_type?: JobType | ''
  platform_filter?: PlatformFilter | ''
  status?: JobStatus | ''
}
