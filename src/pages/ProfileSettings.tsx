import { useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import MembershipCard from '../components/MembershipCard'

const ghanaRegions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
]

const regionConstituencies: Record<string, string[]> = {
  'Ahafo': ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  'Ashanti': [
    'Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South',
    'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Akrofuom', 'Odotobri',
    'Manso Nkwanta', 'Manso Edubia', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South',
    'Asawase', 'Asokwa', 'Atwima-Kwanwoma', 'Atwima Mponua', 'Atwima-Nwabiagya South', 'Atwima-Nwabiagya North',
    'Bekwai', 'Bosome-Freho', 'Bosomtwe', 'Ejisu', 'Ejura-Sekyedumase', 'Juaben', 'Bantama',
    'Manhyia North', 'Manhyia South', 'Nhyiaeso', 'Subin', 'Kwabre East', 'Kwadaso', 'Mampong',
    'Obuasi East', 'Obuasi West', 'Offinso South', 'Offinso North', 'Oforikrom', 'Old Tafo',
    'Sekyere Afram Plains', 'Nsuta-Kwamang-Beposo', 'Afigya Sekyere East', 'Kumawu', 'Effiduase-Asokore', 'Suame'
  ],
  'Bono': ['Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'],
  'Bono East': ['Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'],
  'Central': [
    'Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa',
    'Assin Central', 'Assin North', 'Assin South', 'Awutu-Senya East', 'Awutu-Senya West', 'Cape Coast North',
    'Cape Coast South', 'Effutu', 'Ekumfi', 'Gomoa East', 'Gomoa Central', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem',
    'Mfantseman', 'Twifo-Atii Morkwaa', 'Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West'
  ],
  'Eastern': [
    'Abuakwa North', 'Abuakwa South', 'Achiase', 'Akropong', 'Akwapim South', 'Ofoase-Ayirebi', 'Asene Akroso Manso',
    'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano', 'Akim Oda', 'Abirem', 'Akim Swedru', 'Akwatia',
    'Fanteakwa North', 'Fanteakwa South', 'Kade', 'Afram Plains North', 'Afram Plains South', 'Abetifi',
    'Mpraeso', 'Nkawkaw', 'Lower Manya', 'New Juaben North', 'New Juaben South', 'Nsawam Adoagyiri',
    'Okere', 'Suhum', 'Upper Manya', 'Upper West Akim', 'Lower West Akim', 'Yilo Krobo'
  ],
  'Greater Accra': [
    'Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Ablekuma South', 'Odododiodio', 'Okaikwei Central',
    'Okaikwei South', 'Ada', 'Sege', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso East', 'Ayawaso North',
    'Ayawaso West', 'Anyaa-Sowutuom', 'Dome-Kwabenya', 'Trobu', 'Bortianor-Ngleshie-Amanfrom', 'Domeabra-Obom',
    'Amasaman', 'Korle Klottey', 'Kpone-Katamanso', 'Krowor', 'Dade Kotopon', 'Abokobi-Madina', 'Ledzokuku',
    'Ningo-Prampram', 'Okaikwei North', 'Shai-Osudoku', 'Tema Central', 'Tema East', 'Tema West', 'Weija'
  ],
  'North East': ['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'],
  'Northern': ['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Mion', 'Nanton', 'Bimbilla', 'Wulensi', 'Saboba', 'Sagnarigu', 'Savelugu', 'Tamale Central', 'Tamale North', 'Tamale South', 'Yendi'],
  'Oti': ['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta North', 'Nkwanta South', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'],
  'Savannah': ['Bole', 'Sawla-Tuna-Kalba', 'Damongo', 'Daboya-Mankarigu', 'Salaga North', 'Salaga South', 'Yapei-Kusawgu'],
  'Upper East': ['Bolgatanga Central', 'Bolgatanga East', 'Chiana-Paga', 'Navrongo Central', 'Builsa North', 'Builsa South', 'Bawku Central', 'Binduri', 'Pusiga', 'Zebilla', 'Garu', 'Tempane', 'Talensi', 'Nabdam', 'Bongo'],
  'Upper West': ['Wa Central', 'Wa West', 'Wa East', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie', 'Lawra', 'Nandom', 'Daffiama-Bussie-Issa', 'Sissala West', 'Sissala East'],
  'Volta': ['Ho Central', 'Ho West', 'Hohoe', 'Kpando', 'North Dayi', 'South Dayi', 'Afadzato South', 'Agotime-Ziope', 'Adaklu', 'North Tongu', 'South Tongu', 'Central Tongu', 'Akatsi South', 'Akatsi North', 'Ketu South', 'Ketu North', 'Keta', 'Anlo'],
  'Western': ['Takoradi', 'Sekondi', 'Essikado-Ketan', 'Kwesimintsim', 'Effia', 'Ahanta West', 'Mpohor', 'Shama', 'Wassa East', 'Tarkwa-Nsuaem', 'Prestea Huni-Valley', 'Evalue-Ajomoro-Gwira', 'Ellembelle', 'Jomoro'],
  'Western North': ['Sefwi-Wiawso', 'Sefwi Akontombra', 'Bodi', 'Juaboso', 'Bia West', 'Bia East', 'Bibiani-Anhwiaso-Bekwai', 'Aowin', 'Suaman']
}

const countries = [
  { name: 'Ghana', code: 'GH', dial: '+233' },
  { name: 'United Kingdom', code: 'UK', dial: '+44' },
  { name: 'United States', code: 'US', dial: '+1' },
  { name: 'Nigeria', code: 'NG', dial: '+234' },
  { name: 'Germany', code: 'DE', dial: '+49' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'France', code: 'FR', dial: '+33' },
  { name: 'Italy', code: 'IT', dial: '+39' },
  { name: 'Spain', code: 'ES', dial: '+34' },
  { name: 'Netherlands', code: 'NL', dial: '+31' },
  { name: 'South Africa', code: 'ZA', dial: '+27' },
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971' },
  { name: 'Belgium', code: 'BE', dial: '+32' },
  { name: 'China', code: 'CN', dial: '+86' },
  { name: 'Japan', code: 'JP', dial: '+81' },
  { name: 'Togo', code: 'TG', dial: '+228' },
  { name: 'Ivory Coast', code: 'CI', dial: '+225' },
  { name: 'Other', code: 'OTHER', dial: '' }
]

const countryCodes = [
  { label: '+233 (GH)', value: '+233' },
  { label: '+44 (UK)', value: '+44' },
  { label: '+1 (US/CA)', value: '+1' },
  { label: '+234 (NG)', value: '+234' },
  { label: '+49 (DE)', value: '+49' },
  { label: '+33 (FR)', value: '+33' },
  { label: '+31 (NL)', value: '+31' },
  { label: '+27 (ZA)', value: '+27' },
  { label: '+32 (BE)', value: '+32' },
  { label: '+971 (UAE)', value: '+971' },
  { label: '+228 (TG)', value: '+228' },
  { label: '+225 (CI)', value: '+225' }
]

export default function ProfileSettings() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem('userAvatar')
  )
  const [userName, setUserName] = useState(
    () => localStorage.getItem('userName') || ''
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

  const [form, setForm] = useState(() => {
    const name = localStorage.getItem('userName') || ''
    return {
      fullName: name,
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
      chapter: 'The Base - Ghana Chapter',
      country: userPlatform === 'GHANA' ? 'Ghana' : ''
    }
  })

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.fullName) {
      localStorage.setItem('userName', form.fullName)
      setUserName(form.fullName)
      window.dispatchEvent(new Event('storage'))
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
      pdf.save(`THE-BASE-CARD-${userRegNo || 'MEMBER'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handlePrint = async () => {
    if (!cardRef.current) return
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Membership Card</title>
              <style>
                body { margin: 0; display: flex; items-center; justify-center; height: 100vh; }
                img { width: 85.6mm; height: 54mm; }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print();window.close()" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  return (
    <div className="max-w-full py-12">
      
      {/* Page Title - Now with horizontal padding only for content alignment */}
      <div className="mb-10 border-b border-divider-gold pb-6 px-4 md:px-10">
        <p className="font-meta text-warm-gold uppercase tracking-widest text-xs mb-1">Account</p>
        <h2 className="font-meta font-black text-3xl text-primary uppercase tracking-tight">Profile Settings</h2>
        <p className="text-muted-gray text-sm mt-1">Manage your identity, download your card and update your details.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start px-4 md:px-10">
        
        {/* Column 1: Membership Card Preview (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-8">
          
          <div className="bg-white border border-slate-200 p-2 shadow-2xl relative group">
            <h3 className="font-meta font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Membership Card Preview</h3>
            
            {/* The Membership Card Component */}
            <div ref={cardRef}>
              <MembershipCard 
                userName={form.fullName}
                avatarUrl={avatarUrl}
                userRegNo={userRegNo}
                initials={initials}
                gender={form.gender}
                joinedDate={form.joinedDate}
                status={form.status}
                region={form.region}
                constituency={form.constituency}
                country={form.country}
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
              className="flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-warm-gold text-charcoal-dark font-meta font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:opacity-90 transition-all shadow-md leading-tight"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">print</span>
              Print Card
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-white border border-slate-200 text-charcoal-dark font-meta font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-slate-50 transition-all shadow-sm leading-tight"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">download</span>
              Download PDF
            </button>
          </div>


          <div className="bg-white border border-slate-200 p-8 shadow-sm">
            <h4 className="font-meta font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">Membership Verification</h4>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
              <p className="text-xs font-bold text-charcoal-dark font-meta uppercase tracking-tight">Status: Active & Verified</p>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
              Your digital card is real-time verifiable. Use the QR code to present your credentials at official movement events.
            </p>
          </div>
        </div>

        {/* Column 2: Personal Information Form (xl:col-span-7) */}
        <div className="xl:col-span-7">
          <form onSubmit={handleSave} className="space-y-8">
            <section className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-2">
                <h3 className="font-meta font-bold text-xs sm:text-sm text-charcoal-dark uppercase tracking-wider flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[14px] shrink-0">01</span>
                  Personal Information
                </h3>
                <p className="text-[10px] text-slate-400 font-meta uppercase tracking-widest italic">Official Records</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    placeholder="Full name as on official ID"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="Email address (e.g. you@example.com)"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={form.countryCode}
                        onChange={e => handleChange('countryCode', e.target.value)}
                        className="w-24 border-b-2 border-slate-100 bg-transparent py-3 pr-8 text-xs text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer"
                      >
                        {countryCodes.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="e.g. 24 123 4567"
                      className="flex-1 border-b-2 border-slate-100 bg-transparent py-3 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Gender & Age Group</label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={e => handleChange('gender', e.target.value)}
                      className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer"
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
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Profession</label>
                  <input
                    value={form.profession}
                    onChange={e => handleChange('profession', e.target.value)}
                    placeholder="E.g. Teacher, Engineer, Student"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Assigned Chapter</label>
                  <input
                    value={form.chapter}
                    onChange={e => handleChange('chapter', e.target.value)}
                    placeholder="E.g. The Base - Accra Chapter"
                    className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>

                {userPlatform === 'GHANA' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Region</label>
                      <div className="relative">
                        <select
                          value={form.region}
                          onChange={e => {
                            const newRegion = e.target.value
                            setForm(prev => ({ ...prev, region: newRegion, constituency: '' }))
                          }}
                          className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Region</option>
                          {ghanaRegions.map(reg => (
                            <option key={reg} value={reg}>{reg}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Constituency</label>
                      <div className="relative">
                        <select
                          value={form.constituency}
                          disabled={!form.region}
                          onChange={e => handleChange('constituency', e.target.value)}
                          className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Select Constituency</option>
                          {form.region && regionConstituencies[form.region]?.map(con => (
                            <option key={con} value={con}>{con}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Country of Residence</label>
                    <div className="relative">
                      <select
                        value={form.country}
                        onChange={e => {
                          const countryName = e.target.value
                          const countryData = countries.find(c => c.name === countryName)
                          setForm(prev => ({ 
                            ...prev, 
                            country: countryName,
                            countryCode: countryData?.dial || prev.countryCode
                          }))
                        }}
                        className="w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-black uppercase tracking-tight focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => (
                          <option key={c.code} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 space-y-4 pt-4">
                  <label className="text-[10px] font-meta font-bold text-slate-400 uppercase tracking-[0.2em] block">Short Bio</label>
                  <textarea
                    rows={4}
                    value={form.bio}
                    onChange={e => handleChange('bio', e.target.value)}
                    placeholder="A brief statement about your commitment to the Ghana First movement..."
                    className="w-full border-2 border-slate-50 bg-slate-50/50 p-6 text-sm text-charcoal-dark font-medium focus:outline-none focus:border-brand-green transition-all resize-none leading-relaxed placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-16 py-6 bg-brand-green text-white font-meta font-black uppercase tracking-[0.3em] text-xs hover:opacity-95 active:scale-[0.98] transition-all shadow-2xl shadow-brand-green/20"
              >
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                Save Changes
              </button>

              {saved && (
                <div className="flex items-center gap-3 text-brand-green text-[10px] font-meta font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-500">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  Information Synchronized
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <section className="mt-16 p-10 border-2 border-dashed border-red-100 bg-red-50/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                  <h4 className="font-meta font-bold text-xs text-red-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Danger Zone
                  </h4>
                  <p className="text-[12px] sm:text-xs text-slate-500 font-body-md max-w-md">Deactivating your account will permanently delete all your contribution history and movement records. This action cannot be undone.</p>
                </div>
                <button
                  type="button"
                  className="w-full lg:w-auto px-8 py-3.5 border-2 border-red-200 text-red-600 text-[10px] font-meta font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  Deactivate Membership
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
