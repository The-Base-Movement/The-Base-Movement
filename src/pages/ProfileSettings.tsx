import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import MembershipCard from '../components/MembershipCard'
import { adminService } from '@/services/adminService'
import { dataURLtoBlob } from '@/lib/imageUtils'
import { toast } from 'sonner'
import { usePerformance } from '@/context/PerformanceContext'

const labelStyle: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 800,
  fontSize: 10.5,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12.5,
  background: '#fff',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: 34,
}

function SelIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}
    >
      expand_more
    </span>
  )
}

export default function ProfileSettings() {
  const { lowBandwidthMode, setLowBandwidthMode } = usePerformance()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem('userAvatar')
  )

  const [userPlatform] = useState(
    () => localStorage.getItem('userPlatform') || ''
  )
  const [userRegNo] = useState(
    () => localStorage.getItem('userRegNo') || ''
  )
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+233',
    region: '',
    constituency: '',
    profession: '',
    bio: '',
    gender: 'Male / 26 - 40',
    joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'Active Member',
    chapter: 'TBM Ghana Chapter',
    country: userPlatform === 'GHANA' ? 'Ghana' : '',
    city: '',
    residentialAddress: ''
  })

  const [loading, setLoading] = useState(true)
  const [pollingStationCode, setPollingStationCode] = useState('')
  const [pollingStationName, setPollingStationName] = useState('')
  const [voterStatus, setVoterStatus] = useState<'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'>('UNVERIFIED')
  const [submittingVoter, setSubmittingVoter] = useState(false)
  const [psSearch, setPsSearch] = useState('')
  const [psResults, setPsResults] = useState<{ code: string; name: string; community: string }[]>([])
  const [psOpen, setPsOpen] = useState(false)
  const [psLoading, setPsLoading] = useState(false)
  const psDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchStations = useCallback((q: string, region: string, constituency: string) => {
    if (psDebounce.current) clearTimeout(psDebounce.current)
    if (!q.trim()) { setPsResults([]); setPsOpen(false); return }
    psDebounce.current = setTimeout(async () => {
      setPsLoading(true)
      const results = await adminService.getPollingStations(region, constituency, q)
      setPsResults(results)
      setPsOpen(results.length > 0)
      setPsLoading(false)
    }, 300)
  }, [])
  const [availableChapters, setAvailableChapters] = useState<string[]>([])
  const [dbCountries, setDbCountries] = useState<{ name: string; dialing_code: string; is_diaspora: boolean }[]>([])
  const [dbRegions, setDbRegions] = useState<{ id: number, name: string }[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<{ region_id: number, name: string }[]>([])

  useEffect(() => {
    async function loadProfile() {
      const [chapters, countries, regions] = await Promise.all([
        adminService.getChapters(),
        adminService.getCountries(),
        adminService.getRegions()
      ])

      setAvailableChapters(chapters.map(c => c.name))
      const uniqueCountries = Array.from(new Map(countries.map(c => [c.name, c])).values())
      setDbCountries(uniqueCountries)
      setDbRegions(regions)

      const { data: conData } = await adminService.getConstituencies()
      const uniqueConstituencies = Array.from(
        new Map((conData || []).map(c => [`${c.region_id}-${c.name}`, c])).values()
      )
      setDbConstituencies(uniqueConstituencies)

      const regNo = localStorage.getItem('userRegNo')
      if (!regNo) { setLoading(false); return }

      const profile = await adminService.getMemberProfile(regNo)
      if (profile) {

        setForm({
          fullName: profile.name,
          email: profile.email || '',
          phone: profile.phone || '',
          countryCode: '+233',
          region: profile.region || '',
          constituency: profile.constituency || '',
          profession: 'Member',
          bio: '',
          gender: profile.gender || 'Male / 26 - 40',
          joinedDate: profile.joined,
          status: profile.status === 'Active' ? 'Active Member' : profile.status,
          chapter: profile.chapter || 'TBM Ghana Chapter',
          country: profile.country || (userPlatform === 'GHANA' ? 'Ghana' : ''),
          city: profile.city || '',
          residentialAddress: profile.residentialAddress || ''
        })
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl)
          localStorage.setItem('userAvatar', profile.avatarUrl)
        }
      }

      const voterReg = await adminService.getMyVoterRegistration()
      if (voterReg) {
        setVoterStatus(voterReg.registration_status)
        setPollingStationCode(voterReg.polling_station_id || '')
      }

      setLoading(false)
    }
    loadProfile()
  }, [userPlatform])

  const initials = form.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')

  const previewRegNo = userRegNo || `TBM-${(!form.country || form.country === 'Ghana') ? 'GH' : 'DI'}-${new Date().getFullYear().toString().slice(-2)}XXXX`

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || null
        setAvatarUrl(result)
        if (result) localStorage.setItem('userAvatar', result)
        window.dispatchEvent(new Event('storage'))
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const regNo = localStorage.getItem('userRegNo')
    if (!regNo) return

    setLoading(true)
    let finalAvatarUrl = avatarUrl

    if (avatarUrl && avatarUrl.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(avatarUrl)
        if (blob) {
          const fileName = adminService.generateAvatarPath(regNo)
          const { error: uploadError } = await adminService.uploadAvatar(fileName, blob)
          if (uploadError) {
            toast.error('Failed to upload profile photo. Please try again.')
            setLoading(false)
            return
          }
          finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
        }
      } catch {
        toast.error('Failed to upload profile photo')
      }
    }

    const success = await adminService.updateMemberProfile(regNo, {
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      region: form.region,
      constituency: form.constituency,
      gender: form.gender,
      chapter: form.chapter,
      avatarUrl: finalAvatarUrl || undefined,
      profession: form.profession,
      city: form.city,
      residentialAddress: form.residentialAddress
    })

    setLoading(false)

    if (success) {
      toast.success('Official Profile Synchronized')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      toast.error('Failed to sync profile. Check your connection.')
    }
  }

  const handleDownload = async () => {
    // We use a hidden high-res version of the card for the download to avoid mobile squashing issues
    const captureEl = document.getElementById('membership-card-download-capture')
    if (!captureEl) return
    
    try {
      // Temporarily show it for capture
      captureEl.style.display = 'block'
      const canvas = await html2canvas(captureEl, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      })
      captureEl.style.display = 'none'
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${previewRegNo || 'MEMBER'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      const captureEl = document.getElementById('membership-card-download-capture')
      if (captureEl) captureEl.style.display = 'none'
    }
  }

  const handlePrint = async () => {
    const captureEl = document.getElementById('membership-card-download-capture')
    if (!captureEl) return
    try {
      captureEl.style.display = 'block'
      const canvas = await html2canvas(captureEl, {
        scale: 4, useCORS: true, backgroundColor: '#ffffff',
        logging: false, scrollX: 0, scrollY: 0
      })
      captureEl.style.display = 'none'
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(`<html><head><title>THE BASE - Official Membership Card</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print()},200);"/></body></html>`)
      iframeDoc.close()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
      const captureEl = document.getElementById('membership-card-download-capture')
      if (captureEl) captureEl.style.display = 'none'
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--primary))', animation: 'spin 1.2s linear infinite' }}>sync</span>
        <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Syncing profile with HQ…
        </p>
      </div>
    )
  }

  return (
    <div className="profile-page">

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Account · Settings</div>
        <h2 style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: '-.02em', color: 'hsl(var(--on-surface))' }}>
          Profile Settings
        </h2>
        <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12.5, marginTop: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
          Manage your identity, download your card and update your details.
        </p>
      </div>

      <div className="profile-cols">

        {/* ── Left column ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Membership card preview */}
          <div className="panel">
            <div className="ph">
              <h3>Membership card</h3>
              <span className="meta">Live preview</span>
            </div>
            <div style={{ padding: 20 }}>
              <div ref={cardRef} className="mcard-container">
                <MembershipCard
                  userName={form.fullName}
                  avatarUrl={avatarUrl}
                  userRegNo={previewRegNo}
                  initials={initials}
                  gender={form.gender}
                  joinedDate={form.joinedDate}
                  status={form.status}
                  region={form.region}
                  constituency={form.constituency}
                  country={form.country}
                  city={form.city}
                  chapter={form.chapter}
                  onPhotoClick={() => fileRef.current?.click()}
                />
              </div>

              {/* Hidden High-Res Capture Target (Fixed dimensions to prevent cropping and squashing) */}
              <div id="membership-card-download-capture" style={{ 
                position: 'fixed', 
                left: '-9999px', 
                top: '-9999px', 
                width: '520px',
                height: '325px',
                display: 'none'
              }}>
                <MembershipCard
                  userName={form.fullName}
                  avatarUrl={avatarUrl}
                  userRegNo={previewRegNo}
                  initials={initials}
                  gender={form.gender}
                  joinedDate={form.joinedDate}
                  status={form.status}
                  region={form.region}
                  constituency={form.constituency}
                  country={form.country}
                  city={form.city}
                  chapter={form.chapter}
                  isForDownload={true}
                />
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={handlePrint} style={{ justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>print</span>
                Print card
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleDownload} style={{ justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                Download PDF
              </button>
            </div>
          </div>

          {/* Verification status */}
          <div className="panel">
            <div className="ph">
              <h3>Membership verification</h3>
              <span className="pill pill-ok">Verified</span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'hsl(var(--primary))', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--on-surface))' }}>
                  Status: Active & Verified
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, lineHeight: 1.55 }}>
                Your digital card is real-time verifiable. Use the QR code to present your credentials at official movement events.
              </p>
            </div>
          </div>

          {/* Voter registration */}
          <div className="panel">
            <div className="ph">
              <h3>Election readiness</h3>
              <span className={`pill ${voterStatus === 'VERIFIED_VOTER' ? 'pill-ok' : voterStatus === 'IN_PROGRESS' ? 'pill-warn' : 'pill-mute'}`}>
                {voterStatus === 'VERIFIED_VOTER' ? 'Verified voter' : voterStatus === 'IN_PROGRESS' ? 'Under review' : 'Unverified'}
              </span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, lineHeight: 1.55 }}>
                Submit your polling station code to help the movement track election day turnout and coordinate logistics in your constituency.
              </p>
              {voterStatus === 'VERIFIED_VOTER' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'hsl(var(--primary) / 0.06)', borderRadius: 4, border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>verified</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--primary))' }}>
                    Polling station {pollingStationCode} — verified
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Station search picker */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                      <input
                        aria-label="Search polling station by name or code"
                        type="text"
                        placeholder={form.region ? `Search by station name or code…` : 'Update your region first'}
                        value={psSearch}
                        disabled={!form.region}
                        onChange={e => {
                          setPsSearch(e.target.value)
                          searchStations(e.target.value, form.region, form.constituency)
                        }}
                        onFocus={() => { if (psResults.length > 0) setPsOpen(true) }}
                        style={{ ...inputStyle, paddingLeft: 32 }}
                      />
                      {psLoading && (
                        <span className="material-symbols-outlined" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                      )}
                    </div>
                    {psOpen && psResults.length > 0 && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setPsOpen(false)} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: 220, overflowY: 'auto' }}>
                          {psResults.map(s => (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => {
                                setPollingStationCode(s.code)
                                setPollingStationName(s.name)
                                setPsSearch(`${s.code} — ${s.name}`)
                                setPsOpen(false)
                              }}
                              style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '9px 12px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer', gap: 2 }}
                            >
                              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5, color: 'hsl(var(--on-surface))' }}>{s.code}</span>
                              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{s.name} · {s.constituency}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {pollingStationCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--primary))' }}>how_to_vote</span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5, color: 'hsl(var(--on-surface))' }}>Selected: {pollingStationCode}</span>
                      {pollingStationName && <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>— {pollingStationName}</span>}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                    disabled={submittingVoter || !pollingStationCode.trim()}
                    onClick={async () => {
                      setSubmittingVoter(true)
                      const ok = await adminService.submitVoterRegistration(pollingStationCode)
                      setSubmittingVoter(false)
                      if (ok) {
                        setVoterStatus('IN_PROGRESS')
                        toast.success('Polling station submitted — pending admin verification')
                      } else {
                        toast.error('Failed to submit. Please try again.')
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>how_to_vote</span>
                    {submittingVoter ? 'Submitting…' : 'Submit polling station'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column: form ────────────── */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Personal information */}
          <div className="panel">
            <div className="ph">
              <h3>Personal information</h3>
              <span className="meta">Official records</span>
            </div>
            <div style={{ padding: 18 }}>
              <div className="profile-form-grid">

                {/* Registration number */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>
                    Registration Number{' '}
                    <span style={{ fontWeight: 700, letterSpacing: 0, textTransform: 'none', color: 'hsl(var(--on-surface-muted))' }}>(Permanent)</span>
                  </label>
                  <div style={{ ...inputStyle, background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center', cursor: 'not-allowed' }}>
                    {userRegNo || 'Pending Allocation'}
                  </div>
                </div>

                {/* Full name */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Full Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                  <input name="name-43d16b" id="input-43d16b"
                    required
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    placeholder="Full name as on official ID"
                    style={inputStyle}
                  />
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Email address</label>
                  <input name="name-eaefbf" id="input-eaefbf"
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Phone number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', width: 110, flexShrink: 0 }}>
                      <select name="name-8448b5" id="select-8448b5"
                        value={form.countryCode}
                        onChange={e => handleChange('countryCode', e.target.value)}
                        style={{ ...selectStyle, width: '100%' }}
                      >
                        <option value="+233">+233 (GH)</option>
                        {dbCountries.map(c => (
                          <option key={c.name} value={c.dialing_code}>{c.dialing_code} ({c.name.slice(0, 2).toUpperCase()})</option>
                        ))}
                      </select>
                      <SelIcon />
                    </div>
                    <input name="name-7b1c95" id="input-7b1c95"
                      type="tel"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="24 123 4567"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Gender & age group</label>
                  <div style={{ position: 'relative' }}>
                    <select name="name-2e1d40" id="select-2e1d40" value={form.gender} onChange={e => handleChange('gender', e.target.value)} style={selectStyle}>
                      <option value="Male / 18 - 25">Male / 18 - 25</option>
                      <option value="Male / 26 - 40">Male / 26 - 40</option>
                      <option value="Male / 41+">Male / 41+</option>
                      <option value="Female / 18 - 25">Female / 18 - 25</option>
                      <option value="Female / 26 - 40">Female / 26 - 40</option>
                      <option value="Female / 41+">Female / 41+</option>
                    </select>
                    <SelIcon />
                  </div>
                </div>

                {/* Profession */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Profession</label>
                  <input name="name-281364" id="input-281364"
                    value={form.profession}
                    onChange={e => handleChange('profession', e.target.value)}
                    placeholder="E.g. Teacher, Engineer, Student"
                    style={inputStyle}
                  />
                </div>

                {/* Chapter */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Assigned chapter</label>
                  <div style={{ position: 'relative' }}>
                    <select name="name-d8a77b" id="select-d8a77b" value={form.chapter} onChange={e => handleChange('chapter', e.target.value)} style={selectStyle}>
                      <option value="">Select Chapter</option>
                      {availableChapters.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <SelIcon />
                  </div>
                </div>

                {/* Region / Country fields — conditional on platform */}
                {userPlatform === 'GHANA' ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>Region</label>
                      <div style={{ position: 'relative' }}>
                        <select name="name-c13da3" id="select-c13da3"
                          value={form.region}
                          onChange={e => setForm(prev => ({ ...prev, region: e.target.value, constituency: '' }))}
                          style={selectStyle}
                        >
                          <option value="">Select Region</option>
                          {dbRegions.map(reg => (
                            <option key={reg.id} value={reg.name}>{reg.name}</option>
                          ))}
                        </select>
                        <SelIcon />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>Constituency</label>
                      <div style={{ position: 'relative' }}>
                        <select name="name-767782" id="select-767782"
                          value={form.constituency}
                          disabled={!form.region}
                          onChange={e => handleChange('constituency', e.target.value)}
                          style={{ ...selectStyle, opacity: !form.region ? 0.5 : 1 }}
                        >
                          <option value="">Select Constituency</option>
                          {form.region && dbConstituencies
                            .filter(c => c.region_id === dbRegions.find(r => r.name === form.region)?.id)
                            .map(con => (
                              <option key={con.name} value={con.name}>{con.name}</option>
                            ))}
                        </select>
                        <SelIcon />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>Country of residence</label>
                      <div style={{ position: 'relative' }}>
                        <select name="name-38f885" id="select-38f885"
                          value={form.country}
                          onChange={e => {
                            const countryName = e.target.value
                            const countryData = dbCountries.find(c => c.name === countryName)
                            setForm(prev => ({
                              ...prev,
                              country: countryName,
                              countryCode: countryData?.dialing_code || prev.countryCode,
                              region: countryName !== 'Ghana' ? '' : prev.region,
                              constituency: countryName !== 'Ghana' ? '' : prev.constituency
                            }))
                          }}
                          style={selectStyle}
                        >
                          <option value="">Select Country</option>
                          {dbCountries.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <SelIcon />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>City / Locality</label>
                      <input name="name-d8d448" id="input-d8d448"
                        value={form.city}
                        onChange={e => handleChange('city', e.target.value)}
                        placeholder="E.g. London, New York, Hamburg"
                        style={inputStyle}
                      />
                    </div>

                    {form.country === 'Ghana' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={labelStyle}>Region</label>
                          <div style={{ position: 'relative' }}>
                            <select name="name-25c44b" id="select-25c44b"
                              value={form.region}
                              onChange={e => setForm(prev => ({ ...prev, region: e.target.value, constituency: '' }))}
                              style={selectStyle}
                            >
                              <option value="">Select Region</option>
                              {dbRegions.map(reg => (
                                <option key={reg.id} value={reg.name}>{reg.name}</option>
                              ))}
                            </select>
                            <SelIcon />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={labelStyle}>Constituency</label>
                          <div style={{ position: 'relative' }}>
                            <select name="name-dede8f" id="select-dede8f"
                              value={form.constituency}
                              disabled={!form.region}
                              onChange={e => handleChange('constituency', e.target.value)}
                              style={{ ...selectStyle, opacity: !form.region ? 0.5 : 1 }}
                            >
                              <option value="">Select Constituency</option>
                              {dbConstituencies
                                .filter(c => c.region_id === dbRegions.find(r => r.name === form.region)?.id)
                                .map(con => (
                                  <option key={con.name} value={con.name}>{con.name}</option>
                                ))}
                            </select>
                            <SelIcon />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Residential address — full width */}
                <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>
                    Residential Address{' '}
                    {userPlatform === 'GHANA' && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
                  </label>
                  <input name="name-048091" id="input-048091"
                    required={userPlatform === 'GHANA'}
                    value={form.residentialAddress}
                    onChange={e => handleChange('residentialAddress', e.target.value)}
                    placeholder="Physical address for mobilization and logistics"
                    style={inputStyle}
                  />
                </div>

                {/* Bio — full width */}
                <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Short bio</label>
                  <textarea name="name-956004" id="textarea-956004"
                    rows={4}
                    value={form.bio}
                    onChange={e => handleChange('bio', e.target.value)}
                    placeholder="A brief statement about your commitment to the Ghana First movement…"
                    style={{
                      ...inputStyle,
                      height: 'auto',
                      padding: '10px 12px',
                      resize: 'none',
                      lineHeight: 1.55,
                    }}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Performance preferences */}
          <div className="panel">
            <div className="ph">
              <h3>Performance preferences</h3>
              <span className="meta">App experience</span>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Low-bandwidth mode</label>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, maxWidth: 380, lineHeight: 1.55 }}>
                    Reduces data usage by hiding heavy background images and optimizing assets. Recommended for slow connections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
                  style={{ width: 36, height: 20, borderRadius: 10, background: lowBandwidthMode ? 'hsl(var(--primary))' : 'hsl(var(--border))', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 3px', justifyContent: lowBandwidthMode ? 'flex-end' : 'flex-start', flexShrink: 0, transition: 'background 0.2s' }}
                >
                  <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Save action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="submit" className="btn btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span>
              Save changes
            </button>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--primary))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
                Information synchronized
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{ marginTop: 8, padding: '20px 22px', border: '2px dashed hsl(var(--destructive) / 25%)', borderRadius: 6, background: 'hsl(var(--destructive) / 3%)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--destructive))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                  Danger zone
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, maxWidth: 420, lineHeight: 1.55 }}>
                  Deactivating your account will permanently delete all your contribution history and movement records. This action cannot be undone.
                </p>
              </div>
              <button type="button" className="btn btn-dest btn-sm">
                Deactivate membership
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  )
}
