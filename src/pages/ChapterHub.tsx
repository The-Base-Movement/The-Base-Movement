import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { chapterService } from '@/services/chapterService'
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

export default function ChapterHub() {
  const { chapterId } = useParams<{ chapterId?: string }>()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [members, setMembers] = useState<ChapterMember[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'donations' | 'settings'>('members')
  const [memberSearch, setMemberSearch] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [scheduleDraft, setScheduleDraft] = useState('')
  const [focusDraft, setFocusDraft] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setIsLoading(false); return }
      const userId = session.user.id

      const chapters = await adminService.getChapters()
      let mine: Chapter | undefined

      // 1. Explicit ID from URL param (most reliable)
      if (chapterId) {
        mine = chapters.find(c => c.id === chapterId)
      }

      // 2. Match by leader_id (UUID)
      if (!mine) {
        mine = chapters.find(c => c.leader_id === userId)
      }

      // 3. Match by chapter name stored on user's DB row
      if (!mine) {
        const { data: userData } = await supabase
          .from('users')
          .select('chapter')
          .eq('id', userId)
          .maybeSingle()
        if (userData?.chapter) {
          mine = chapters.find(c => c.name.toLowerCase() === userData.chapter.toLowerCase())
        }
      }

      if (!mine) { setIsLoading(false); return }
      setChapter(mine)
      setEmailDraft(mine.email || '')
      setPhoneDraft(mine.phone_number || '')
      setDescDraft(mine.description || '')
      setScheduleDraft(mine.meeting_schedule || '')
      setFocusDraft(mine.local_focus || '')

      const { data: memberData } = await supabase
        .from('users')
        .select('id, registration_number, full_name, phone_number, region, constituency, status, joined_at, avatar_url')
        .eq('chapter', mine.name)
        .order('joined_at', { ascending: false })

      const mapped: ChapterMember[] = (memberData || []).map(u => ({
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

      const memberIds = (memberData || []).map(u => u.id)
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

  const activeCount = members.filter(m => m.status === 'Active' || m.status === 'Approved').length
  const pendingCount = members.filter(m => m.status === 'Pending').length
  const totalDonated = donations.reduce((s, d) => s + Number(d.amount), 0)

  const filteredMembers = members.filter(m => {
    const q = memberSearch.toLowerCase()
    return !q || m.name.toLowerCase().includes(q) || m.regNo.toLowerCase().includes(q) || m.phone.includes(q)
  })

  const slug = chapter ? chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : ''

  const handleSaveContact = async () => {
    if (!chapter) return
    setIsSavingContact(true)
    const ok = await chapterService.updateChapter(chapter.id, { email: emailDraft, phone_number: phoneDraft })
    setIsSavingContact(false)
    if (ok) toast.success('Contact info updated.')
    else toast.error('Failed to update contact info.')
  }

  const handleSaveDetails = async () => {
    if (!chapter) return
    setIsSavingDetails(true)
    const ok = await chapterService.updateChapter(chapter.id, {
      description: descDraft,
      meeting_schedule: scheduleDraft,
      local_focus: focusDraft,
    })
    setIsSavingDetails(false)
    if (ok) {
      setChapter(prev => prev ? { ...prev, description: descDraft, meeting_schedule: scheduleDraft, local_focus: focusDraft } : prev)
      toast.success('Chapter profile updated.')
    } else {
      toast.error('Failed to save changes.')
    }
  }

  if (isLoading) {
    return (
      <div className="main">
        <div className="kpis">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="panel animate-pulse" style={{ height: 80 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}>account_balance</span>
          <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', marginTop: 16, marginBottom: 8 }}>No chapter assigned</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>You have not been appointed as a chapter leader yet.</p>
          <Link to="/dashboard/chapters" className="btn btn-outline">View all chapters</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Header */}
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>account_balance</span>
            {chapter.name}
          </h2>
          <div style={{ marginTop: 12 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            Chapter management hub — {chapter.city_or_region}, {chapter.country}
          </p>
        </div>
        <div className="actions">
          <Link to={`/dashboard/chapters/${slug}`} className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
            Public view
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { label: 'Total members', value: members.length, bar: 'hsl(var(--on-surface))' },
          { label: 'Active members', value: activeCount, bar: 'hsl(var(--primary))' },
          { label: 'Pending members', value: pendingCount, bar: 'hsl(var(--accent))' },
          { label: 'Total donated', value: `GH₵ ${totalDonated.toLocaleString()}`, bar: 'hsl(var(--primary))' },
        ].map(k => (
          <div key={k.label} className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: k.bar }} />
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--on-surface-muted))', margin: '0 0 6px' }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', marginBottom: 20 }}>
        {([
          { key: 'members', label: `Members (${members.length})` },
          { key: 'donations', label: `Donations (${donations.length})` },
          { key: 'settings', label: 'Chapter Settings' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              borderBottom: activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid hsl(var(--border))', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4, pointerEvents: 'none' }}>search</span>
            <input name="memberSearch" id="input-baf451"
              type="text"
              placeholder="Search by name, reg. ID, or phone…"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              style={{ width: '100%', height: 38, paddingLeft: 38, paddingRight: 12, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                <tr>
                  {['Member', 'Reg. ID', 'Region / Constituency', 'Status', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 18px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                      {members.length === 0 ? 'No members have joined this chapter yet.' : 'No members match your search.'}
                    </td>
                  </tr>
                ) : filteredMembers.map(m => (
                  <tr key={m.regNo} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 4, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0, overflow: 'hidden' }}>
                          {m.avatarUrl
                            ? <img src={m.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={m.name} />
                            : m.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                          }
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{m.name}</p>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>{m.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--on-surface-muted))' }}>{m.regNo}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{m.region}</p>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>{m.constituency}</p>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}>{m.status}</span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', whiteSpace: 'nowrap' }}>{m.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chapter profile */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>edit_note</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chapter profile</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveDetails} disabled={isSavingDetails}>
                {isSavingDetails ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>
                  About this chapter
                </label>
                <textarea name="descDraft" id="textarea-eef928"
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  placeholder="Describe your chapter's mission, goals, and focus areas…"
                  rows={4}
                  style={{ width: '100%', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '10px 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: 'hsl(var(--on-surface))', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>
                    Meeting schedule
                  </label>
                  <input name="scheduleDraft" id="input-7dc8e3"
                    type="text"
                    value={scheduleDraft}
                    onChange={e => setScheduleDraft(e.target.value)}
                    placeholder="e.g. Every 1st Saturday at 10am"
                    style={{ width: '100%', height: 40, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: 'hsl(var(--on-surface))' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>
                    Local focus
                  </label>
                  <input name="focusDraft" id="input-2c8d97"
                    type="text"
                    value={focusDraft}
                    onChange={e => setFocusDraft(e.target.value)}
                    placeholder="e.g. Voter registration, Community outreach"
                    style={{ width: '100%', height: 40, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: 'hsl(var(--on-surface))' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>contacts</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact info</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveContact} disabled={isSavingContact}>
                {isSavingContact ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>
                  Chapter email
                </label>
                <input name="emailDraft" id="input-2b72d8"
                  type="email"
                  value={emailDraft}
                  onChange={e => setEmailDraft(e.target.value)}
                  placeholder="chapter@thebasemovement.com"
                  style={{ width: '100%', height: 40, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: 'hsl(var(--on-surface))' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>
                  Chapter phone
                </label>
                <input name="phoneDraft" id="input-ec026c"
                  type="tel"
                  value={phoneDraft}
                  onChange={e => setPhoneDraft(e.target.value)}
                  placeholder="+233 50 000 0000"
                  style={{ width: '100%', height: 40, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: 'hsl(var(--on-surface))' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donations tab */}
      {activeTab === 'donations' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                <tr>
                  {['Donor', 'Amount', 'Method', 'Reference', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 18px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                      No donations from chapter members yet.
                    </td>
                  </tr>
                ) : donations.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{d.full_name}</p>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>{d.phone}</p>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 15, fontWeight: 800, color: 'hsl(var(--primary))', fontFamily: "'Public Sans', sans-serif", whiteSpace: 'nowrap' }}>
                      GH₵ {Number(d.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.payment_method}</td>
                    <td style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--on-surface-muted))' }}>{d.reference || '—'}</td>
                    <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', whiteSpace: 'nowrap' }}>
                      {new Date(d.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className={`pill ${d.status === 'Verified' ? 'pill-ok' : d.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
