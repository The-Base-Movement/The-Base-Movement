import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters, JobType, PlatformFilter } from '@/types/jobs'
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

  async function openJobDetail(job: Job) {
    setSelectedJob(job)
    const applied = await jobService.hasApplied(job.id)
    setHasApplied(applied)
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
    const ok = await jobService.applyToJob(selectedJob.id, { coverLetter, resumeUrl })
    if (ok) {
      toast.success('Application submitted successfully!')
      setHasApplied(true)
      setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]))
      setShowApplyModal(false)
      setCoverLetter('')
      setResumeFile(null)
    } else {
      toast.error('Failed to submit application. You may have already applied.')
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
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          Jobs Board
        </h1>
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
          Opportunities within The Base Movement network
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          placeholder="Search title or organisation..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{
            flex: '1 1 200px',
            minWidth: 160,
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
            boxSizing: 'border-box',
            color: 'hsl(var(--on-surface))',
          }}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
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
          onChange={(e) => setFilters((f) => ({ ...f, job_type: e.target.value as JobType | '' }))}
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
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
            setFilters((f) => ({ ...f, platform_filter: e.target.value as PlatformFilter | '' }))
          }
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
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
                padding: '18px 20px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.15s',
              }}
            >
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
                  <span className="pill pill-ok" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                    Applied
                  </span>
                )}
              </div>
              <p
                style={{ margin: '0 0 10px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                {job.organization}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <span className={`pill ${PILL_COLORS[job.job_type]}`} style={{ fontSize: 11 }}>
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
          ))}
        </div>
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
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {selectedJob.title}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
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
                style={{ margin: '0 0 12px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Salary:</strong>{' '}
                {selectedJob.salary_range}
              </p>
            )}
            {selectedJob.deadline && (
              <p
                style={{ margin: '0 0 16px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Deadline:</strong>{' '}
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
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Apply — {selectedJob.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
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
