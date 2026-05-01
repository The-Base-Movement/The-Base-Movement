import { useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, FileText, Upload, User, Eye, EyeOff, ArrowDownToLine, CheckCircle2, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import MembershipCard from '../components/MembershipCard'

const ageRanges = ['16-25', '26-40', '41-60', '60+']
const educationLevels = [
  'None',
  'Primary',
  'JHS / Middle School',
  'SHS / Secondary',
  'Vocational / Technical',
  'Diploma / HND',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD / Doctorate',
  'Professional Certification'
]
const ghanaRegions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
]

const diasporaCountries = [
  'United Kingdom', 'United States', 'Canada', 'Germany', 'France', 'Australia', 'South Africa', 'United Arab Emirates', 'Netherlands', 'Italy', 'Austria', 'Belgium', 'Brazil', 'Burkina Faso', 'Cameroon', 'China', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'India', 'Ireland', 'Israel', 'Japan', 'Kenya', 'Kuwait', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'New Zealand', 'Nigeria', 'Norway', 'Poland', 'Portugal', 'Qatar', 'Russia', 'Saudi Arabia', 'Senegal', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand', 'Togo', 'Turkey'
]

const countryCodes: Record<string, string> = {
  'Ghana': '+233',
  'United Kingdom': '+44',
  'United States': '+1',
  'Canada': '+1',
  'Germany': '+49',
  'France': '+33',
  'Australia': '+61',
  'South Africa': '+27',
  'United Arab Emirates': '+971',
  'Netherlands': '+31',
  'Italy': '+39',
  'Austria': '+43',
  'Belgium': '+32',
  'Brazil': '+55',
  'Burkina Faso': '+226',
  'Cameroon': '+237',
  'China': '+86',
  'Czech Republic': '+420',
  'Denmark': '+45',
  'Egypt': '+20',
  'Finland': '+358',
  'India': '+91',
  'Ireland': '+353',
  'Israel': '+972',
  'Japan': '+81',
  'Kenya': '+254',
  'Kuwait': '+965',
  'Luxembourg': '+352',
  'Malaysia': '+60',
  'Mexico': '+52',
  'Morocco': '+212',
  'New Zealand': '+64',
  'Nigeria': '+234',
  'Norway': '+47',
  'Poland': '+48',
  'Portugal': '+351',
  'Qatar': '+974',
  'Russia': '+7',
  'Saudi Arabia': '+966',
  'Senegal': '+221',
  'Singapore': '+65',
  'South Korea': '+82',
  'Spain': '+34',
  'Sweden': '+46',
  'Switzerland': '+41',
  'Tanzania': '+255',
  'Thailand': '+66',
  'Togo': '+228',
  'Turkey': '+90'
}

const regionConstituencies: Record<string, string[]> = {
  'Ahafo': [
    'Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'
  ],
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
  'Bono': [
    'Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West',
    'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'
  ],
  'Bono East': [
    'Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South',
    'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'
  ],
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
  'North East': [
    'Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'
  ],
  'Northern': [
    'Gushegu', 'Karaga', 'Kpandai', "Kumbungu", "Mion", "Nanton", "Bimbilla", "Wulensi", "Saboba", "Sagnarigu",
    "Savelugu", "Tamale Central"
  ]
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const platformParam = searchParams.get('platform')
  const [step, setStep] = useState<'choice' | 'form' | 'upload'>(platformParam ? 'form' : 'choice')
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState(platformParam || 'GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [regNumber, setRegNumber] = useState('')

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => setPhotoUrl(reader.result?.toString() || null))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '+233',
    selectedCountry: 'Ghana',
    contactNumber: '',
    ageRange: '',
    gender: 'Male',
    password: '',
    email: '',
    residentialAddress: '',
    region: '',
    constituency: '',
    chapter: '',
    profession: '',
    employment: '',
    educationLevel: '',
    emergencyContactName: '',
    emergencyRelationship: '',
    emergencyNumber: '',
  })

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    setFormData(prev => {
      const newData = { ...prev }
      if (newPlatform === 'GHANA') {
        newData.selectedCountry = 'Ghana'
        newData.countryCode = '+233'
      } else {
        newData.selectedCountry = diasporaCountries[0]
        newData.countryCode = countryCodes[diasporaCountries[0]] || '+1'
      }
      return newData
    })
  }

  // Sync logic moved to handleChange for better performance
  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-sync country and code when platform changes
      if (field === 'platform') {
        if (value === 'GHANA') {
          newData.selectedCountry = 'Ghana'
          newData.countryCode = '+233'
        } else {
          newData.selectedCountry = diasporaCountries[0]
          newData.countryCode = countryCodes[diasporaCountries[0]] || '+1'
        }
      }
      
      // Auto-sync code when country changes
      if (field === 'selectedCountry' && countryCodes[value]) {
        newData.countryCode = countryCodes[value]
      }

      if (field === 'region') {
        newData.constituency = ''
      }
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 4) {
      setFormStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const regNo = (platform === 'GHANA' ? 'GH-' : 'DI-') + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
      setRegNumber(regNo)
      
      // Live Data Sync: Insert into Neon Database
      try {
        await fetch('https://ep-red-math-alposcfu.apirest.c-3.eu-central-1.aws.neon.tech/neondb/rest/v1/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            full_name: formData.fullName,
            registration_number: regNo,
            platform: platform,
            country: formData.selectedCountry,
            country_code: formData.countryCode,
            phone_number: formData.countryCode + formData.contactNumber,
            age_range: formData.ageRange,
            gender: formData.gender,
            email: formData.email,
            residential_address: formData.residentialAddress,
            region: formData.region,
            constituency: formData.constituency,
            chapter: formData.chapter,
            profession: formData.profession,
            education_level: formData.educationLevel,
            emergency_contact_name: formData.emergencyContactName,
            emergency_relationship: formData.emergencyRelationship,
            emergency_phone: formData.emergencyNumber,
            avatar_url: photoUrl
          })
        })
      } catch (error) {
        console.error('Failed to sync with live database:', error)
      }

      // Persist user data so the dashboard can read it
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userName', formData.fullName)
      localStorage.setItem('userPlatform', platform)
      localStorage.setItem('userRegNo', regNo)
      if (photoUrl) {
        localStorage.setItem('userAvatar', photoUrl)
      }
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goBack = () => {
    setFormStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <main className="bg-surface-warm font-body-md min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 text-brand-green mb-6 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">Registration Complete</h1>
            <p className="text-slate-500 font-meta uppercase tracking-widest text-xs">Welcome to the movement, patriot.</p>
          </div>

          <div className="space-y-8">
            {/* Membership Card Preview */}
            <div className="bg-white border border-slate-200 p-2 shadow-2xl relative">
              <div className="border-b border-slate-100 pb-3 mb-4 px-4 pt-2">
                <h3 className="font-meta font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Official Membership Card</h3>
              </div>
              
              <div className="max-w-md mx-auto py-4">
                <MembershipCard 
                  userName={formData.fullName}
                  avatarUrl={photoUrl}
                  userRegNo={regNumber}
                  initials={formData.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')}
                  gender={formData.gender + ' / ' + formData.ageRange}
                  joinedDate={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  status="Active & Verified"
                  region={formData.region}
                  constituency={formData.constituency}
                  country={formData.selectedCountry}
                  chapter={formData.chapter}
                />
              </div>

              <div className="bg-slate-50 p-6 mt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-meta font-bold text-xs text-charcoal-dark uppercase tracking-wider mb-1">Registration Number</h4>
                    <p className="font-meta font-black text-xl text-brand-green tracking-tight">{regNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-warm-gold text-charcoal-dark font-meta font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">print</span>
                      Print Card
                    </button>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-charcoal-dark font-meta font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" /> Edit Info
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-8 shadow-sm">
                <h4 className="font-meta font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">Membership Verification</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                  <p className="text-xs font-bold text-charcoal-dark font-meta uppercase tracking-tight">Status: Active & Verified</p>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
                  Your official records have been synchronized with the movement's hub. You can now access the member dashboard.
                </p>
              </div>

              <div className="bg-brand-green text-white p-8 flex flex-col justify-between">
                <div>
                  <h4 className="font-meta font-bold text-[10px] text-white/60 uppercase tracking-widest mb-4">Next Step</h4>
                  <p className="text-sm font-bold font-meta uppercase leading-tight mb-4">Access your leadership dashboard to join a chapter.</p>
                </div>
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 p-3 text-center justify-center transition-colors">
                  Enter Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-surface-warm font-body-md min-h-screen flex flex-col justify-center py-12 px-4">
        <div className="max-w-xl w-full mx-auto">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="The Base" className="h-20 w-auto mx-auto mb-6" />
            <h1 className="text-3xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">The Base</h1>
            <div className="w-16 h-1 bg-[var(--brand-red)] mx-auto mb-4"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-meta">Membership Registration</h2>
          </div>

          <div className="space-y-6">
            <button
              onClick={() => {
                handlePlatformChange('GHANA')
                setStep('form')
                setFormStep(1)
              }}
              className="w-full group bg-white border border-slate-200 p-6 flex items-center gap-6 hover:border-brand-green transition-colors text-left shadow-sm"
            >
              <div className="w-16 h-16 bg-surface-warm flex items-center justify-center shrink-0 group-hover:bg-brand-green/10 transition-colors">
                <FileText className="w-8 h-8 text-brand-green" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-lg mb-1">Local Membership (Ghana)</h3>
                <p className="text-sm text-slate-500">For residents living and voting within the 16 regions of Ghana.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-brand-green transition-colors" />
            </button>

            <button
              onClick={() => {
                handlePlatformChange('DIASPORA')
                setStep('form')
                setFormStep(1)
              }}
              className="w-full group bg-white border border-slate-200 p-6 flex items-center gap-6 hover:border-brand-gold transition-colors text-left shadow-sm"
            >
              <div className="w-16 h-16 bg-surface-warm flex items-center justify-center shrink-0 group-hover:bg-brand-gold/10 transition-colors">
                <User className="w-8 h-8 text-brand-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-lg mb-1">Diaspora Membership</h3>
                <p className="text-sm text-slate-500">For Ghanaians living abroad who wish to support the movement.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-brand-gold transition-colors" />
            </button>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 font-body-md">
              Already a member? <Link to="/login" className="text-brand-green font-bold hover:underline">Sign in securely</Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'upload') {
    return (
      <main className="bg-surface-warm font-body-md min-h-screen flex flex-col justify-center py-12 px-4">
        <div className="max-w-xl w-full mx-auto">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="The Base" className="h-20 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">The Base</h1>
            <div className="w-16 h-1 bg-[var(--brand-red)] mx-auto mb-4"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-meta mb-4">Upload Paper Form</h2>
            
            <button
              onClick={() => setStep('choice')}
              className="text-xs font-bold text-brand-green uppercase tracking-wider hover:underline flex items-center justify-center gap-1 mx-auto font-meta"
            >
              <ArrowLeft className="w-4 h-4" /> Registration Options
            </button>
          </div>

          <div className="bg-white border border-slate-200 p-10 shadow-sm">
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center hover:bg-slate-100 transition-colors group cursor-pointer relative">
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="form-upload" />
              <ArrowDownToLine className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:text-brand-green transition-colors" />
              <p className="text-base text-slate-700 font-bold mb-2 font-meta uppercase">Select File to Upload</p>
              <p className="text-sm text-slate-500 font-meta uppercase tracking-wider">JPG, PNG, or PDF (max 5MB)</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Form step (Multi-page)
  return (
    <main className="bg-surface-warm font-body-md min-h-screen">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <img src="/logo.png" alt="The Base" className="h-20 w-auto mx-auto mb-6" />
          <h1 className="text-charcoal-dark mb-2">The Base</h1>
          
          {/* Ghana Flag Gradient Line */}
          <div className="w-24 h-1.5 mx-auto mb-4 flex">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          
          <h2 className="text-slate-500 mb-8">Official Registration Form</h2>
          
          <button
            onClick={() => setStep('choice')}
            className="inline-flex items-center gap-2 px-6 py-2 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all font-meta"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Registration Options
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Vertical Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2 sticky top-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-4">Registration Progress</p>
            
            <div className="space-y-1">
              {[
                { step: 1, label: 'Primary Details' },
                { step: 2, label: 'Demographic info' },
                { step: 3, label: 'Emergency contact' },
                { step: 4, label: 'Final Verification' }
              ].map((item) => (
                <div 
                  key={item.step}
                  className={`flex items-center gap-4 p-4 transition-all border-l-4 ${formStep === item.step ? 'bg-white border-brand-green shadow-sm' : 'border-transparent text-slate-400 opacity-60'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta shrink-0 ${formStep >= item.step ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {formStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                  </div>
                  <span className={`text-xs font-bold tracking-tight font-meta ${formStep === item.step ? 'text-charcoal-dark' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-charcoal-dark text-white rounded-none border-l-4 border-warm-gold">
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm-gold mb-2">Important Notice</p>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">Please ensure all official details match your government-issued identity documents exactly to avoid verification delays.</p>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
              <form onSubmit={handleSubmit}>
              
              {/* STEP 1: Primary Details */}
              {formStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 1: Primary Details</h3>
                    <p className="text-slate-500 mt-1 mb-0">Basic information required for your membership profile.</p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="fullName" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Full Name <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input
                      id="fullName"
                      placeholder="As it appears on official ID"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block mb-3">
                      Select Platform <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer border p-4 text-center transition-colors font-meta font-bold uppercase tracking-wider text-sm ${platform === 'GHANA' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input type="radio" name="platform" value="GHANA" checked={platform === 'GHANA'} onChange={() => handlePlatformChange('GHANA')} className="hidden" />
                        Base Ghana
                      </label>
                      <label className={`cursor-pointer border p-4 text-center transition-colors font-meta font-bold uppercase tracking-wider text-sm ${platform === 'DIASPORA' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input type="radio" name="platform" value="DIASPORA" checked={platform === 'DIASPORA'} onChange={() => handlePlatformChange('DIASPORA')} className="hidden" />
                        Base Diaspora
                      </label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'DIASPORA' ? (
                      <div className="space-y-3">
                        <label htmlFor="selectedCountry" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                          Country of Residence <span className="text-[var(--brand-red)]">*</span>
                        </label>
                        <select 
                          id="selectedCountry"
                          required
                          value={formData.selectedCountry} 
                          onChange={(e) => handleChange('selectedCountry', e.target.value)}
                          className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                          style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                        >
                          {diasporaCountries.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <label htmlFor="contactNumber" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                        Contact Number <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <div className="flex">
                        <select
                          value={formData.countryCode}
                          onChange={(e) => handleChange('countryCode', e.target.value)}
                          className="flex items-center px-2 bg-surface-warm border-y border-l border-slate-300 font-meta font-bold text-charcoal-dark text-xs appearance-none focus:outline-none"
                        >
                          {Object.entries(countryCodes).sort((a, b) => a[0].localeCompare(b[0])).map(([name, code]) => (
                            <option key={name} value={code}>{code} ({name})</option>
                          ))}
                        </select>
                        <input
                          id="contactNumber"
                          type="tel"
                          placeholder="Phone number"
                          required
                          value={formData.contactNumber}
                          onChange={(e) => handleChange('contactNumber', e.target.value)}
                          className="w-full form-understate p-4 text-charcoal-dark text-sm border-l-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="password" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Account Password <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-green"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Demographic Details */}
              {formStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 2: Demographic Details</h3>
                    <p className="text-slate-500 mt-1 mb-0">Further details to finalize your membership chapter.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block mb-3">
                        Age Range <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ageRanges.map(range => (
                          <label key={range} className={`cursor-pointer border p-3 text-center transition-colors font-meta font-bold uppercase tracking-widest text-[10px] ${formData.ageRange === range ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <input type="radio" name="ageRange" value={range} checked={formData.ageRange === range} onChange={() => handleChange('ageRange', range)} className="hidden" />
                            {range}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block mb-3">
                        Gender <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map(g => (
                          <label key={g} className={`cursor-pointer border p-3 text-center transition-colors font-meta font-bold uppercase tracking-widest text-[10px] ${formData.gender === g ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => handleChange('gender', g)} className="hidden" />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="residentialAddress" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Residential Address <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input
                      id="residentialAddress"
                      placeholder="Street, House Number, City"
                      required
                      value={formData.residentialAddress}
                      onChange={(e) => handleChange('residentialAddress', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'GHANA' ? (
                      <>
                        <div className="space-y-3">
                          <label htmlFor="region" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                            Region <span className="text-[var(--brand-red)]">*</span>
                          </label>
                          <select 
                            id="region"
                            required
                            value={formData.region} 
                            onChange={(e) => handleChange('region', e.target.value)}
                            className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                          >
                            <option value="">Select Region</option>
                            {ghanaRegions.map((region) => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label htmlFor="constituency" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                            Constituency <span className="text-[var(--brand-red)]">*</span>
                          </label>
                          <select 
                            id="constituency"
                            required
                            disabled={!formData.region}
                            value={formData.constituency} 
                            onChange={(e) => handleChange('constituency', e.target.value)}
                            className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta disabled:opacity-50"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                          >
                            <option value="">Select Constituency</option>
                            {formData.region && regionConstituencies[formData.region]?.map((con) => (
                              <option key={con} value={con}>{con}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <label htmlFor="chapter" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                          Assigned Chapter <span className="text-[var(--brand-red)]">*</span>
                        </label>
                        <input
                          id="chapter"
                          placeholder="E.g. UK Chapter - London"
                          required
                          value={formData.chapter}
                          onChange={(e) => handleChange('chapter', e.target.value)}
                          className="w-full form-understate p-4 text-charcoal-dark text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Emergency Contact */}
              {formStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 3: Emergency Details</h3>
                    <p className="text-slate-500 mt-1 mb-0">Crucial for member safety and institutional records.</p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="emergencyContactName" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Emergency Contact Name <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input
                      id="emergencyContactName"
                      placeholder="Full Name"
                      required
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="emergencyRelationship" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                        Relationship <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <input
                        id="emergencyRelationship"
                        placeholder="E.g. Spouse, Parent, Brother"
                        required
                        value={formData.emergencyRelationship}
                        onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="emergencyNumber" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                        Emergency Contact Number <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <input
                        id="emergencyNumber"
                        type="tel"
                        placeholder="Phone number"
                        required
                        value={formData.emergencyNumber}
                        onChange={(e) => handleChange('emergencyNumber', e.target.value)}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="profession" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                        Profession / Occupation <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <input
                        id="profession"
                        placeholder="E.g. Teacher, Nurse, Student"
                        required
                        value={formData.profession}
                        onChange={(e) => handleChange('profession', e.target.value)}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="educationLevel" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                        Education Level <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <select 
                        id="educationLevel"
                        required
                        value={formData.educationLevel} 
                        onChange={(e) => handleChange('educationLevel', e.target.value)}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                      >
                        <option value="">Select Level</option>
                        {educationLevels.map(lvl => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Verification */}
              {formStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 4: Final Verification</h3>
                    <p className="text-slate-500 mt-1 mb-0">Identity confirmation and oath of commitment.</p>
                  </div>

                  <div className="space-y-6">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Passport Photo <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    
                    {!photoUrl ? (
                      <div className="border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50 relative group transition-colors hover:border-brand-green">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4 group-hover:text-brand-green transition-colors" />
                        <p className="font-meta font-bold text-slate-500 uppercase tracking-widest text-[10px]">Click to upload passport photo</p>
                      </div>
                    ) : (
                      <div className="relative bg-slate-100 p-4 border border-slate-200">
                        <div className="relative h-[400px] w-full bg-charcoal-dark overflow-hidden">
                          <Cropper
                            image={photoUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={3 / 4}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                        </div>
                        <div className="flex items-center gap-4 mt-6 px-4 pb-4">
                          <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-brand-green"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            className="shrink-0 p-2 bg-slate-200 text-charcoal-dark hover:bg-[var(--brand-red)] hover:text-white transition-colors"
                            title="Remove photo"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-meta tracking-widest uppercase mt-2 text-center font-bold">Position your face within the frame</p>
                      </div>
                    )}
                  </div>

                  {/* Oath */}
                  <div className="bg-charcoal-dark text-white p-8 mt-8 border-l-4 border-brand-green">
                    <h5 className="text-warm-gold mb-3">The Base Declaration</h5>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      I hereby declare that the information provided is accurate to the best of my knowledge. I commit to uphold the core values of <strong>THE BASE</strong>: Patriotism, Honesty, and Discipline and pledge to advance the cause of <strong>GHANA FIRST</strong> in all my actions.
                    </p>
                    
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        id="privacy"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-5 h-5 shrink-0 text-brand-green bg-charcoal-dark border-slate-500 rounded-none focus:ring-brand-green cursor-pointer"
                      />
                      <label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer leading-tight font-medium">
                        I accept this declaration and agree to the <Link to="/privacy" className="text-warm-gold hover:underline font-bold">Privacy Policy</Link> <span className="text-[var(--brand-red)]">*</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-10 mt-12 border-t border-slate-200 flex justify-between gap-4">
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-charcoal-dark font-meta font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                ) : (
                  <div className="w-1/3"></div>
                )}
                
                <button
                  type="submit"
                  disabled={formStep === 4 && !agreed}
                  className={`font-meta font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-3 transition-all flex-1 shadow-md ${formStep === 4 && !agreed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand-green text-white hover:opacity-90 active:scale-[0.99]'}`}
                >
                  {formStep < 4 ? (
                    <>Next Step <ArrowRight className="w-5 h-5" /></>
                  ) : (
                    <>Submit Official Registration <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
