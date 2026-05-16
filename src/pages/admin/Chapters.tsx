import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { adminService } from '@/services/adminService'
import type { RegionalStat, Chapter } from '@/services/adminService'
import type { Member } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const,
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export default function ChaptersManagement() {
  const { chapters, addChapter, updateChapter, deleteChapter } = useChapters()
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    city_or_region: '',
    country: 'Ghana',
    description: '',
    status: 'Pending',
    leader_name: '',
  })
  const [modalMembers, setModalMembers] = useState<{ id: string; name: string; region: string }[]>([])
  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderList, setShowLeaderList] = useState(false)

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    const chapterData = {
      name: formData.name,
      city_or_region: formData.city_or_region,
      country: formData.country,
      leader_name: formData.leader_name || 'Unassigned',
      member_count: 0,
      status: formData.status as Chapter['status'],
    }
    if (editingChapterId) {
      const success = await updateChapter(editingChapterId, chapterData)
      if (success) toast.success(`Chapter "${formData.name}" updated.`)
    } else {
      const success = await addChapter(chapterData)
      if (success) toast.success(`Chapter "${formData.name}" registered.`)
    }
    closeModal()
  }

  const openAddModal = () => {
    setEditingChapterId(null)
    setFormData({ name: '', city_or_region: '', country: 'Ghana', description: '', status: 'Pending', leader_name: '' })
    setLeaderSearch('')
    setIsModalOpen(true)
    adminService.getMembers().then((members: Member[]) => {
      setModalMembers(members.filter(m => m.status === 'Active' || m.status === 'Approved').map(m => ({ id: m.id, name: m.name, region: m.region || '' })))
    })
  }

  const openEditModal = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setFormData({ name: chapter.name, city_or_region: chapter.city_or_region, country: chapter.country || 'Ghana', description: '', status: chapter.status, leader_name: chapter.leader_name || '' })
    setLeaderSearch(chapter.leader_name || '')
    setIsModalOpen(true)
    adminService.getMembers().then((members: Member[]) => {
      setModalMembers(members.filter(m => m.status === 'Active' || m.status === 'Approved').map(m => ({ id: m.id, name: m.name, region: m.region || '' })))
    })
  }

  const closeModal = () => { setIsModalOpen(false); setEditingChapterId(null); setLeaderSearch(''); setShowLeaderList(false) }

  useEffect(() => {
    adminService.getRegionalStats().then(setRegionalStats)
  }, [])

  useEffect(() => {
    if (chapters.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const chapterId = params.get('id')
      if (chapterId) {
        const chapter = chapters.find(c => c.id === chapterId)
        if (chapter) {
          setTimeout(() => {
            openEditModal(chapter)
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [chapters])

  const handleDeleteChapter = async (id: string, name: string) => {
    if (window.confirm(`Decommission the "${name}" chapter?`)) {
      const success = await deleteChapter(id, name)
      if (success) toast.error(`Chapter "${name}" decommissioned.`)
    }
  }

  const handleVerifyChapter = async (id: string, name: string) => {
    const success = await adminService.updateChapter(id, { status: 'Active' })
    if (success) {
      updateChapter(id, { status: 'Active' })
      toast.success(`"${name}" verified and activated.`)
    } else {
      toast.error('Verification failed.')
    }
  }

  const filteredChapters = useMemo(() => chapters.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.city_or_region.toLowerCase().includes(search.toLowerCase())
    const normalized = c.status === 'Active' ? 'Active' : 'Pending'
    return matchesSearch && (statusFilter === 'All' || normalized === statusFilter)
  }), [chapters, search, statusFilter])

  const totalMembers = useMemo(() => chapters.reduce((s, c) => s + (c.member_count || 0), 0), [chapters])
  const activeCount = useMemo(() => chapters.filter(c => c.status === 'Active').length, [chapters])
  const pendingCount = useMemo(() => chapters.filter(c => c.status !== 'Active').length, [chapters])

  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredChapters.slice(start, start + itemsPerPage)
  }, [filteredChapters, currentPage])

  const maxMemberCount = useMemo(() => Math.max(...regionalStats.map(s => s.memberCount), 1), [regionalStats])

  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            Chapters
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>location_on</span>
            Chapters
          </h2>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={() => toast.info('Accessing audit vault...')}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span>
            Audit trail
          </button>
          {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
            <button className="btn btn-dest btn-sm" onClick={openAddModal}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              Add chapter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI 
          label="Total chapters"
          value={chapters.length}
          description="Registered hubs"
        />
        <TacticalKPI 
          label="Total members"
          value={totalMembers}
          description="Across all chapters"
          trend={{ direction: 'up', value: '+12%' }}
        />
        <TacticalKPI 
          label="Active"
          value={activeCount}
          description="Operational hubs"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI 
          label="Pending"
          value={pendingCount}
          description="Awaiting activation"
          trend={{ direction: 'neutral', value: 'Review' }}
        />
      </div>

      {/* Charts row */}
      <div className="chapters-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Scatter chart */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Resource-to-impact correlation</h3>
              <div className="meta">Chapter density vs. mobilization strength</div>
            </div>
          </div>
          <div style={{ padding: '0 18px 18px', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" dataKey="chapters" name="Chapters" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                  label={{ value: 'Chapter Density', position: 'bottom', offset: 0, fontSize: 10, fill: 'rgba(0,0,0,0.4)' }}
                />
                <YAxis type="number" dataKey="memberCount" name="Patriots" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                  label={{ value: 'Mobilization Strength', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(0,0,0,0.4)' }}
                />
                <ZAxis type="number" dataKey="chapters" range={[60, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f1310', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}
                  itemStyle={{ fontSize: 10, fontWeight: 700 }}
                />
                <Scatter name="Regions" data={regionalStats} fill="#006b3f">
                  {regionalStats.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional footprint */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Logistical footprint</h3>
              <div className="meta">Jurisdictional resource distribution</div>
            </div>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {regionalStats.slice(0, 6).map(stat => (
              <div key={stat.region}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))' }}>{stat.region}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))' }}>{stat.chapters} hubs</span>
                </div>
                <div style={{ height: 5, background: 'hsl(var(--border))', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((stat.memberCount / maxMemberCount) * 100, 100)}%`, background: stat.color, transition: 'width 0.8s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional movement density */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">
          <div>
            <h3>Regional movement density</h3>
            <div className="meta desktop-only">Geospatial distribution of chapters and mobilization strength</div>
          </div>
          <div className="desktop-only" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {[
              { color: '#006b3f', label: 'High strength' },
              { color: '#DAA520', label: 'Moderate' },
              { color: 'hsl(var(--border)))', label: 'Emerging' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: color, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chapters-density-split" style={{ padding: '18px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* SVG Map */}
          <div style={{ width: 240, flexShrink: 0, border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden', position: 'relative', aspectRatio: '4/5' }}>
            <svg viewBox="0 0 400 500" style={{ width: '100%', height: '100%', padding: 24 }}>
              <path d="M50,50 L350,50 L350,200 L50,200 Z" style={{ fill: 'rgba(206,17,38,0.15)', stroke: 'rgba(206,17,38,0.4)', strokeWidth: 2 }} className="cursor-pointer transition-all hover:opacity-70" />
              <path d="M50,205 L350,205 L350,350 L50,350 Z" style={{ fill: 'rgba(218,165,32,0.2)', stroke: 'rgba(218,165,32,0.4)', strokeWidth: 2 }} className="cursor-pointer transition-all hover:opacity-70" />
              <path d="M50,355 L200,355 L200,480 L50,480 Z" style={{ fill: 'rgba(0,107,63,0.25)', stroke: 'rgba(0,107,63,0.4)', strokeWidth: 2 }} className="cursor-pointer transition-all hover:opacity-70" />
              <path d="M205,355 L350,355 L350,480 L205,480 Z" style={{ fill: 'rgba(0,107,63,0.25)', stroke: 'rgba(0,107,63,0.4)', strokeWidth: 2 }} className="cursor-pointer transition-all hover:opacity-70" />
              <circle cx="275" cy="420" r="8" fill="#1a1d19" className="animate-pulse" />
              <circle cx="125" cy="420" r="8" fill="#1a1d19" />
              <circle cx="200" cy="275" r="8" fill="#1a1d19" />
              <circle cx="100" cy="125" r="8" fill="#1a1d19" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'rgba(0,0,0,.12)', transform: 'rotate(-45deg)', letterSpacing: '.04em', textTransform: 'uppercase' }}>National Geospatial Grid</span>
            </div>
          </div>

          {/* Regional performance */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid hsl(var(--border))' }}>
              Regional performance tier
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regionalStats.map(stat => (
                <div key={stat.region}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif" }}>{stat.region}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))' }}>{stat.performance} impact</span>
                  </div>
                  <div style={{ height: 5, background: 'hsl(var(--border))', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stat.memberCount / 20000) * 100}%`, background: stat.color, transition: 'width 0.8s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter - Desktop */}
      <div className="desktop-only" style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
          <input name="search" id="input-f2d090"
            type="text"
            placeholder="Search chapters by name or region..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            style={{ ...fieldStyle, paddingLeft: 34 }}
          />
        </div>
        <select name="statusFilter" id="select-b86bb7"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as 'All' | 'Active' | 'Pending'); setCurrentPage(1) }}
          style={{ ...fieldStyle, width: 160, appearance: 'none' as const }}
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Search + filter - Mobile (Step 5 Pattern) */}
      <div className="mobile-only" style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'hsl(var(--container-low))', padding: '12px', borderRadius: 6, border: '1px solid hsl(var(--border))' }}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>search</span>
          <input name="search" id="input-cdadcc"
            style={{ ...fieldStyle, width: '100%', height: 38, paddingLeft: 30, boxSizing: 'border-box' }}
            placeholder="Search chapters..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {(['All', 'Active', 'Pending'] as const).map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
              className={`btn btn-sm ${statusFilter === status ? 'btn-dest' : 'btn-outline'}`}
              style={{ flexShrink: 0, fontSize: 10, height: 26 }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginBottom: 14 }}>
        {currentChapters.map(chapter => (
          <div key={chapter.id} className="panel">
            <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 3 }}>
                  {chapter.id.slice(0, 8)}
                </div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chapter.name}
                </h4>
              </div>
              <span className="pill pill-mute" style={{ flexShrink: 0 }}>
                {chapter.status}
              </span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 3 }}>
                  Regional hub
                </div>
                <b style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))' }}>
                  {chapter.city_or_region}
                </b>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 3 }}>
                  Strength
                </div>
                <b style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--primary))' }}>group</span>
                  {(chapter.member_count || 0).toLocaleString()}
                </b>
              </div>
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link to={`/admin/chapter-hub/${chapter.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11, textDecoration: 'none' }}>
                Hub
              </Link>
              {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                <>
                  {chapter.status !== 'Active' && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => handleVerifyChapter(chapter.id, chapter.name)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                      Verify
                    </button>
                  )}
                  <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => openEditModal(chapter)}>
                    Configure
                  </button>
                  <button className="btn btn-dest btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => handleDeleteChapter(chapter.id, chapter.name)}>
                    Decommission
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Add new chapter card */}
        {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
          <div
            className="panel"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '30px 14px', border: '1px dashed hsl(var(--border))', minHeight: 140, transition: 'border-color 0.15s, background 0.15s' }}
            onClick={openAddModal}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.background = 'rgba(0,107,63,.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.background = '#fff' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--primary))' }}>add_circle</span>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--primary))' }}>Add new chapter</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
          <span style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredChapters.length)} of {filteredChapters.length} chapters
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${currentPage === i + 1 ? 'btn-dest' : 'btn-outline'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn btn-outline btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="panel" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Dark header */}
            <div className="member-detail-header" style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', borderTop: '3px solid hsl(var(--primary))', borderRadius: '6px 6px 0 0', padding: '16px 18px' }}>
              <h3 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>location_on</span>
                {editingChapterId ? 'Configure regional hub' : 'Add new chapter'}
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,.45)', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, lineHeight: 1.5 }}>
                {editingChapterId
                  ? 'Update infrastructure settings and mobilization status for this regional cell.'
                  : 'Register a new mobilization hub. Visible publicly once activated.'}
              </p>
            </div>

            <form onSubmit={handleSaveChapter}>
              <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="chapters-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Chapter name <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                    <input name="name-9869cd" id="input-9869cd" type="text" required placeholder="e.g. Adabraka hub" style={fieldStyle}
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>City / region <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                    <input name="name-1d4389" id="input-1d4389" type="text" required placeholder="e.g. Accra" style={fieldStyle}
                      value={formData.city_or_region} onChange={e => setFormData({ ...formData, city_or_region: e.target.value })} />
                  </div>
                </div>
                <div className="chapters-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Country <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                    <input name="name-a45a5a" id="input-a45a5a" type="text" required placeholder="e.g. Ghana" style={fieldStyle}
                      value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hub status</label>
                    <select name="name-9716c5" id="select-9716c5" style={{ ...fieldStyle, appearance: 'none' as const }}
                      value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>
                </div>
                {/* Leader picker */}
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Chapter leader</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>person_search</span>
                    <input name="leaderSearch" id="input-014d9d"
                      type="text"
                      placeholder="Search verified members…"
                      value={leaderSearch}
                      onChange={e => { setLeaderSearch(e.target.value); setShowLeaderList(true); if (!e.target.value) setFormData(f => ({ ...f, leader_name: '' })) }}
                      onFocus={() => setShowLeaderList(true)}
                      onBlur={() => setTimeout(() => setShowLeaderList(false), 150)}
                      style={{ ...fieldStyle, paddingLeft: 34 }}
                    />
                  </div>
                  {showLeaderList && leaderSearch && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {modalMembers
                        .filter(m => m.name.toLowerCase().includes(leaderSearch.toLowerCase()) || m.region.toLowerCase().includes(leaderSearch.toLowerCase()))
                        .slice(0, 8)
                        .map(m => (
                          <div
                            key={m.id}
                            onMouseDown={() => { setFormData(f => ({ ...f, leader_name: m.name })); setLeaderSearch(m.name); setShowLeaderList(false) }}
                            style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--container-low))'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <span style={{ color: 'hsl(var(--on-surface))' }}>{m.name}</span>
                            <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{m.region}</span>
                          </div>
                        ))
                      }
                      {modalMembers.filter(m => m.name.toLowerCase().includes(leaderSearch.toLowerCase())).length === 0 && (
                        <p style={{ padding: '10px 12px', fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>No members found</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Mission description</label>
                  <textarea name="name-5f2aa3" id="textarea-5f2aa3"
                    rows={3}
                    placeholder="Describe the chapter's focus area..."
                    style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.55 }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ padding: '14px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'hsl(var(--container-low))', borderRadius: '0 0 6px 6px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-dest" style={{ minWidth: 160 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {editingChapterId ? 'sync' : 'add_circle'}
                  </span>
                  {editingChapterId ? 'Save changes' : 'Add chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
