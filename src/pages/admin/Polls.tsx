import { useState, useEffect, useCallback } from 'react'
import { adminService, type Poll, type PollStats } from '@/services/adminService'
import { toast } from 'sonner'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const inputSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700, fontSize: 12, borderRadius: 4,
  color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}

const selectSt: React.CSSProperties = {
  ...inputSt, cursor: 'pointer',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6,
}

const thSt: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
}

const tdSt: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid hsl(var(--border))',
}

function statusPill(status: string) {
  if (status === 'Active') return <span className="pill pill-ok">{status}</span>
  if (status === 'Draft') return <span className="pill pill-warn">{status}</span>
  return <span className="pill pill-mute">{status}</span>
}

export default function PollsManagement() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState<PollStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [availableRegions, setAvailableRegions] = useState<{ id: string, name: string }[]>([])
  const [availableCountries, setAvailableCountries] = useState<{ name: string, dialing_code: string, is_diaspora: boolean }[]>([])

  const [newPoll, setNewPoll] = useState({
    question: '',
    targetBase: 'GHANA',
    region: 'National',
    country: 'International',
    status: 'Active',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    options: ['', '']
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
  const [viewPoll, setViewPoll] = useState<Poll | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pollData, statData, regionsData, countriesData] = await Promise.all([
        adminService.getPolls(),
        adminService.getPollStats(),
        adminService.getGhanaRegions(),
        adminService.getCountries()
      ])
      setPolls(pollData)
      setStats(statData)
      setAvailableRegions(regionsData)
      setAvailableCountries(countriesData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPoll.options.filter(o => o.trim()).length < 2) {
      toast.error('Please provide at least 2 options.')
      return
    }
    setIsSubmitting(true)
    try {
      const targetRegion = newPoll.targetBase === 'GHANA' ? newPoll.region : newPoll.country
      const success = await adminService.createPoll({
        ...newPoll,
        region: targetRegion,
        options: newPoll.options.filter(o => o.trim())
      })
      if (success) {
        toast.success('Poll created successfully!')
        setShowCreateModal(false)
        setNewPoll({
          question: '', targetBase: 'GHANA', region: 'National', country: 'International',
          status: 'Active',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          options: ['', '']
        })
        fetchData()
      } else {
        toast.error('Failed to create poll.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePoll = async (id: string, question: string) => {
    if (!window.confirm(`Are you sure you want to delete the poll: "${question}"?`)) return
    try {
      const success = await adminService.deletePoll(id)
      if (success) {
        toast.success('Poll deleted successfully.')
        fetchData()
      } else {
        toast.error('Failed to delete poll.')
      }
    } catch (err) {
      console.error('[POLLS] Delete operation failed:', err)
      toast.error('An error occurred while deleting the poll.')
    }
  }

  const filteredPolls = polls.filter(p =>
    p.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const modalBackdrop: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }

  const modalBox = (maxW: number): React.CSSProperties => ({
    background: '#fff', borderRadius: 6, border: '1px solid hsl(var(--border))',
    width: '100%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto',
  })

  const modalCloseBtn: React.CSSProperties = {
    background: 'none', border: '1px solid hsl(var(--border))', borderRadius: 4,
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'hsl(var(--on-surface-muted))', flexShrink: 0,
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <div className="crumbs">Engagement · Campaigns</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bar_chart</span>
            Engagement Hub
          </h2>
          <div style={{ marginTop: 10, marginBottom: 4 }}><BrandLine /></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', marginTop: 6, marginBottom: 0 }}>
            Manage movement-wide opinion polls, surveys, and live member feedback intercepts.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Create Campaign
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI label="Total engagements" value={stats?.totalEngagements || 0} description="Campaign participation" trend={{ direction: 'up', value: '15.2%' }} />
        <TacticalKPI label="National sentiment" value={`${stats?.nationalSentimentScore || 0}%`} description="Positive threshold" trend={{ direction: 'neutral', value: 'Live' }} variant="gold" />
        <TacticalKPI label="Avg response time" value={stats?.avgResponseTime || 'N/A'} description="Engagement velocity" variant="green" />
        <TacticalKPI label="Feedback rate" value={stats?.feedbackRate || '0%'} description="Quality score" />
      </div>

      {/* Desktop table */}
      <div className="panel desktop-only">
        <div className="ph">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>bar_chart</span>
            Campaign Management
            {!isLoading && <span className="meta">{filteredPolls.length} record{filteredPolls.length !== 1 ? 's' : ''}</span>}
          </span>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
            <input style={{ ...inputSt, paddingLeft: 34, width: 210, height: 34 }} placeholder="Search polls…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thSt}>Campaign title</th>
                <th style={{ ...thSt, textAlign: 'center' }}>Responses</th>
                <th style={thSt}>Region</th>
                <th style={thSt}>Status</th>
                <th style={thSt}>End date</th>
                <th style={{ ...thSt, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))', width: '75%' }} /></td>
                    <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                    <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                    <td style={tdSt}><div style={{ height: 22, borderRadius: 3, background: 'hsl(var(--container-low))', width: 60 }} /></td>
                    <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                    <td style={{ ...tdSt, textAlign: 'right' }}><div style={{ height: 30, width: 70, borderRadius: 4, background: 'hsl(var(--container-low))', marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : filteredPolls.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    No matching polls found in the campaign hub.
                  </td>
                </tr>
              ) : filteredPolls.map(poll => (
                <tr key={poll.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={tdSt}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--on-surface))', lineHeight: 1.4 }}>{poll.question}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>{poll.id}</div>
                  </td>
                  <td style={{ ...tdSt, textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{poll.totalVotes.toLocaleString()}</div>
                    <div style={{ width: 80, height: 3, background: 'hsl(var(--border))', borderRadius: 2, margin: '6px auto 0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%', background: poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))', transition: 'width 1s' }} />
                    </div>
                  </td>
                  <td style={tdSt}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{poll.region}</span>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
                      {statusPill(poll.status)}
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                      {poll.endDate}
                    </div>
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-dest btn-sm" style={{ width: 34, padding: 0, justifyContent: 'center' }} onClick={() => handleDeletePoll(poll.id, poll.question)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                      <button className="btn btn-sm" style={{ background: 'hsl(var(--accent))', color: '#fff', width: 34, padding: 0, justifyContent: 'center' }} onClick={() => setViewPoll(poll)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="panel">
          <div style={{ padding: 12, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
            <input style={{ ...inputSt, paddingLeft: 34 }} placeholder="Search polls…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 14, background: 'hsl(var(--container-low))', borderRadius: 3, width: '75%' }} />
              <div style={{ height: 10, background: 'hsl(var(--container-low))', borderRadius: 3, width: '50%' }} />
              <div style={{ height: 34, background: 'hsl(var(--container-low))', borderRadius: 4 }} />
            </div>
          ))
        ) : filteredPolls.length === 0 ? (
          <div className="panel" style={{ padding: 40, textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            No matching polls found.
          </div>
        ) : filteredPolls.map(poll => (
          <div key={poll.id} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.4, marginBottom: 3 }}>{poll.question}</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))' }}>{poll.id}</div>
              </div>
              {statusPill(poll.status)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>group</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))' }}>Field participants</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))' }}>{poll.totalVotes.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ height: 4, background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%', background: poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))', transition: 'width 1s' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>HQ Verified</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))' }}>Expires</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{poll.endDate}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', background: 'hsl(var(--accent))', color: '#fff' }} onClick={() => setViewPoll(poll)}>
                Manage Campaign
              </button>
              <button className="btn btn-dest" style={{ width: 44, padding: 0, justifyContent: 'center' }} onClick={() => handleDeletePoll(poll.id, poll.question)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="settings-form-grid" style={{ alignItems: 'stretch' }}>
        {/* Maximize engagement dark panel */}
        <div style={{ background: 'hsl(var(--on-surface))', borderRadius: 6, padding: 28, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>Maximize engagement</h4>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
            Use regional-specific polls to gather more precise data. Our research shows chapters with localized campaigns see 40% higher member participation.
          </p>
          <button
            className="btn btn-sm"
            style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
            onClick={() => setIsAnalyticsModalOpen(true)}
          >
            Scan Analytics Guide
          </button>
          <span className="material-symbols-outlined" style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 110, color: 'rgba(255,255,255,0.04)', transform: 'rotate(12deg)', pointerEvents: 'none' }}>bar_chart</span>
        </div>

        {/* Recent feedback highlights */}
        <div className="panel">
          <div className="ph">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>forum</span>
              Recent feedback highlights
            </span>
          </div>
          <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 38, height: 38, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>forum</span>
              </div>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                "The new regional chapter meetings have significantly improved communication between constituency leads…"
              </p>
            </div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
              — Member feedback from Ashanti Region
            </p>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--accent))', padding: 0 }}
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              Scan Feedback Vault
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Create Poll Modal ── */}
      {showCreateModal && (
        <div style={modalBackdrop}>
          <div style={modalBox(720)}>
            <div className="ph">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>add</span>
                Create Campaign
              </span>
              <button style={modalCloseBtn} onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreatePoll}>
              <div style={{ padding: 24 }}>
                <div className="settings-form-grid">
                  {/* Left: core details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelSt}>Campaign question / topic</label>
                      <input style={inputSt} required placeholder="e.g. Should we increase regional chapter funding?" value={newPoll.question} onChange={e => setNewPoll({ ...newPoll, question: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelSt}>Target Audience Base</label>
                      <select
                        style={selectSt}
                        value={newPoll.targetBase}
                        onChange={e => {
                          const val = e.target.value
                          setNewPoll({ ...newPoll, targetBase: val, region: val === 'GHANA' ? 'National' : 'International' })
                        }}
                      >
                        <option value="GHANA">Ghana Local Base</option>
                        <option value="DIASPORA">Diaspora Global Base</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>{newPoll.targetBase === 'GHANA' ? 'Specific Region' : 'Target Country'}</label>
                      <select
                        style={selectSt}
                        value={newPoll.targetBase === 'GHANA' ? newPoll.region : newPoll.country}
                        onChange={e => {
                          if (newPoll.targetBase === 'GHANA') setNewPoll({ ...newPoll, region: e.target.value })
                          else setNewPoll({ ...newPoll, country: e.target.value })
                        }}
                      >
                        {newPoll.targetBase === 'GHANA' ? (
                          <>
                            <option value="National">All Regions (National)</option>
                            {availableRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </>
                        ) : (
                          <>
                            <option value="International">All Countries (Global)</option>
                            {availableCountries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>Operational end date</label>
                      <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>calendar_today</span>
                        <input type="date" style={{ ...inputSt, paddingLeft: 34 }} value={newPoll.endDate} onChange={e => setNewPoll({ ...newPoll, endDate: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Right: poll options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ ...labelSt, marginBottom: 0 }}>Engagement Options</label>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Min 2 Required</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                      {newPoll.options.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8 }}>
                          <input
                            style={inputSt}
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={e => {
                              const updated = [...newPoll.options]
                              updated[idx] = e.target.value
                              setNewPoll({ ...newPoll, options: updated })
                            }}
                          />
                          {newPoll.options.length > 2 && (
                            <button
                              type="button"
                              style={{ flexShrink: 0, width: 40, height: 40, border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--container-low))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--destructive))' }}
                              onClick={() => setNewPoll({ ...newPoll, options: newPoll.options.filter((_, i) => i !== idx) })}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                      Add Selection
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', height: 44 }} onClick={() => setShowCreateModal(false)}>Discard</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: 44 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Launching…' : 'Deploy Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Feedback Vault Modal ── */}
      {isFeedbackModalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox(600)}>
            <div className="ph">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>forum</span>
                Movement Feedback Vault
              </span>
              <button style={modalCloseBtn} onClick={() => setIsFeedbackModalOpen(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { author: 'Ashanti Member', region: 'Ashanti', text: 'The new regional chapter meetings have significantly improved communication between constituency leads.' },
                { author: 'Greater Accra Lead', region: 'Greater Accra', text: 'Requesting more mobilization materials for the upcoming town hall sessions.' },
                { author: 'Western Member', region: 'Western', text: 'The digital strategy polls are a great way to stay engaged with the leadership.' }
              ].map((fb, idx) => (
                <div key={idx} style={{ padding: 16, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'hsl(var(--on-surface))', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>"{fb.text}"</p>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>— {fb.author} from {fb.region} Region</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={() => setIsFeedbackModalOpen(false)}>Close Vault</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Poll Modal ── */}
      {viewPoll && (() => {
        const sorted = [...viewPoll.options].sort((a, b) => b.votes - a.votes)
        const leadId = sorted[0]?.id
        const days = Math.max(0, Math.ceil((new Date(viewPoll.endDate).getTime() - Date.now()) / 86400000))
        return (
          <div style={modalBackdrop} onClick={() => setViewPoll(null)}>
            <div style={modalBox(580)} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="ph">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: viewPoll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))' }}>bar_chart</span>
                  Poll Details
                  {statusPill(viewPoll.status)}
                </span>
                <button style={modalCloseBtn} onClick={() => setViewPoll(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Question + meta row */}
                <div>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, color: 'hsl(var(--on-surface))', lineHeight: 1.45, margin: '0 0 14px' }}>
                    {viewPoll.question}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {[
                      { icon: 'location_on', label: 'Region', value: viewPoll.region },
                      { icon: 'schedule', label: viewPoll.status === 'Active' ? `Closes in ${days} day${days !== 1 ? 's' : ''}` : 'End date', value: viewPoll.endDate },
                      { icon: 'group', label: 'Total votes', value: viewPoll.totalVotes.toLocaleString() },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>{m.icon}</span>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{m.label}:</span>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))' }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vote breakdown */}
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Vote Breakdown · {viewPoll.options.length} options
                  </p>
                  {sorted.map((option, rank) => {
                    const pct = viewPoll.totalVotes > 0 ? Math.round((option.votes / viewPoll.totalVotes) * 100) : 0
                    const isLead = option.id === leadId
                    return (
                      <div key={option.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10,
                              background: rank === 0 ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                              color: rank === 0 ? '#fff' : 'hsl(var(--on-surface-muted))',
                              border: rank === 0 ? 'none' : '1px solid hsl(var(--border))',
                            }}>{rank + 1}</span>
                            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: isLead ? 800 : 700, fontSize: 12.5, color: isLead ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface))' }}>
                              {option.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{option.votes.toLocaleString()} votes</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: isLead ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'hsl(var(--container-low))', borderRadius: 3, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, transition: 'width 0.8s ease',
                            background: rank === 0 ? 'hsl(var(--primary))' : rank === 1 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                            opacity: rank === 0 ? 1 : 0.55,
                            borderRadius: 3,
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total bar */}
                <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Total participation</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'hsl(var(--primary))' }}>{viewPoll.totalVotes.toLocaleString()} votes</span>
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-dest btn-sm"
                  style={{ justifyContent: 'center' }}
                  onClick={() => { setViewPoll(null); handleDeletePoll(viewPoll.id, viewPoll.question) }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                  Delete Poll
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setViewPoll(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Analytics Guide Modal ── */}
      {isAnalyticsModalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox(480)}>
            <div className="ph">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>bar_chart</span>
                Engagement Analytics Guide
              </span>
              <button style={modalCloseBtn} onClick={() => setIsAnalyticsModalOpen(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.7, margin: 0 }}>
                Learn how to interpret movement engagement data to drive more effective mobilization campaigns.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20, margin: 0 }}>
                {[
                  'Analyze regional participation rates to identify high-growth areas.',
                  'Monitor sentiment scores to proactively address movement concerns.',
                  'Use average response times to optimize survey length and timing.'
                ].map((item, i) => (
                  <li key={i} style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={() => setIsAnalyticsModalOpen(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
