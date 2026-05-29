import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { useLocation, useNavigate } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters, JobType, PlatformFilter, ApplicationWithJob } from '@/types/jobs'
import MyApplicationsTab from './jobs/MyApplicationsTab'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'volunteer', 'internship']
const CATEGORIES = [
  'General',
  'Technology',
  'Finance',
  'Legal',
  'Admin',
  'Communications',
  'Field Operations',
  'Research',
]
const PLATFORMS: PlatformFilter[] = ['ALL', 'GHANA', 'DIASPORA']

const TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  internship: 'Internship',
}

const PILL_COLORS: Record<JobType, string> = {
  'full-time': 'pill-ok',
  'part-time': 'pill-warn',
  contract: 'pill-mute',
  volunteer: 'pill-ok',
  internship: 'pill-warn',
}

export default function Jobs() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    category: '',
    job_type: '',
    platform_filter: '',
  })

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

  // Tabs + monthly limit (dashboard only)
  const [activeTab, setActiveTab] = useState<'browse' | 'applications'>('browse')
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [applicationsLoaded, setApplicationsLoaded] = useState(false)
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [monthlyCountLoading, setMonthlyCountLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    jobService.getJobs(filters).then((data) => {
      if (!cancelled) {
        setJobs(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [filters])

  useEffect(() => {
    jobService.getMemberApplications().then((apps) => {
      setAppliedJobIds(new Set(apps.map((a) => a.job_id)))
    })
  }, [])

  useEffect(() => {
    if (!isDashboard) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonthlyCountLoading(true)
    jobService.getMonthlyApplicationCount().then((n) => {
      setMonthlyCount(n)
      setMonthlyCountLoading(false)
    })
  }, [isDashboard])

  async function loadApplications() {
    if (applicationsLoaded || applicationsLoading) return
    setApplicationsLoading(true)
    const data = await jobService.getMemberApplicationsFull()
    setApplications(data)
    setApplicationsLoaded(true)
    setApplicationsLoading(false)
  }

  function switchToApplications() {
    setActiveTab('applications')
    loadApplications()
  }

  function nextMonthName() {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toLocaleString('default', { month: 'long' })
  }

  function counterChip() {
    if (monthlyCountLoading) {
      return (
        <span className="pill pill-mute" style={{ fontSize: 12 }}>
          — / 3 used this month
        </span>
      )
    }
    if (monthlyCount >= 3) {
      return (
        <span className="pill pill-err" style={{ fontSize: 12 }}>
          3 / 3 — resets 1 {nextMonthName()}
        </span>
      )
    }
    if (monthlyCount >= 1) {
      return (
        <span className="pill pill-warn" style={{ fontSize: 12 }}>
          {monthlyCount} / 3 used this month
        </span>
      )
    }
    return (
      <span className="pill pill-mute" style={{ fontSize: 12 }}>
        0 / 3 used this month
      </span>
    )
  }

  async function openJobDetail(job: Job) {
    setSelectedJob(job)
    const applied = await jobService.hasApplied(job.id)
    setHasApplied(applied)
  }

  async function handleViewJobFromApp(jobId: string) {
    const job = await jobService.getJobById(jobId)
    if (!job) {
      toast.error('This job is no longer available.')
      return
    }
    openJobDetail(job)
  }

  function handleApplyClick() {
    if (!isDashboard) {
      navigate('/login')
      return
    }
    setShowApplyModal(true)
  }

  async function handleSubmitApplication() {
    if (!selectedJob || !coverLetter.trim()) return
    setSubmitting(true)
    let resumeUrl: string | undefined
    if (resumeFile) {
      const url = await jobService.uploadResume(resumeFile)
      if (!url) {
        toast.error('Resume upload failed. Please try again.')
        setSubmitting(false)
        return
      }
      resumeUrl = url
    }
    const result = await jobService.applyToJob(selectedJob.id, { coverLetter, resumeUrl })
    if (result.ok) {
      trackEvent('job_application', { job_title: selectedJob.title })
      toast.success('Application submitted successfully!')
      setHasApplied(true)
      setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]))
      setMonthlyCount((n) => n + 1)
      // Optimistic update: prepend new card without a re-fetch
      const optimistic: ApplicationWithJob = {
        id: crypto.randomUUID(),
        job_id: selectedJob.id,
        member_id: '',
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        job: {
          title: selectedJob.title,
          organization: selectedJob.organization,
          status: selectedJob.status,
        },
      }
      setApplications((prev) => [optimistic, ...prev])
      setShowApplyModal(false)
      setCoverLetter('')
      setResumeFile(null)
    } else if (result.reason === 'limit_reached') {
      toast.error(
        `You've reached your 3-application limit for this month. Resets on 1 ${nextMonthName()}.`
      )
      setMonthlyCount(3)
    } else if (result.reason === 'already_applied') {
      toast.error("You've already applied for this position.")
      setHasApplied(true)
    } else {
      toast.error('Application failed. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ fontFamily: font, maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <SEO
        title="Jobs Board | The Base Movement"
        description="Browse job opportunities within The Base Movement network."
      />

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          Jobs Board
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          Opportunities within The Base Movement network
        </p>
      </div>

      {/* Tab bar — dashboard only */}
      {isDashboard && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm ${activeTab === 'browse' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Jobs
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'applications' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
              onClick={switchToApplications}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              My Applications
              {applicationsLoaded && applications.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'hsl(var(--on-surface) / 0.15)',
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {applications.length}
                </span>
              )}
            </button>
          </div>
          {counterChip()}
        </div>
      )}

      {activeTab === 'browse' ? (
        <>
          {/* Filter bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {/* Row 1 — search, full width */}
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface-muted))',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                placeholder="Search title or organisation..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%',
                  height: 38,
                  paddingLeft: 34,
                  paddingRight: 12,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: font,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {/* Row 2 — filters, wrap on mobile */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${!filters.category && !filters.job_type && !filters.platform_filter ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() =>
                  setFilters((f) => ({ ...f, category: '', job_type: '', platform_filter: '' }))
                }
              >
                All
              </button>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  height: 36,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: font,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filters.job_type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, job_type: e.target.value as JobType | '' }))
                }
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  height: 36,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: font,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                }}
              >
                <option value="">All Types</option>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <select
                value={filters.platform_filter}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    platform_filter: e.target.value as PlatformFilter | '',
                  }))
                }
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  height: 36,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: font,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                }}
              >
                <option value="">All Networks</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job cards grid */}
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 14,
              }}
            >
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 14,
              }}
            >
              No jobs found.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="panel"
                  onClick={() => openJobDetail(job)}
                  style={{
                    padding: 0,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  {job.banner_url ? (
                    <img
                      src={job.banner_url}
                      alt={job.title}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 130,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: 'hsl(var(--primary))',
                      }}
                    />
                  )}
                  <div style={{ padding: '14px 18px 16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 15,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {job.title}
                      </p>
                      {appliedJobIds.has(job.id) && (
                        <span
                          className="pill pill-ok"
                          style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                        >
                          Applied
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-normal, 400)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {job.organization}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <span
                        className={`pill ${PILL_COLORS[job.job_type]}`}
                        style={{ fontSize: 11 }}
                      >
                        {TYPE_LABELS[job.job_type]}
                      </span>
                      <span className="pill pill-mute" style={{ fontSize: 11 }}>
                        {job.category}
                      </span>
                      {job.platform_filter !== 'ALL' && (
                        <span
                          className="pill"
                          style={{
                            fontSize: 11,
                            background: 'hsl(var(--accent) / 0.15)',
                            color: 'hsl(var(--accent))',
                          }}
                        >
                          {job.platform_filter}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-normal, 400)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {job.location && (
                        <span>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 13, verticalAlign: 'middle' }}
                          >
                            location_on
                          </span>{' '}
                          {job.location}
                        </span>
                      )}
                      {job.deadline && (
                        <span>
                          Closes{' '}
                          {new Date(job.deadline).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <MyApplicationsTab
          applications={applications}
          loading={applicationsLoading}
          onBrowse={() => setActiveTab('browse')}
          onViewJob={handleViewJobFromApp}
        />
      )}

      {/* Job detail modal */}
      {selectedJob && (
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
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedJob.banner_url && (
              <img
                src={selectedJob.banner_url}
                alt={selectedJob.title}
                style={{
                  display: 'block',
                  width: 'calc(100% + 56px)',
                  marginLeft: -28,
                  marginTop: -28,
                  marginBottom: 20,
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 20,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {selectedJob.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {selectedJob.organization}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  padding: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              <span
                className={`pill ${PILL_COLORS[selectedJob.job_type]}`}
                style={{ fontSize: 11 }}
              >
                {TYPE_LABELS[selectedJob.job_type]}
              </span>
              <span className="pill pill-mute" style={{ fontSize: 11 }}>
                {selectedJob.category}
              </span>
              {selectedJob.platform_filter !== 'ALL' && (
                <span
                  className="pill"
                  style={{
                    fontSize: 11,
                    background: 'hsl(var(--accent) / 0.15)',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  {selectedJob.platform_filter}
                </span>
              )}
              {selectedJob.location && (
                <span className="pill pill-mute" style={{ fontSize: 11 }}>
                  {selectedJob.location}
                </span>
              )}
            </div>

            {selectedJob.salary_range && (
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Salary:
                </span>{' '}
                {selectedJob.salary_range}
              </p>
            )}
            {selectedJob.deadline && (
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Deadline:
                </span>{' '}
                {new Date(selectedJob.deadline).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}

            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Description
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.requirements && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Requirements
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedJob.requirements}
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              {hasApplied ? (
                <button
                  className="btn btn-primary"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Applied ✓
                </button>
              ) : monthlyCount >= 3 ? (
                <button
                  className="btn btn-primary"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Limit reached — resets 1 {nextMonthName()}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleApplyClick}>
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application form modal */}
      {showApplyModal && selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 540,
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 17,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Apply — {selectedJob.title}
            </h3>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {selectedJob.organization}
            </p>

            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Cover Letter <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="Introduce yourself and explain why you're a great fit..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: font,
                fontSize: 13,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'hsl(var(--on-surface))',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Resume / CV <span style={{ color: 'hsl(var(--on-surface-muted))' }}>(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              style={{
                display: 'block',
                marginBottom: 24,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!coverLetter.trim() || submitting}
                onClick={handleSubmitApplication}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
