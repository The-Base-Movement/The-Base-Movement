import { useState, useMemo, useEffect } from 'react'
import { MemberProfileCard } from '@/components/MemberProfileCard'
import SEO from '@/components/SEO'
import { adminService } from '@/services/adminService'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { Member } from '@/types/admin'

const diasporaCountries = [
  'United Kingdom', 'United States', 'Canada', 'Germany', 'France',
  'Australia', 'South Africa', 'United Arab Emirates', 'Netherlands', 'Italy'
]

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

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10,
  color: 'hsl(var(--on-surface-muted))', display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}

const inputSt: React.CSSProperties = {
  ...selectSt, cursor: 'text',
}

function isVerified(m: Member) {
  return m.status === 'Active' || m.status === 'Approved' || !m.status
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ghanaRegions, setGhanaRegions] = useState<string[]>([])
  const [regionConstituencies, setRegionConstituencies] = useState<Record<string, string[]>>({})

  const [search, setSearch] = useState('')
  const [activePlatform, setActivePlatform] = useState<'GHANA' | 'DIASPORA'>('GHANA')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedConstituency, setSelectedConstituency] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedProfession, setSelectedProfession] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [fetchedMembers, fetchedRegions] = await Promise.all([
          adminService.getMembers(),
          adminService.getRegions()
        ])

        const mappedMembers: Member[] = fetchedMembers.map(m => ({
          id: m.id || Math.random().toString(),
          name: m.name || 'Unnamed Patriot',
          email: m.email || '',
          phone: m.phone || '',
          platform: m.type === 'Standard' ? 'GHANA' : 'DIASPORA',
          region: m.region || '',
          constituency: m.constituency || '',
          country: m.country || 'Ghana',
          profession: m.profession || 'Patriot',
          avatarUrl: m.avatarUrl || undefined,
          status: m.status || 'Pending',
          joined: m.joined || new Date().toISOString(),
          type: m.type || 'Standard'
        }))

        const regionsArr: string[] = []
        const constMap: Record<string, string[]> = {}
        fetchedRegions.forEach(r => {
          if (r.name) {
            regionsArr.push(r.name)
            constMap[r.name] = r.constituencies || []
          }
        })

        setMembers(mappedMembers)
        setGhanaRegions(regionsArr)
        setRegionConstituencies(constMap)
      } catch (error) {
        console.error('[MEMBERS] Data sync failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredMembers = useMemo(() => {
    return members
      .filter(m => {
        const matchesPlatform = m.platform === activePlatform
        const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesProfession = selectedProfession === 'all' || m.profession === selectedProfession
        if (activePlatform === 'GHANA') {
          const matchesRegion = selectedRegion === 'all' || m.region === selectedRegion
          const matchesConst = selectedConstituency === 'all' || m.constituency === selectedConstituency
          return matchesPlatform && matchesSearch && matchesRegion && matchesConst && matchesProfession
        } else {
          const matchesCountry = selectedCountry === 'all' || m.country === selectedCountry
          return matchesPlatform && matchesSearch && matchesCountry && matchesProfession
        }
      })
      .sort((a, b) => {
        const na = a.name || '', nb = b.name || ''
        return sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      })
  }, [members, activePlatform, search, selectedRegion, selectedConstituency, selectedCountry, selectedProfession, sortOrder])

  const constituencies = useMemo(() => {
    if (selectedRegion === 'all') return []
    return regionConstituencies[selectedRegion] || []
  }, [selectedRegion, regionConstituencies])

  const isFiltered = search !== '' || selectedRegion !== 'all' || selectedConstituency !== 'all' || selectedCountry !== 'all' || selectedProfession !== 'all'

  const clearFilters = () => {
    setSearch('')
    setSelectedRegion('all')
    setSelectedConstituency('all')
    setSelectedCountry('all')
    setSelectedProfession('all')
  }

  const ghanaCount = members.filter(m => m.platform === 'GHANA').length
  const diasporaCount = members.filter(m => m.platform === 'DIASPORA').length
  const verifiedCount = members.filter(m => isVerified(m)).length

  if (isLoading) return <LoadingScreen />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SEO
        title="Movement Directory"
        description="Connect with brothers and sisters committed to building a new Ghana. Search across verified members worldwide."
        canonical="/members"
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
            Movement network
          </div>
          <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'hsl(var(--on-surface))', margin: 0 }}>
            Movement directory
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="mobile-only btn btn-outline btn-sm"
            onClick={() => setShowMobileFilters(v => !v)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>filter_list</span>
            Filters
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSortOrder(v => v === 'asc' ? 'desc' : 'asc')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>swap_vert</span>
            <span className="desktop-only">{sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="panel" style={{ padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ borderLeft: '3px solid hsl(var(--primary))', paddingLeft: 12 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total patriots</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', lineHeight: 1 }}>{members.length}</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Across all networks</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ borderLeft: '3px solid hsl(var(--primary))', paddingLeft: 12 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ghana network</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', lineHeight: 1 }}>{ghanaCount}</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Registered in Ghana</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 12 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Diaspora network</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', lineHeight: 1 }}>{diasporaCount}</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>International patriots</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ borderLeft: '3px solid hsl(var(--primary))', paddingLeft: 12 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Verified</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--primary))', lineHeight: 1 }}>{verifiedCount}</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span>
              ID confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter panel */}
      {showMobileFilters && (
        <div className="mobile-only panel" style={{ padding: 16 }}>
          <FilterControls
            search={search} setSearch={setSearch}
            activePlatform={activePlatform} setActivePlatform={p => { setActivePlatform(p); setSelectedRegion('all'); setSelectedConstituency('all'); setSelectedCountry('all') }}
            selectedRegion={selectedRegion} setSelectedRegion={r => { setSelectedRegion(r); setSelectedConstituency('all') }}
            selectedConstituency={selectedConstituency} setSelectedConstituency={setSelectedConstituency}
            selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
            selectedProfession={selectedProfession} setSelectedProfession={setSelectedProfession}
            ghanaRegions={ghanaRegions} constituencies={constituencies}
            isFiltered={isFiltered} clearFilters={clearFilters}
            inputSt={inputSt} selectSt={selectSt} labelSt={labelSt}
          />
        </div>
      )}

      {/* Sidebar + grid */}
      <div className="sidebar-main" style={{ alignItems: 'start' }}>

        {/* Desktop filter sidebar */}
        <aside className="panel desktop-only" style={{ padding: 0 }}>
          <div className="ph">
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>filter_list</span>
              Directory filters
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <FilterControls
              search={search} setSearch={setSearch}
              activePlatform={activePlatform} setActivePlatform={p => { setActivePlatform(p); setSelectedRegion('all'); setSelectedConstituency('all'); setSelectedCountry('all') }}
              selectedRegion={selectedRegion} setSelectedRegion={r => { setSelectedRegion(r); setSelectedConstituency('all') }}
              selectedConstituency={selectedConstituency} setSelectedConstituency={setSelectedConstituency}
              selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
              selectedProfession={selectedProfession} setSelectedProfession={setSelectedProfession}
              ghanaRegions={ghanaRegions} constituencies={constituencies}
              isFiltered={isFiltered} clearFilters={clearFilters}
              inputSt={inputSt} selectSt={selectSt} labelSt={labelSt}
            />
          </div>
        </aside>

        {/* Results */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              {filteredMembers.length} patriot{filteredMembers.length !== 1 ? 's' : ''} found
            </span>
            {isFiltered && (
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Clear filters
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
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2, display: 'block', marginBottom: 12 }}>groups</span>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>No patriots found</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginBottom: 18 }}>
                Try adjusting your filters or search term.
              </div>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          {/* Quote strip */}
          <div style={{ marginTop: 32, borderLeft: '4px solid hsl(var(--primary))', paddingLeft: 20, paddingTop: 8, paddingBottom: 8 }}>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic', lineHeight: 1.7, margin: 0, maxWidth: 560 }}>
              "Our strength lies in our unity across borders. Every verified patriot is a pillar in the foundation of the new Ghana we are building."
            </p>
          </div>
        </div>
      </div>

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
            {/* Banner */}
            <div style={{ height: 80, background: 'hsl(var(--on-surface))', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', bottom: -24, left: 24, width: 52, height: 52, borderRadius: 4, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
                {selectedMember.avatarUrl
                  ? <img src={selectedMember.avatarUrl} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20 }}>
                      {selectedMember.name?.[0] || 'P'}
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

            {/* Content */}
            <div style={{ padding: '36px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', margin: '0 0 3px' }}>
                    {selectedMember.name}
                  </h2>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    {selectedMember.profession}
                  </div>
                </div>
                <span className={isVerified(selectedMember) ? 'pill pill-ok' : 'pill pill-warn'}>
                  {isVerified(selectedMember) ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
                {[
                  { icon: 'public', label: 'Network', value: selectedMember.platform === 'GHANA' ? 'Ghana' : 'Diaspora' },
                  { icon: 'location_on', label: 'Location', value: selectedMember.platform === 'GHANA' ? selectedMember.region : selectedMember.country },
                  { icon: 'work', label: 'Profession', value: selectedMember.profession },
                  ...(selectedMember.platform === 'GHANA' && selectedMember.constituency ? [{ icon: 'how_to_reg', label: 'Constituency', value: selectedMember.constituency }] : []),
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

              <div style={{ background: 'hsl(var(--container-low))', borderRadius: 4, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, margin: 0 }}>
                  Committed to the growth and prosperity of Ghana. An active participant in community development projects and movement initiatives, focused on building a better future.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedMember(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                  Close profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FilterControlsProps {
  search: string
  setSearch: (v: string) => void
  activePlatform: 'GHANA' | 'DIASPORA'
  setActivePlatform: (v: 'GHANA' | 'DIASPORA') => void
  selectedRegion: string
  setSelectedRegion: (v: string) => void
  selectedConstituency: string
  setSelectedConstituency: (v: string) => void
  selectedCountry: string
  setSelectedCountry: (v: string) => void
  selectedProfession: string
  setSelectedProfession: (v: string) => void
  ghanaRegions: string[]
  constituencies: string[]
  isFiltered: boolean
  clearFilters: () => void
  inputSt: React.CSSProperties
  selectSt: React.CSSProperties
  labelSt: React.CSSProperties
}

function FilterControls({
  search, setSearch,
  activePlatform, setActivePlatform,
  selectedRegion, setSelectedRegion,
  selectedConstituency, setSelectedConstituency,
  selectedCountry, setSelectedCountry,
  selectedProfession, setSelectedProfession,
  ghanaRegions, constituencies,
  isFiltered, clearFilters,
  inputSt, selectSt, labelSt,
}: FilterControlsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Search */}
      <div>
        <label style={labelSt}>Search patriots</label>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
          <input
            type="text"
            placeholder="Name or profession…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputSt, paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Platform toggle */}
      <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 14 }}>
        <label style={labelSt}>Movement network</label>
        <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
          {(['GHANA', 'DIASPORA'] as const).map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              style={{
                flex: 1, padding: '8px 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 800,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none',
                cursor: 'pointer', transition: 'all 0.15s',
                background: activePlatform === p ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                color: activePlatform === p ? '#fff' : 'hsl(var(--on-surface-muted))',
              }}
            >
              {p === 'GHANA' ? 'Ghana' : 'Diaspora'}
            </button>
          ))}
        </div>
      </div>

      {/* Location filters */}
      <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={labelSt}>Location</label>

        {activePlatform === 'GHANA' ? (
          <>
            <div>
              <label style={{ ...labelSt, marginBottom: 4, fontSize: 9 }}>Region</label>
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={selectSt}>
                <option value="all">All regions</option>
                {ghanaRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelSt, marginBottom: 4, fontSize: 9 }}>Constituency</label>
              <select value={selectedConstituency} onChange={e => setSelectedConstituency(e.target.value)} style={{ ...selectSt, opacity: selectedRegion === 'all' ? 0.5 : 1 }} disabled={selectedRegion === 'all'}>
                <option value="all">All constituencies</option>
                {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label style={{ ...labelSt, marginBottom: 4, fontSize: 9 }}>Country</label>
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={selectSt}>
              <option value="all">All countries</option>
              {diasporaCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Profession */}
      <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 14 }}>
        <label style={labelSt}>Professional field</label>
        <select value={selectedProfession} onChange={e => setSelectedProfession(e.target.value)} style={selectSt}>
          <option value="all">All professions</option>
          {professions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Clear */}
      {isFiltered && (
        <button className="btn btn-dest btn-sm" style={{ justifyContent: 'center' }} onClick={clearFilters}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          Clear all filters
        </button>
      )}
    </div>
  )
}
