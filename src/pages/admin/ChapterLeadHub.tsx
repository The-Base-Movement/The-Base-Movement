import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import type { Chapter } from '@/types/admin'

interface ChapterMember {
  authId: string
  regNo: string
  name: string
  phone: string
  region: string
  constituency: string
  status: string
  joined: string
  avatarUrl?: string
}

interface ChapterDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}

export default function AdminChapterLeadHub() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [members, setMembers] = useState<ChapterMember[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'donations'>('members')
  const [memberSearch, setMemberSearch] = useState('')
  const [hubSearch, setHubSearch] = useState('')

  // Pagination for Hub Selection
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  useEffect(() => {
    async function load() {
      const allChapters = await adminService.getChapters()
      setChapters(allChapters)

      if (!chapterId) {
        setIsLoading(false)
        return
      }

      const found = allChapters.find((c) => c.id === chapterId)
      if (!found) {
        setIsLoading(false)
        return
      }
      setChapter(found)

      const { data: memberData } = await supabase
        .from('users')
        .select(
          'id, registration_number, full_name, phone_number, region, constituency, status, joined_at, avatar_url'
        )
        .eq('chapter', found.name)
        .order('joined_at', { ascending: false })

      const mapped: ChapterMember[] = (memberData || []).map((u) => ({
        authId: u.id,
        regNo: u.registration_number,
        name: u.full_name,
        phone: u.phone_number || 'N/A',
        region: u.region || 'N/A',
        constituency: u.constituency || 'N/A',
        status: u.status,
        joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-GB') : 'N/A',
        avatarUrl: u.avatar_url || undefined,
      }))
      setMembers(mapped)

      const memberIds = (memberData || []).map((u) => u.id)
      if (memberIds.length > 0) {
        const { data: donationData } = await supabase
          .from('donations')
          .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
          .in('member_id', memberIds)
          .order('created_at', { ascending: false })
        setDonations(donationData || [])
      }

      setIsLoading(false)
    }
    load()
  }, [chapterId])

  const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Approved').length
  const pendingCount = members.filter((m) => m.status === 'Pending').length
  const totalDonated = donations.reduce((s, d) => s + Number(d.amount), 0)

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase()
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.regNo.toLowerCase().includes(q) ||
      m.phone.includes(q)
    )
  })

  if (isLoading) {
    return (
      <div className="main">
        <div className="kpis">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel animate-pulse" style={{ height: 80 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!chapter) {
    const filteredHubs = chapters.filter((c) => {
      const q = hubSearch.toLowerCase()
      return !q || c.name.toLowerCase().includes(q) || c.city_or_region.toLowerCase().includes(q)
    })

    const totalPages = Math.ceil(filteredHubs.length / itemsPerPage)
    const currentHubs = filteredHubs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )

    return (
      <div className="main">
        <div className="top">
          <div>
            <div className="crumbs">Admin · Chapters</div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                shield
              </span>
              Regional Hub Command
            </h2>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Select a regional chapter to view its operational telemetry and personnel.
            </p>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 30,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              id="hub-search"
              name="hubSearch"
              type="text"
              placeholder="Search hubs by name or region..."
              value={hubSearch}
              onChange={(e) => {
                setHubSearch(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                width: '100%',
                height: 40,
                paddingLeft: 40,
                paddingRight: 12,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {currentHubs.map((h) => (
            <Link
              key={h.id}
              to={`/admin/chapter-hub/${h.id}`}
              className="panel"
              style={{
                textDecoration: 'none',
                display: 'block',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 4,
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 24, color: 'hsl(var(--primary))' }}
                    >
                      account_balance
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 900,
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.name}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {h.city_or_region}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Personnel
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 16,
                        fontWeight: 900,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {h.member_count || 0}
                    </p>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Status
                    </p>
                    <span
                      className={`pill ${h.status === 'Active' ? 'pill-ok' : 'pill-warn'}`}
                      style={{ marginTop: 2 }}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '12px 20px',
                  background: 'hsl(var(--container-low))',
                  borderTop: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'hsl(var(--primary))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Open Hub Command
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                >
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}

          {filteredHubs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
              >
                search_off
              </span>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No hubs found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 20,
              borderTop: '1px solid hsl(var(--border))',
              marginTop: 20,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredHubs.length)} of {filteredHubs.length}{' '}
              regional hubs
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_left
                </span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${currentPage === i + 1 ? 'btn-dest' : 'btn-outline'}`}
                  style={{ minWidth: 32 }}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="main">
      <div className="top">
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
              Admin
            </Link>
            {' · '}
            <Link to="/admin/chapters" style={{ color: 'hsl(var(--primary))' }}>
              Chapters
            </Link>
            {' · '}
            {chapter.name}
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              account_balance
            </span>
            {chapter.name}
          </h2>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {chapter.leader_name || 'No leader assigned'} — {chapter.city_or_region},{' '}
            {chapter.country}
          </p>
        </div>
        <div className="actions">
          <Link to="/admin/chapters" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            All chapters
          </Link>
        </div>
      </div>

      <div className="kpis">
        {[
          { label: 'Total members', value: members.length, bar: 'hsl(var(--on-surface))' },
          { label: 'Active members', value: activeCount, bar: 'hsl(var(--primary))' },
          { label: 'Pending members', value: pendingCount, bar: 'hsl(var(--accent))' },
          {
            label: 'Total donated',
            value: `GH₵ ${totalDonated.toLocaleString()}`,
            bar: 'hsl(var(--primary))',
          },
        ].map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', marginBottom: 20 }}
      >
        {(
          [
            { key: 'members', label: `Members (${members.length})` },
            { key: 'donations', label: `Donations (${donations.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              borderBottom:
                activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid hsl(var(--border))',
              position: 'relative',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 30,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search by name, reg. ID, or phone"
              name="memberSearch"
              id="input-681c07"
              type="text"
              placeholder="Search by name, reg. ID, or phone..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 38,
                paddingRight: 12,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <tr>
                  {['Member', 'Reg. ID', 'Region / Constituency', 'Status', 'Joined'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 900,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '48px 18px',
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {members.length === 0
                        ? 'No members have joined this chapter yet.'
                        : 'No members match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.regNo} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 4,
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 11,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={m.name}
                              />
                            ) : (
                              m.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'hsl(var(--on-surface))',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {m.name}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 10,
                                fontWeight: 600,
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {m.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.regNo}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {m.region}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {m.constituency}
                        </p>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.joined}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'donations' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <tr>
                  {['Donor', 'Amount', 'Method', 'Reference', 'Date', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 900,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '48px 18px',
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      No donations from chapter members yet.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {d.full_name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {d.phone}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 15,
                          fontWeight: 800,
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {`GH₵ ${Number(d.amount).toLocaleString()}`}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {d.payment_method}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {d.reference || '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(d.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          className={`pill ${d.status === 'Verified' ? 'pill-ok' : d.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
