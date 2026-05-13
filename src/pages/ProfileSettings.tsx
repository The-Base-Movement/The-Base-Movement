import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import MembershipCard from '../components/MembershipCard'
import { adminService } from '@/services/adminService'
import { dataURLtoBlob } from '@/lib/imageUtils'
import { toast } from 'sonner'
import { usePerformance } from '@/context/PerformanceContext'
import { Switch } from '@/components/ui/switch'

// Master data now fetched dynamically from Supabase


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
  const [userAuthId, setUserAuthId] = useState<string | null>(null)
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
  const [availableChapters, setAvailableChapters] = useState<string[]>([])
  const [dbCountries, setDbCountries] = useState<{ name: string; dialing_code: string; is_diaspora: boolean }[]>([])
  const [dbRegions, setDbRegions] = useState<{ id: number, name: string }[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<{ region_id: number, name: string }[]>([])

  useEffect(() => {
    async function loadProfile() {
      // Fetch dynamic data
      const [chapters, countries, regions] = await Promise.all([
        adminService.getChapters(),
        adminService.getCountries(),
        adminService.getRegions()
      ])
      
      setAvailableChapters(chapters.map(c => c.name))
      
      // Deduplicate countries by name just in case
      const uniqueCountries = Array.from(new Map(countries.map(c => [c.name, c])).values())
      setDbCountries(uniqueCountries)
      setDbRegions(regions)

      // Fetch all constituencies and deduplicate by region_id + name
      const { data: conData } = await adminService.getConstituencies()
      const uniqueConstituencies = Array.from(
        new Map((conData || []).map(c => [`${c.region_id}-${c.name}`, c])).values()
      )
      setDbConstituencies(uniqueConstituencies)

      const regNo = localStorage.getItem('userRegNo')
      if (!regNo) {
        setLoading(false)
        return
      }

      const profile = await adminService.getMemberProfile(regNo)
      if (profile) {
        setUserAuthId(profile.authId || null)
        setForm({
          fullName: profile.name,
          email: profile.email || '',
          phone: profile.phone || '',
          countryCode: '+233', // Default, should ideally be derived from phone
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
    
    // Upload new avatar if it's a data URL
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(avatarUrl)
        if (blob) {
          // Standardize pathing: {userId}/{timestamp}.jpg
          const fileName = adminService.generateAvatarPath(userAuthId || regNo)
          const { error: uploadError } = await adminService.uploadAvatar(fileName, blob)
          
          if (uploadError) {
            console.error('[STORAGE] Avatar upload failed:', uploadError)
            toast.error('Failed to upload profile photo. Please try again.')
            setLoading(false)
            return
          }

          finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
        }
      } catch (uploadErr) {
        console.error('[STORAGE] Avatar upload failed:', uploadErr)
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
    if (!cardRef.current) return
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54] // Standard ID card size
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${previewRegNo || 'MEMBER'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handlePrint = async () => {
    if (!cardRef.current) return
    
    try {
      // Capture at high scale for professional print quality
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff', // Force solid background for crisp capture
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // Use iframe to bypass popup blockers
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return

      iframeDoc.write(`
        <html>
          <head>
            <title>THE BASE - Official Membership Card</title>
            <style>
              @page { 
                size: 85.6mm 54mm; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 85.6mm;
                height: 54mm;
                overflow: hidden;
                background: #fff;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              img { 
                width: 85.6mm; 
                height: 54mm; 
                display: block; 
                object-fit: contain;
                image-rendering: -webkit-optimize-contrast;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); }, 200);" />
          </body>
        </html>
      `)
      iframeDoc.close()
      
      // Clean up iframe after a delay to ensure print dialog opened
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-off-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--brand-green)] animate-spin" />
          <p className="font-meta text-stone-500 tracking-tight text-xs animate-pulse">Syncing profile with HQ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full py-12">
      
      {/* Page Title - Now with reduced horizontal padding for better fit */}
      <header className="mb-10 border-b border-divider-gold pb-6 px-4 md:px-6">
        <p className="font-meta text-warm-gold tracking-tight text-xs mb-1">Account</p>
        <h2 className="font-meta font-bold text-3xl text-[var(--brand-green)] tracking-tight">Profile Settings</h2>
        <p className="text-muted-gray text-sm mt-1">Manage your identity, download your card and update your details.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start px-4 md:px-6">
        
        {/* Column 1: Membership Card Preview (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-8">
          
          <div className="relative group overflow-visible">
            <h3 className="font-meta font-bold text-micro text-slate-400 tracking-tight mb-6">Membership card preview</h3>
            
            {/* The Membership Card Component - Isolated for clean capture and full width */}
            <div ref={cardRef} className="bg-transparent">
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

            {/* Photo Input (Hidden) */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Action Buttons for Card */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-warm-gold text-charcoal-dark font-meta font-bold tracking-tight text-micro sm:text-micro hover:opacity-90 transition-all shadow-md leading-tight"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">print</span>
              Print card
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-white border border-slate-200 text-charcoal-dark font-meta font-bold tracking-tight text-micro sm:text-micro hover:bg-slate-50 transition-all shadow-sm leading-tight"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">download</span>
              Download PDF
            </button>
          </div>


          <div className="bg-white border border-slate-200 p-8 shadow-sm">
            <h4 className="font-meta font-bold text-micro text-slate-400 tracking-tight mb-4">Membership verification</h4>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse"></div>
              <p className="text-xs font-bold text-charcoal-dark font-meta tracking-tight">Status: Active & Verified</p>
            </div>
            <p className="text-tiny sm:text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
              Your digital card is real-time verifiable. Use the QR code to present your credentials at official movement events.
            </p>
          </div>

          {/* Phase 14: Voter Registration Pipeline */}
          <div className="bg-white border border-stone-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-meta font-bold text-micro text-stone-400 flex items-center gap-2 tracking-tight">
                <span className="material-symbols-outlined text-[14px]">how_to_vote</span> Election readiness
              </h4>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-bold tracking-tight">Unverified</span>
            </div>
            <p className="text-tiny text-stone-500 mb-4 leading-relaxed">
              Verify your official voter registration to unlock the Patriot Ground Game badge. Your polling station data secures our election day logistics.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Polling Station Code (e.g. C021001A)"
                className="w-full border-b-2 border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:border-[var(--brand-green)] transition-all"
              />
              <button 
                type="button"
                className="w-full py-2.5 bg-stone-900 text-white font-meta font-bold tracking-tight text-micro hover:bg-[var(--brand-green)] transition-colors"
              >
                Submit voter ID
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Personal Information Form (xl:col-span-7) */}
        <div className="xl:col-span-7">
          <form onSubmit={handleSave} className="space-y-8">
            <section className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-2">
                <h3 className="font-meta font-bold text-xs sm:text-sm text-charcoal-dark flex items-center gap-3 tracking-tight">
                  <span className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[14px] shrink-0">01</span>
                  Personal information
                </h3>
                <p className="text-micro text-slate-400 font-meta italic tracking-tight">Official records</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">
                    Registration Number <span className="text-slate-300 italic">(Permanent)</span>
                  </label>
                  <div className="w-full border-b-2 border-slate-50 bg-slate-50/50 px-3 py-3 text-sm text-slate-500 font-bold tracking-tight cursor-not-allowed">
                    {userRegNo || 'Pending Allocation'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">
                    Full Name <span className="text-[var(--brand-red)]">*</span>
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    placeholder="Full name as on official ID"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Email address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="Email address (e.g. you@example.com)"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Phone number</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={form.countryCode}
                        onChange={e => handleChange('countryCode', e.target.value)}
                        className="w-24 border-b-2 border-slate-100 bg-transparent py-3 pr-8 text-xs text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="+233">+233 (GH)</option>
                        {dbCountries.map(c => (
                          <option key={c.name} value={c.dialing_code}>{c.dialing_code} ({c.name.slice(0, 2).toUpperCase()})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="e.g. 24 123 4567"
                      className="flex-1 border-b-2 border-slate-100 bg-transparent py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Gender & age group</label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={e => handleChange('gender', e.target.value)}
                      className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="Male / 18 - 25">Male / 18 - 25</option>
                      <option value="Male / 26 - 40">Male / 26 - 40</option>
                      <option value="Male / 41+">Male / 41+</option>
                      <option value="Female / 18 - 25">Female / 18 - 25</option>
                      <option value="Female / 26 - 40">Female / 26 - 40</option>
                      <option value="Female / 41+">Female / 41+</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Profession</label>
                  <input
                    value={form.profession}
                    onChange={e => handleChange('profession', e.target.value)}
                    placeholder="E.g. Teacher, Engineer, Student"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Assigned chapter</label>
                  <div className="relative">
                    <select
                      value={form.chapter}
                      onChange={e => handleChange('chapter', e.target.value)}
                      className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Chapter</option>
                      {availableChapters.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {userPlatform === 'GHANA' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Region</label>
                      <div className="relative">
                        <select
                          value={form.region}
                          onChange={e => {
                            const newRegion = e.target.value
                            setForm(prev => ({ ...prev, region: newRegion, constituency: '' }))
                          }}
                          className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Region</option>
                          {dbRegions.map(reg => (
                            <option key={reg.id} value={reg.name}>{reg.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Constituency</label>
                      <div className="relative">
                        <select
                          value={form.constituency}
                          disabled={!form.region}
                          onChange={e => handleChange('constituency', e.target.value)}
                          className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Select Constituency</option>
                          {form.region && dbConstituencies
                            .filter(c => c.region_id === dbRegions.find(r => r.name === form.region)?.id)
                            .map(con => (
                              <option key={con.name} value={con.name}>{con.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
                    <div className="space-y-2">
                      <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Country of residence</label>
                      <div className="relative">
                        <select
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
                          className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Country</option>
                          {dbCountries.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">City / Locality</label>
                      <input
                        value={form.city}
                        onChange={e => handleChange('city', e.target.value)}
                        placeholder="E.g. London, New York, Hamburg"
                        className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                      />
                    </div>
                    
                    {form.country === 'Ghana' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Region</label>
                          <div className="relative">
                            <select
                              value={form.region}
                              onChange={e => {
                                const newRegion = e.target.value
                                setForm(prev => ({ ...prev, region: newRegion, constituency: '' }))
                              }}
                              className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select Region</option>
                              {dbRegions.map(reg => (
                                <option key={reg.id} value={reg.name}>{reg.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Constituency</label>
                          <div className="relative">
                            <select
                              value={form.constituency}
                              disabled={!form.region}
                              onChange={e => handleChange('constituency', e.target.value)}
                              className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="">Select Constituency</option>
                              {dbConstituencies
                                .filter(c => {
                                  const regionId = dbRegions.find(r => r.name === form.region)?.id
                                  return c.region_id === regionId
                                })
                                .map(con => (
                                  <option key={con.name} value={con.name}>{con.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">
                    Residential Address {userPlatform === 'GHANA' && <span className="text-[var(--brand-red)]">*</span>}
                  </label>
                  <input
                    required={userPlatform === 'GHANA'}
                    value={form.residentialAddress}
                    onChange={e => handleChange('residentialAddress', e.target.value)}
                    placeholder="Physical address for mobilization and logistics"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="md:col-span-2 space-y-4 pt-4">
                  <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">Short bio</label>
                  <textarea
                    rows={4}
                    value={form.bio}
                    onChange={e => handleChange('bio', e.target.value)}
                    placeholder="A brief statement about your commitment to the Ghana First movement..."
                    className="w-full border-2 border-slate-50 bg-slate-50/50 p-6 text-sm text-charcoal-dark font-medium focus:outline-none focus:border-[var(--brand-green)] transition-all resize-none leading-relaxed placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-2">
                <h3 className="font-meta font-bold text-xs sm:text-sm text-charcoal-dark flex items-center gap-3 tracking-tight">
                  <span className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[14px] shrink-0">02</span>
                  Performance preferences
                </h3>
                <p className="text-micro text-slate-400 font-meta italic tracking-tight">App experience</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-micro font-meta font-bold text-slate-400 block tracking-tight">
                      Low-bandwidth mode
                    </label>
                    <p className="text-xs text-slate-500 font-body-md max-w-md">
                      Reduces data usage by hiding heavy background images and optimizing assets. Recommended for slow connections.
                    </p>
                  </div>
                  <Switch 
                    checked={lowBandwidthMode} 
                    onCheckedChange={setLowBandwidthMode}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-16 py-6 bg-[var(--brand-green)] text-white font-meta font-bold tracking-tight text-xs hover:opacity-95 active:scale-[0.98] transition-all shadow-2xl shadow-brand-green/20"
              >
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                Save changes
              </button>

              {saved && (
                <div className="flex items-center gap-3 text-[var(--brand-green)] text-micro font-meta font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-500">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  Information synchronized
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <section className="mt-16 p-10 border-2 border-dashed border-red-100 bg-red-50/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                  <h4 className="font-meta font-bold text-xs text-[var(--brand-red)] mb-2 flex items-center gap-2 tracking-tight">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Danger zone
                  </h4>
                  <p className="text-xs sm:text-xs text-slate-500 font-body-md max-w-md">Deactivating your account will permanently delete all your contribution history and movement records. This action cannot be undone.</p>
                </div>
                <button
                  type="button"
                  className="w-full lg:w-auto px-8 py-3.5 border-2 border-red-200 text-[var(--brand-red)] text-micro font-meta font-bold tracking-tight hover:bg-[var(--brand-red)] hover:text-white transition-all shadow-sm"
                >
                  Deactivate membership
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
