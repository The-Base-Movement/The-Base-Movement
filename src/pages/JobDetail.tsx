import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { trackEvent } from '@/lib/analytics'
import { jobService } from '@/services/jobService'
import { userActivityService } from '@/services/userActivityService'
import { supabase } from '@/lib/supabase'
import type { Job, JobType } from '@/types/jobs'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function OrgBadge({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--radius-md)',
        background: 'hsl(var(--primary) / 0.1)',
        border: '1px solid hsl(var(--primary) / 0.2)',
        color: 'hsl(var(--primary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 'var(--font-weight-medium, 500)',
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 14px',
        fontSize: 10,
        fontWeight: 'var(--font-weight-medium, 500)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: 'hsl(var(--on-surface-muted))',
      }}
    >
      {children}
    </p>
  )
}

interface ApplyCTAProps {
  applyState: 'public' | 'applied' | 'closed' | 'limit' | 'available'
  monthlyCount: number
  monthlyCountLoading: boolean
  showApplyForm: boolean
  nextMonth: string
  basePath: string
  onNavigate: (path: string) => void
  onToggleForm: (show: boolean) => void
}

function ApplyCTA({
  applyState,
  monthlyCount,
  monthlyCountLoading,
  showApplyForm,
  nextMonth,
  basePath,
  onNavigate,
  onToggleForm,
}: ApplyCTAProps) {
  if (applyState === 'applied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
          >
            check_circle
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Application submitted
          </p>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.5,
          }}
        >
          Your application is under review. We will contact you if shortlisted.
        </p>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: '100%' }}
          onClick={() => onNavigate(basePath)}
        >
          Browse more jobs
        </button>
      </div>
    )
  }
  if (applyState === 'closed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
          >
            event_busy
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Applications closed
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          The deadline for this position has passed.
        </p>
      </div>
    )
  }
  if (applyState === 'limit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="pill pill-err" style={{ alignSelf: 'flex-start' }}>
          3 / 3 used
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          Monthly limit reached
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.5,
          }}
        >
          You have used all 3 applications this month. Resets 1 {nextMonth}.
        </p>
      </div>
    )
  }
  if (applyState === 'public') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          Interested in this role?
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.5,
          }}
        >
          Sign in to apply and track your applications.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => onNavigate('/login')}
        >
          Sign in to Apply
        </button>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!monthlyCountLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'hsl(var(--container-low))',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Applications this month
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: monthlyCount >= 2 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
            }}
          >
            {monthlyCount} / 3
          </span>
        </div>
      )}
      {showApplyForm ? (
        <button
          className="btn btn-outline"
          style={{ width: '100%' }}
          onClick={() => onToggleForm(false)}
        >
          Cancel application
        </button>
      ) : (
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={monthlyCountLoading}
          onClick={() => onToggleForm(true)}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 6, verticalAlign: 'middle' }}
          >
            send
          </span>
          Apply for this Role
        </button>
      )}
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const basePath = isDashboard ? '/dashboard/jobs' : '/jobs'

  const [job, setJob] = useState<Job | null>(null)
  // Use loadedId to derive loading state — avoids synchronous setState in effects
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const loading = id != null && loadedId !== id && !notFound

  const [hasApplied, setHasApplied] = useState(false)
  const [monthlyCount, setMonthlyCount] = useState(0)
  // Only loading when in dashboard (public never fetches monthly count)
  const [monthlyCountLoading, setMonthlyCountLoading] = useState(isDashboard)

  const [showApplyForm, setShowApplyForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    window.scrollTo({ top: 0, behavior: 'smooth' })

    jobService.getJobById(id).then((data) => {
      setShowApplyForm(false)
      setCoverLetter('')
      setResumeFile(null)
      if (!data) {
        setNotFound(true)
        setLoadedId(id)
        return
      }
      setJob(data)
      setNotFound(false)
      setLoadedId(id)
      jobService.getJobs({ category: data.category }).then((jobs) => {
        setSimilarJobs(jobs.filter((j) => j.id !== id).slice(0, 5))
      })
    })

    if (isDashboard) {
      jobService.hasApplied(id).then(setHasApplied)
      jobService.getMonthlyApplicationCount().then((n) => {
        setMonthlyCount(n)
        setMonthlyCountLoading(false)
      })
    }
  }, [id, isDashboard])

  function nextMonthName() {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toLocaleString('default', { month: 'long' })
  }

  async function handleSubmitApplication() {
    if (!job || !coverLetter.trim()) return
    if (!isDashboard) {
      navigate('/login')
      return
    }
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
    const result = await jobService.applyToJob(job.id, { coverLetter, resumeUrl })
    if (result.ok) {
      trackEvent('job_application', { job_title: job.title })
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await userActivityService.logActivity(
          session.user.id,
          'job_application',
          `Applied for ${job.title} at ${job.organization}`,
          { job_id: job.id, job_title: job.title, organization: job.organization }
        )
      }
      toast.success('Application submitted!')
      setHasApplied(true)
      setMonthlyCount((n) => n + 1)
      setCoverLetter('')
      setResumeFile(null)
      setShowApplyForm(false)
    } else if (result.reason === 'limit_reached') {
      toast.error(`Monthly limit reached. Resets 1 ${nextMonthName()}.`)
      setMonthlyCount(3)
    } else if (result.reason === 'already_applied') {
      toast.error("You've already applied.")
      setHasApplied(true)
    } else {
      toast.error('Application failed. Please try again.')
    }
    setSubmitting(false)
  }

  const wrapStyle: React.CSSProperties = isDashboard
    ? { fontFamily: font }
    : { fontFamily: font, maxWidth: 1080, margin: '0 auto', padding: '32px 20px' }

  if (loading) {
    return (
      <div className={isDashboard ? 'main' : undefined} style={wrapStyle}>
        {isDashboard && <Breadcrumbs />}
        <div className="jd-grid">
          <div className="jd-main">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="panel jd-skeleton-block"
                style={{ height: i === 1 ? 180 : 120 }}
              />
            ))}
          </div>
          <div className="jd-sidebar">
            <div className="panel jd-skeleton-block" style={{ height: 200 }} />
            <div className="panel jd-skeleton-block" style={{ height: 280 }} />
          </div>
        </div>
        <style>{jdCss}</style>
      </div>
    )
  }

  if (notFound || !job) {
    return (
      <div className={isDashboard ? 'main' : undefined} style={wrapStyle}>
        {isDashboard && <Breadcrumbs />}
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 52,
              color: 'hsl(var(--on-surface-muted))',
              fontVariationSettings: "'FILL' 0",
            }}
          >
            work_off
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            This job is no longer available
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
            It may have been removed or closed by the organisation.
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(basePath)}>
            Back to Jobs Board
          </button>
        </div>
        <style>{jdCss}</style>
      </div>
    )
  }

  const isDeadlinePassed = job.deadline ? new Date(job.deadline) < new Date() : false
  const deadlineDays = job.deadline && !isDeadlinePassed ? daysUntil(job.deadline) : null

  const applyState: 'public' | 'applied' | 'closed' | 'limit' | 'available' = !isDashboard
    ? 'public'
    : hasApplied
      ? 'applied'
      : isDeadlinePassed
        ? 'closed'
        : monthlyCount >= 3
          ? 'limit'
          : 'available'

  const quickFacts = [
    { icon: 'work', label: 'Type', value: TYPE_LABELS[job.job_type] },
    { icon: 'category', label: 'Category', value: job.category },
    job.location ? { icon: 'location_on', label: 'Location', value: job.location } : null,
    {
      icon: 'language',
      label: 'Network',
      value:
        job.platform_filter === 'ALL'
          ? 'Open to all'
          : job.platform_filter === 'GHANA'
            ? 'Ghana Network'
            : 'Diaspora Network',
    },
    job.deadline
      ? {
          icon: 'calendar_today',
          label: 'Closes',
          value: new Date(job.deadline).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        }
      : null,
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  return (
    <div className={isDashboard ? 'main' : undefined} style={wrapStyle}>
      <SEO
        title={job.title + ' — ' + job.organization + ' | The Base Movement'}
        description={job.description.slice(0, 160)}
      />
      {isDashboard && <Breadcrumbs />}

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(basePath)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 20,
          paddingLeft: 0,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
          arrow_back
        </span>
        Jobs Board
      </button>

      <div className="jd-grid">
        <div className="jd-main">
          {/* Hero card */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {job.banner_url && (
              <img
                src={job.banner_url}
                alt={job.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: 240,
                  objectFit: 'cover',
                }}
              />
            )}
            <div style={{ padding: '24px 28px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: 'hsl(var(--primary))',
                }}
              />
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                <OrgBadge name={job.organization} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1
                    style={{
                      margin: '0 0 3px',
                      fontSize: 22,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.3,
                    }}
                  >
                    {job.title}
                  </h1>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {job.organization}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    Posted {timeAgo(job.created_at)}
                  </p>
                </div>
                {hasApplied && (
                  <span className="pill pill-ok" style={{ flexShrink: 0, fontSize: 11 }}>
                    Applied
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                      background: 'hsl(var(--accent) / 0.12)',
                      color: 'hsl(var(--accent))',
                    }}
                  >
                    {job.platform_filter === 'GHANA' ? 'Ghana Network' : 'Diaspora Network'}
                  </span>
                )}
                {job.location && (
                  <span
                    className="pill pill-mute"
                    style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                      location_on
                    </span>
                    {job.location}
                  </span>
                )}
                {isDeadlinePassed && (
                  <span className="pill pill-err" style={{ fontSize: 11 }}>
                    Closed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key details strip */}
          {(job.salary_range || job.deadline || job.application_count != null) && (
            <div
              className="panel"
              style={{
                padding: '18px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 16,
              }}
            >
              {job.salary_range && (
                <div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Compensation
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {job.salary_range}
                  </p>
                </div>
              )}
              {job.deadline && (
                <div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Deadline
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: isDeadlinePassed
                        ? 'hsl(var(--destructive))'
                        : 'hsl(var(--on-surface))',
                    }}
                  >
                    {new Date(job.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {deadlineDays !== null && (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color:
                          deadlineDays <= 7
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {deadlineDays} day{deadlineDays !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
              )}
              {job.application_count != null && (
                <div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Applications
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {job.application_count} submitted
                  </p>
                </div>
              )}
            </div>
          )}

          {/* About this Role */}
          <div className="panel" style={{ padding: '24px 28px' }}>
            <SectionLabel>About this Role</SectionLabel>
            <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 18 }} />
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="panel" style={{ padding: '24px 28px' }}>
              <SectionLabel>Requirements</SectionLabel>
              <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 18 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.requirements}
              </p>
            </div>
          )}

          {/* Inline apply form */}
          {showApplyForm && applyState === 'available' && (
            <div className="panel" style={{ padding: '24px 28px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <SectionLabel>Submit Your Application</SectionLabel>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowApplyForm(false)}
                  style={{ color: 'hsl(var(--on-surface-muted))', marginTop: -14 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>
              <p
                style={{ margin: '0 0 20px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                {job.title} at {job.organization}
              </p>
              <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 20 }} />
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
                rows={7}
                placeholder="Tell us why you are a great fit for this role..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: font,
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: 18,
                  lineHeight: 1.6,
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
                Resume / CV{' '}
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: 'none',
                    letterSpacing: 0,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  (PDF, DOC - optional)
                </span>
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
                <button className="btn btn-outline" onClick={() => setShowApplyForm(false)}>
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
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="jd-sidebar">
          {/* Apply CTA */}
          <div className="panel" style={{ padding: '20px' }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {applyState === 'applied' ? 'Application Status' : 'Apply for this Role'}
            </p>
            <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 14 }} />
            <ApplyCTA
              applyState={applyState}
              monthlyCount={monthlyCount}
              monthlyCountLoading={monthlyCountLoading}
              showApplyForm={showApplyForm}
              nextMonth={nextMonthName()}
              basePath={basePath}
              onNavigate={navigate}
              onToggleForm={setShowApplyForm}
            />
          </div>

          {/* Job quick facts */}
          <div className="panel" style={{ padding: '20px' }}>
            <SectionLabel>Job Details</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {quickFacts.map((item) => (
                <div
                  key={item.label}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 15,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 2,
                      flexShrink: 0,
                      fontVariationSettings: "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar jobs */}
          {similarJobs.length > 0 && (
            <div className="panel" style={{ padding: '20px' }}>
              <SectionLabel>More in {job.category}</SectionLabel>
              <div>
                {similarJobs.map((sj, i) => (
                  <div
                    key={sj.id}
                    onClick={() => navigate(basePath + '/' + sj.id)}
                    className="jd-similar-item"
                    style={{
                      padding: '12px 0',
                      borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          lineHeight: 1.3,
                        }}
                      >
                        {sj.title}
                      </p>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: 'hsl(var(--on-surface-muted))',
                          flexShrink: 0,
                        }}
                      >
                        arrow_forward
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {sj.organization}
                    </p>
                    <span className={`pill ${PILL_COLORS[sj.job_type]}`} style={{ fontSize: 10 }}>
                      {TYPE_LABELS[sj.job_type]}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: 'hsl(var(--border))', margin: '12px 0' }} />
              <button
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
                onClick={() => navigate(basePath)}
              >
                View all jobs
              </button>
            </div>
          )}
        </aside>
      </div>

      <style>{jdCss}</style>
    </div>
  )
}

const jdCss = [
  '.jd-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }',
  '.jd-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }',
  '.jd-sidebar { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 76px; }',
  '.jd-skeleton-block { animation: jd-pulse 1.6s ease-in-out infinite; border: none !important; }',
  '@keyframes jd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }',
  '.jd-similar-item:hover p { color: hsl(var(--primary)) !important; }',
  '@media (max-width: 820px) { .jd-grid { grid-template-columns: 1fr; } .jd-sidebar { position: static; order: 2; } .jd-main { order: 1; } }',
  '@media (max-width: 480px) { .jd-grid { gap: 12px; } }',
].join(' ')
