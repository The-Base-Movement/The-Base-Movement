import { useState, useMemo, useEffect } from 'react'
import { EmptyState, Skeleton } from '@/components/states'
import { MemberProfileCard } from '@/components/MemberProfileCard'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Member } from '@/types/admin'
import { MembersHeader } from './members/MembersHeader'
import { MembersNoChapter } from './members/MembersNoChapter'
import { MembersKPIs } from './members/MembersKPIs'
import { MembersFilterSidebar } from './members/MembersFilterSidebar'
import MembershipCard from '@/components/MembershipCard'

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
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    if (authLoading || !myAuthId) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const { data: me } = await supabase
          .from('users')
          .select('chapter, full_name')
          .eq('id', myAuthId)
          .maybeSingle()

        let chapterName: string | null = me?.chapter || null

        if (!chapterName && me?.full_name) {
          const { data: led } = await supabase
            .from('chapters')
            .select('name')
            .or(`leader_id.eq.${myAuthId},leader_name.ilike.${me.full_name}`)
            .maybeSingle()
          chapterName = led?.name || null
        }

        setMyChapter(chapterName)
        if (!chapterName) {
          setIsLoading(false)
          return
        }

        const { data: rows } = await supabase.rpc('get_chapter_directory_members', {
          requested_chapter: chapterName,
        })

        const mapped: Member[] = (
          (rows as Array<
            Record<string, string | null> & { auth_id?: string | null; joined_at?: string | null }
          > | null) || []
        ).map((u) => ({
          id: u.registration_number || 'TBM-GH-****',
          authId: u.auth_id || undefined,
          name: u.full_name || 'Unknown',
          email: '',
          phone: u.phone_number || '',
          platform: u.platform === 'DIASPORA' ? 'DIASPORA' : 'GHANA',
          region: u.region || '',
          constituency: u.constituency || '',
          country: u.country || 'Ghana',
          profession: u.profession || 'Compatriot',
          avatarUrl: u.avatar_url || undefined,
          status: (u.status as Member['status']) || 'Pending',
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
      .filter((m) => {
        const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesProfession =
          selectedProfession === 'all' || m.profession === selectedProfession
        return matchesSearch && matchesProfession
      })
      .sort((a, b) => {
        const na = a.name || '',
          nb = b.name || ''
        return sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      })
  }, [chapterMembers, search, selectedProfession, sortOrder])

  const verifiedCount = chapterMembers.filter((m) => isVerified(m)).length
  const isFiltered = search !== '' || selectedProfession !== 'all'
  const clearFilters = () => {
    setSearch('')
    setSelectedProfession('all')
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const pagedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (isLoading)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="kpis">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'hsl(var(--border))',
                }}
              />
              <Skeleton variant="text-sm" width={80} style={{ marginBottom: 8 }} />
              <Skeleton variant="text-xl" width={60} />
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Skeleton variant="avatar" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton variant="text-md" width="70%" />
                  <Skeleton variant="text-sm" width="50%" />
                </div>
              </div>
              <Skeleton variant="text-sm" width="60%" />
              <Skeleton variant="btn" />
            </div>
          ))}
        </div>
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SEO
        title="Chapter Directory"
        description="Connect with compatriots in your chapter constituency."
        canonical="/members"
      />

      <MembersHeader myChapter={myChapter} sortOrder={sortOrder} onToggleSort={setSortOrder} />

      {myChapter === null && <MembersNoChapter />}

      {myChapter && (
        <>
          <MembersKPIs
            chapterMembers={chapterMembers}
            verifiedCount={verifiedCount}
            myChapter={myChapter}
          />

          <div className="sidebar-main" style={{ alignItems: 'start' }}>
            <MembersFilterSidebar
              search={search}
              selectedProfession={selectedProfession}
              isFiltered={isFiltered}
              chapterName={myChapter}
              onSearchChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              onProfessionChange={(v) => {
                setSelectedProfession(v)
                setPage(1)
              }}
              onClearFilters={clearFilters}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                  paddingBottom: 12,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} in{' '}
                  {myChapter}
                </span>
                {isFiltered && (
                  <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      close
                    </span>
                    Clear
                  </button>
                )}
              </div>

              {filteredMembers.length > 0 ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {pagedMembers.map((m) => (
                      <MemberProfileCard
                        key={m.id}
                        member={m}
                        setSelectedMember={setSelectedMember}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: '1px solid hsl(var(--border))',
                      }}
                    >
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        style={{ minWidth: 36 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          chevron_left
                        </span>
                      </button>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          minWidth: 80,
                          textAlign: 'center',
                        }}
                      >
                        Page {page} of {totalPages}
                      </span>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        style={{ minWidth: 36 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          chevron_right
                        </span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon="manage_search"
                  title="No members found"
                  body="Try adjusting your search or filter."
                  action={
                    <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                      Clear filters
                    </button>
                  }
                />
              )}

              <div
                style={{
                  marginTop: 32,
                  borderLeft: '4px solid hsl(var(--primary))',
                  paddingLeft: 20,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 14,
                    color: 'hsl(var(--on-surface-muted))',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 560,
                  }}
                >
                  "Our strength lies in our unity at the grassroots. Every verified member of this
                  chapter is a pillar in the foundation of the new Ghana we are building together."
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedMember && (
        <div
          className="member-modal-overlay"
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
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="member-modal-dialog"
            style={{
              background: 'hsl(var(--card))',
              borderRadius: 6,
              border: '1px solid hsl(var(--border))',
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                height: 80,
                background: 'hsl(var(--container-low))',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: -24,
                  left: 24,
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  overflow: 'hidden',
                }}
              >
                {selectedMember.avatarUrl ? (
                  <img
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'hsl(var(--primary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 20,
                    }}
                  >
                    {selectedMember.name?.[0] || 'M'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>

            <div className="member-card-embed" style={{ padding: 16 }}>
              <MembershipCard
                userName={selectedMember.name}
                userRegNo={selectedMember.id}
                region={selectedMember.region}
                constituency={selectedMember.constituency}
                chapter={selectedMember.chapter}
                joinedDate={selectedMember.joined}
                status={selectedMember.status}
                avatarUrl={selectedMember.avatarUrl}
                country={selectedMember.country}
              />
            </div>

            <div className="member-details" style={{ padding: '36px 24px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 18,
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 3px',
                    }}
                  >
                    {selectedMember.name}
                  </h2>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {selectedMember.profession || 'Member'}
                  </div>
                </div>
                <span className={isVerified(selectedMember) ? 'pill pill-ok' : 'pill pill-warn'}>
                  {isVerified(selectedMember) ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px 20px',
                  marginBottom: 20,
                }}
              >
                {[
                  { icon: 'home_pin', label: 'Chapter', value: selectedMember.chapter },
                  { icon: 'location_on', label: 'Region', value: selectedMember.region },
                  { icon: 'work', label: 'Profession', value: selectedMember.profession },
                  ...(selectedMember.constituency
                    ? [
                        {
                          icon: 'how_to_reg',
                          label: 'Constituency',
                          value: selectedMember.constituency,
                        },
                      ]
                    : []),
                ].map((row, i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 4,
                      }}
                    >
                      {row.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, color: 'hsl(var(--primary))' }}
                      >
                        {row.icon}
                      </span>
                      {row.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedMember(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    close
                  </span>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .member-modal-overlay { padding: 16px; }
          .member-modal-dialog { box-shadow: 0 24px 48px -12px rgba(0,0,0,.18); }
          .member-card-embed { display: none; }
          .member-details { display: block; }

          @media (max-width: 640px) {
            .member-modal-overlay { align-items: flex-start; padding: 0; }
            .member-modal-dialog {
              width: 100%;
              max-width: 100%;
              height: 100vh;
              max-height: 100vh;
              border-radius: 0;
              overflow-y: auto;
              transform: translateY(100%);
              animation: slideUp 320ms cubic-bezier(.22,.9,.35,1) forwards;
            }
            .member-modal-dialog > div:first-child { height: 120px; }
            .member-card-embed { display: block; }
            .member-details { display: none; }

            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          }
        `,
        }}
      />
    </div>
  )
}
