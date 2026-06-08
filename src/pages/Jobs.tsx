import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useLocation, useNavigate } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters, JobType, PlatformFilter, ApplicationWithJob } from '@/types/jobs'
import MyApplicationsTab from './jobs/MyApplicationsTab'
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

  function openJobDetail(job: Job) {
    navigate(`${isDashboard ? '/dashboard' : ''}/jobs/${job.id}`)
  }

  function handleViewJobFromApp(jobId: string) {
    navigate(`${isDashboard ? '/dashboard' : ''}/jobs/${jobId}`)
  }

  return (
    <div
      className={isDashboard ? 'main' : undefined}
      style={
        isDashboard
          ? { fontFamily: font }
          : { fontFamily: font, maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }
      }
    >
      <SEO
        title="Jobs Board | The Base Movement"
        description="Browse job opportunities within The Base Movement network."
      />

      {isDashboard && <Breadcrumbs />}

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
                id="jobs-search"
                name="jobs-search"
                autoComplete="off"
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
            {/* Row 2 — filters (one row desktop, two rows mobile) */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className={`btn btn-sm ${!filters.category && !filters.job_type && !filters.platform_filter ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() =>
                  setFilters((f) => ({ ...f, category: '', job_type: '', platform_filter: '' }))
                }
                style={{ flexShrink: 0 }}
              >
                All
              </button>
              <select
                id="jobs-category"
                name="jobs-category"
                autoComplete="off"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                style={{
                  flex: 1,
                  minWidth: 100,
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
              {/* forces a line break between category and type/network on mobile only */}
              <div className="jobs-filter-break" />
              <select
                id="jobs-type"
                name="jobs-type"
                autoComplete="off"
                value={filters.job_type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, job_type: e.target.value as JobType | '' }))
                }
                style={{
                  flex: 1,
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
                id="jobs-network"
                name="jobs-network"
                autoComplete="off"
                value={filters.platform_filter}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    platform_filter: e.target.value as PlatformFilter | '',
                  }))
                }
                style={{
                  flex: 1,
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
                        height: 'auto',
                        objectFit: 'contain',
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
    </div>
  )
}
