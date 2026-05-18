import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MemberProfileCard } from '@/components/MemberProfileCard'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useAuth } from '@/context/AuthContext'
import type { Member } from '@/types/admin'

const professions = [
  'Healthcare', 'Education', 'Finance', 'Law', 'Technology',
  'Agriculture', 'Creative Arts', 'Engineering', 'Trade', 'Research'
]

const selectSt: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none', cursor: 'pointer',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700, fontSize: 12, borderRadius: 4,
  color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}

const inputSt: React.CSSProperties = { ...selectSt, cursor: 'text' }

function isVerified(m: Member) {
  return m.status === 'Active' || m.status === 'Approved' || !m.status
}

export default function Members() {
  const { user, isLoading: authLoading } = useAuth()
  const myAuthId = user?.id ?? null
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [myChapter, setMyChapter] = useState<string | null | undefined>(undefined)

  const [search, setSearch] = useState('')
  const [selectedProfession, setSelectedProfession] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    if (authLoading || !myAuthId) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Find which chapter this user belongs to or leads
        const { data: me } = await supabase
          .from('users')
          .select('chapter, full_name')
          .eq('id', myAuthId)
          .maybeSingle()

        let chapterName: string | null = me?.chapter || null

        // 2. If not a regular member, check if they're a chapter leader
        if (!chapterName && me?.full_name) {
          const { data: led } = await supabase
            .from('chapters')
            .select('name')
            .or(`leader_id.eq.${myAuthId},leader_name.ilike.${me.full_name}`)
            .maybeSingle()
          chapterName = led?.name || null
        }

        setMyChapter(chapterName)

        if (!chapterName) { setIsLoading(false); return }

        // 3. Fetch only members of that chapter directly
        const { data: rows } = await supabase
          .from('users')
          .select('id,registration_number,full_name,phone_number,region,constituency,status,joined_at,platform,avatar_url,profession,chapter,country')
          .eq('chapter', chapterName)
          .order('joined_at', { ascending: false })

        const mapped: Member[] = (rows || []).map(u => ({
          id: u.registration_number,
          authId: u.id,
          name: u.full_name,
          email: '',
          phone: u.phone_number || '',
          platform: u.platform === 'DIASPORA' ? 'DIASPORA' : 'GHANA',
          region: u.region || '',
          constituency: u.constituency || '',
          country: u.country || 'Ghana',
          profession: u.profession || 'Patriot',
          avatarUrl: u.avatar_url || undefined,
          status: u.status || 'Pending',
          joined: u.joined_at || '',
          type: u.platform === 'DIASPORA' ? 'Premium' : 'Standard',
          chapter: u.chapter || undefined,
        }))

        setMembers(mapped)
      } catch (error) {
        console.error('[MEMBERS] Data sync failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [myAuthId, authLoading])

  const chapterMembers = useMemo(() => members, [members])

  const filteredMembers = useMemo(() => {
    return chapterMembers
      .filter(m => {
        const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesProfession = selectedProfession === 'all' || m.profession === selectedProfession
        return matchesSearch && matchesProfession
      })
      .sort((a, b) => {
        const na = a.name || '', nb = b.name || ''
        return sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      })
  }, [chapterMembers, search, selectedProfession, sortOrder])

  const verifiedCount = chapterMembers.filter(m => isVerified(m)).length
  const isFiltered = search !== '' || selectedProfession !== 'all'

  if (isLoading) return <LoadingScreen />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SEO
        title="Chapter Directory"
        description="Connect with patriots in your chapter constituency."
        canonical="/members"
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
            {myChapter ? myChapter : 'Your chapter'}
          </div>
          <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'hsl(var(--on-surface))', margin: 0 }}>
            Chapter directory
          </h2>
        </div>
        {myChapter && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSortOrder(v => v === 'asc' ? 'desc' : 'asc')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>swap_vert</span>
            <span className="desktop-only">{sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
          </button>
        )}
      </div>

      {/* No chapter state */}
      {myChapter === null && (
        <div className="panel" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'hsl(var(--on-surface-muted))', opacity: 0.2, display: 'block', marginBottom: 16 }}>group_add</span>
          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, color: 'hsl(var(--on-surface))', marginBottom: 8 }}>
            You haven't joined a chapter yet
          </div>
          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Join your constituency chapter to connect with patriots in your area and see your local directory.
          </div>
          <Link to="/dashboard/chapters" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>explore</span>
            Browse chapters
          </Link>
        </div>
      )}

      {myChapter && (
        <>
          {/* KPIs */}
          <div className="kpis">
            {([
              { label: 'Chapter members',  value: chapterMembers.length, sub: myChapter,                        bar: 'hsl(var(--on-surface))',  val: 'hsl(var(--on-surface))',  icon: 'groups'   },
              { label: 'Verified',         value: verifiedCount,         sub: 'ID confirmed',                   bar: 'hsl(var(--primary))',     val: 'hsl(var(--on-surface))',  icon: 'verified' },
              { label: 'Ghana network',    value: chapterMembers.filter(m => m.platform === 'GHANA').length,    sub: 'Registered in Ghana',     bar: 'hsl(var(--accent))',      val: 'hsl(var(--on-surface))',  icon: 'flag'     },
              { label: 'Diaspora network', value: chapterMembers.filter(m => m.platform === 'DIASPORA').length, sub: 'International members',   bar: 'hsl(var(--destructive))', val: 'hsl(var(--on-surface))',  icon: 'public'   },
            ] as { label: string; value: number; sub: string; bar: string; val: string; icon: string }[]).map(kpi => (
              <div key={kpi.label} className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }} />
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 30, color: kpi.val, lineHeight: 1, marginBottom: 6 }}>{kpi.value}</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined desktop-only" style={{ fontSize: 12, color: kpi.bar }}>{kpi.icon}</span>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar + grid */}
          <div className="sidebar-main" style={{ alignItems: 'start' }}>

            {/* Filter sidebar */}
            <aside className="panel" style={{ padding: 0 }}>
              <div className="ph">
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>filter_list</span>
                  Filters
                </span>
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                  <input aria-label="Search by name" name="search" id="input-members-search"
                    type="text"
                    placeholder="Search by name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...inputSt, paddingLeft: 34, height: 40 }}
                  />
                </div>

                {/* Profession */}
                <div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--primary))' }}>work</span>
                    Profession
                  </div>
                  <select name="selectedProfession" id="select-members-profession" value={selectedProfession} onChange={e => setSelectedProfession(e.target.value)} style={selectSt}>
                    <option value="all">All professions</option>
                    {professions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {isFiltered && (
                  <button
                    className="btn btn-dest btn-sm"
                    style={{ justifyContent: 'center' }}
                    onClick={() => { setSearch(''); setSelectedProfession('all') }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    Clear filters
                  </button>
                )}
              </div>
            </aside>

            {/* Results */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} in {myChapter}
                </span>
                {isFiltered && (
                  <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setSelectedProfession('all') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    Clear
                  </button>
                )}
              </div>

              {filteredMembers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {filteredMembers.map(m => (
                    <MemberProfileCard key={m.id} member={m} setSelectedMember={setSelectedMember} />
                  ))}
                </div>
              ) : (
                <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2, display: 'block', marginBottom: 12 }}>manage_search</span>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>No members found</div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginBottom: 18 }}>
                    Try adjusting your search or filter.
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setSelectedProfession('all') }}>Clear filters</button>
                </div>
              )}

              <div style={{ marginTop: 32, borderLeft: '4px solid hsl(var(--primary))', paddingLeft: 20, paddingTop: 8, paddingBottom: 8 }}>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic', lineHeight: 1.7, margin: 0, maxWidth: 560 }}>
                  "Our strength lies in our unity at the grassroots. Every verified member of this chapter is a pillar in the foundation of the new Ghana we are building together."
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Member profile modal */}
      {selectedMember && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 6, border: '1px solid hsl(var(--border))', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: 80, background: 'hsl(var(--on-surface))', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', bottom: -24, left: 24, width: 52, height: 52, borderRadius: 4, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
                {selectedMember.avatarUrl
                  ? <img src={selectedMember.avatarUrl} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20 }}>
                      {selectedMember.name?.[0] || 'M'}
                    </div>
                }
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div style={{ padding: '36px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', margin: '0 0 3px' }}>
                    {selectedMember.name}
                  </h2>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    {selectedMember.profession || 'Member'}
                  </div>
                </div>
                <span className={isVerified(selectedMember) ? 'pill pill-ok' : 'pill pill-warn'}>
                  {isVerified(selectedMember) ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px 20px', marginBottom: 20 }}>
                {[
                  { icon: 'home_pin', label: 'Chapter', value: selectedMember.chapter },
                  { icon: 'location_on', label: 'Region', value: selectedMember.region },
                  { icon: 'work', label: 'Profession', value: selectedMember.profession },
                  ...(selectedMember.constituency ? [{ icon: 'how_to_reg', label: 'Constituency', value: selectedMember.constituency }] : []),
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--primary))' }}>{row.icon}</span>
                      {row.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedMember(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
