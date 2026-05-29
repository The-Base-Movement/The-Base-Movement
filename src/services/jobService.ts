import { supabase } from '@/lib/supabase'
import { compressForUpload } from '@/lib/imageUtils'
import type {
  Job,
  JobApplication,
  ApplicationWithJob,
  JobFilters,
  ApplicationStatus,
} from '@/types/jobs'

class JobService {
  private static instance: JobService
  private constructor() {}
  public static getInstance(): JobService {
    if (!JobService.instance) JobService.instance = new JobService()
    return JobService.instance
  }

  async getJobs(filters: JobFilters = {}): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`)
    }
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    if (filters.platform_filter && filters.platform_filter !== 'ALL') {
      query = query.or(`platform_filter.eq.ALL,platform_filter.eq.${filters.platform_filter}`)
    }

    const { data, error } = await query
    if (error) {
      console.warn('[jobService] getJobs:', error)
      return []
    }
    return (data || []) as Job[]
  }

  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
    if (error) return null
    return data as Job
  }

  async getJobByIdAdmin(id: string): Promise<Job | null> {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error) return null
    return data as Job
  }

  async getAllJobsAdmin(filters: JobFilters = {}): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select(`*, job_applications(count)`)
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`)
    }
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    if (filters.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) {
      console.warn('[jobService] getAllJobsAdmin:', error)
      return []
    }
    return (data || []).map((j: Record<string, unknown>) => ({
      ...j,
      application_count: (j.job_applications as { count: number }[] | null)?.[0]?.count ?? 0,
    })) as Job[]
  }

  async createJob(
    data: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'application_count'>
  ): Promise<Job | null> {
    const { data: result, error } = await supabase.from('jobs').insert(data).select().single()
    if (error) {
      console.warn('[jobService] createJob:', error)
      return null
    }
    return result as Job
  }

  async updateJob(id: string, data: Partial<Job>): Promise<boolean> {
    const { error } = await supabase
      .from('jobs')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.warn('[jobService] updateJob:', error)
      return false
    }
    return true
  }

  async deleteJob(id: string): Promise<boolean> {
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) {
      console.warn('[jobService] deleteJob:', error)
      return false
    }
    return true
  }

  async applyToJob(
    jobId: string,
    payload: { coverLetter: string; resumeUrl?: string }
  ): Promise<{ ok: boolean; reason?: 'limit_reached' | 'already_applied' | 'error' }> {
    const { error } = await supabase.rpc('apply_to_job', {
      p_job_id: jobId,
      p_cover_letter: payload.coverLetter,
      p_resume_url: payload.resumeUrl ?? null,
    })
    if (!error) return { ok: true }
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('monthly_limit_reached')) return { ok: false, reason: 'limit_reached' }
    if (msg.includes('already_applied')) return { ok: false, reason: 'already_applied' }
    if (msg.includes('not_authenticated')) return { ok: false, reason: 'error' }
    console.warn('[jobService] applyToJob:', error)
    return { ok: false, reason: 'error' }
  }

  async getMemberApplications(): Promise<JobApplication[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('member_id', user.id)
    if (error) return []
    return (data || []) as JobApplication[]
  }

  async getMonthlyApplicationCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const { count, error } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
    if (error) {
      console.warn('[jobService] getMonthlyApplicationCount:', error)
      return 0
    }
    return count ?? 0
  }

  async getMemberApplicationsFull(): Promise<ApplicationWithJob[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job:jobs(title, organization, status)')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[jobService] getMemberApplicationsFull:', error)
      return []
    }
    return (data || []) as ApplicationWithJob[]
  }

  async getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[jobService] getApplicationsForJob:', error)
      return []
    }
    if (!data?.length) return []

    // member_id FK points to auth.users; profile fields live in public.users
    const memberIds = [...new Set(data.map((a) => a.member_id as string))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, registration_number, email, avatar_url')
      .in('id', memberIds)
    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]))

    return data.map((a) => ({ ...a, member: userMap[a.member_id] ?? null })) as JobApplication[]
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<boolean> {
    const { error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.warn('[jobService] updateApplicationStatus:', error)
      return false
    }
    return true
  }

  async uploadJobBanner(file: File): Promise<string | null> {
    const compressed = await compressForUpload(file)
    const ext = compressed.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('job-banners')
      .upload(path, compressed, { upsert: false, contentType: compressed.type || 'image/webp' })
    if (error) {
      console.warn('[jobService] uploadJobBanner:', error)
      return null
    }
    const { data } = supabase.storage.from('job-banners').getPublicUrl(path)
    return data.publicUrl
  }

  async uploadResume(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('job-resumes')
      .upload(path, file, { upsert: false })
    if (error) {
      console.warn('[jobService] uploadResume:', error)
      return null
    }
    const { data } = supabase.storage.from('job-resumes').getPublicUrl(path)
    return data.publicUrl
  }

  async hasApplied(jobId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('member_id', user.id)
      .maybeSingle()
    return !!data
  }
}

export const jobService = JobService.getInstance()
