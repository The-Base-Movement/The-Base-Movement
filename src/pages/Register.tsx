import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, FileText, Upload, User, Eye, EyeOff, ArrowDownToLine, CheckCircle2, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

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
      let newData = { ...prev }
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
      let newData = { ...prev, [field]: value }
      
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
    if (formStep < 3) {
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
      <main className="bg-surface-warm font-body-md min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-full h-full bg-[url('/hero-bg.png')] bg-cover bg-center opacity-[0.03] pointer-events-none mix-blend-luminosity"></div>

        <div className="max-w-2xl w-full z-10 flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-charcoal-dark mb-2 font-meta uppercase tracking-tight">Registration Complete</h2>
            <p className="text-slate-600 font-body-md max-w-md mx-auto">
              Welcome to the movement. Your official membership card has been generated.
            </p>
          </div>

          {/* Membership Card */}
          <div className="w-full max-w-[400px] aspect-[1.58/1] relative overflow-hidden bg-white shadow-2xl border border-slate-200 rounded-xl mb-10 flex flex-col transform transition-transform hover:scale-105 duration-500">
            {/* Top Stripe */}
            <div className="bg-brand-green text-white px-4 py-3 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="The Base" className="h-6 w-auto brightness-0 invert" />
                <span className="font-meta font-bold tracking-widest text-sm uppercase">The Base</span>
              </div>
              <span className="font-meta tracking-widest text-[10px] uppercase opacity-80 border border-white/30 px-2 py-0.5 rounded-sm">Membership Card</span>
            </div>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
              <img src="/logo.png" alt="Watermark" className="w-48 h-48 grayscale" />
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex gap-5 z-10">
              {/* Photo */}
              <div className="w-[30%] shrink-0 flex flex-col gap-2">
                <div className="w-full aspect-[3/4] bg-slate-100 border border-slate-300 rounded overflow-hidden">
                  {photoUrl ? (
                    <img src={photoUrl} alt={formData.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-center space-y-3">
                <div>
                  <p className="text-[9px] font-meta text-slate-500 uppercase tracking-wider mb-0.5">Full Name</p>
                  <p className="font-meta font-bold text-charcoal-dark uppercase text-sm leading-tight">{formData.fullName || 'Member Name'}</p>
                </div>
                
                <div className="flex gap-4">
                  <div>
                    <p className="text-[9px] font-meta text-slate-500 uppercase tracking-wider mb-0.5">Reg. No.</p>
                    <p className="font-meta font-bold text-brand-green uppercase text-xs">{regNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-meta text-slate-500 uppercase tracking-wider mb-0.5">Platform</p>
                    <p className="font-meta font-bold text-charcoal-dark uppercase text-xs">{platform}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-meta text-slate-500 uppercase tracking-wider mb-0.5">Assigned Chapter</p>
                  <p className="font-meta font-bold text-charcoal-dark uppercase text-[10px] truncate">
                    {formData.chapter || 'National Chapter'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Stripe */}
            <div className="h-2 bg-warm-gold w-full absolute bottom-0 z-10"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[400px]">
            <Link to="/dashboard" className="flex-1 bg-brand-green text-white font-meta font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-all flex justify-center items-center text-sm shadow-md">
              Go to Dashboard
            </Link>
            <button onClick={() => window.print()} className="flex-1 bg-charcoal-dark text-white font-meta font-bold uppercase tracking-wider py-4 hover:bg-black transition-all flex justify-center items-center text-sm shadow-md">
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Download
            </button>
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
            <div className="w-16 h-1 bg-[#CE1126] mx-auto mb-4"></div>
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
            <div className="w-16 h-1 bg-[#CE1126] mx-auto mb-4"></div>
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
    <main className="bg-surface-warm font-body-md min-h-screen pb-24 pt-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="The Base" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">The Base</h1>
          <div className="w-16 h-1 bg-[#CE1126] mx-auto mb-4"></div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-meta mb-6">Official Registration</h2>
          
          <button
            onClick={() => setStep('choice')}
            className="text-xs font-bold text-brand-green uppercase tracking-wider hover:underline flex items-center justify-center gap-1 mx-auto font-meta mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Registration Options
          </button>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center max-w-lg mx-auto">
            <div className="flex items-center w-full">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta z-10 ${formStep >= 1 ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {formStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : 1}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider font-meta mt-2 text-slate-500 hidden sm:block absolute top-10 whitespace-nowrap">Primary</div>
                <div className={`absolute top-4 left-1/2 w-full h-1 ${formStep >= 2 ? 'bg-brand-green' : 'bg-slate-200'}`}></div>
              </div>
              
              {/* Step 2 */}
              <div className="relative flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta z-10 ${formStep >= 2 ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {formStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : 2}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider font-meta mt-2 text-slate-500 hidden sm:block absolute top-10 whitespace-nowrap">Demographic</div>
                <div className={`absolute top-4 left-1/2 w-full h-1 ${formStep >= 3 ? 'bg-brand-green' : 'bg-slate-200'}`}></div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta z-10 ${formStep >= 3 ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'}`}>
                  3
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider font-meta mt-2 text-slate-500 hidden sm:block absolute top-10 whitespace-nowrap">Verification</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
          <form onSubmit={handleSubmit}>
          
          {/* STEP 1: Primary Details */}
          {formStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                <h3 className="font-meta font-bold uppercase tracking-tight text-xl text-charcoal-dark">Step 1: Primary Details</h3>
                <p className="text-sm text-slate-500 font-body-md mt-1">Basic information required for your membership profile.</p>
              </div>

              <div className="space-y-3">
                <label htmlFor="fullName" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                  Full Name <span className="text-[#CE1126]">*</span>
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
                  Select Platform <span className="text-[#CE1126]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border p-4 text-center transition-colors font-meta font-bold uppercase tracking-wider text-sm ${platform === 'GHANA' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" name="platform" value="GHANA" checked={platform === 'GHANA'} onChange={() => setPlatform('GHANA')} className="hidden" />
                    Base Ghana
                  </label>
                  <label className={`cursor-pointer border p-4 text-center transition-colors font-meta font-bold uppercase tracking-wider text-sm ${platform === 'DIASPORA' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" name="platform" value="DIASPORA" checked={platform === 'DIASPORA'} onChange={() => setPlatform('DIASPORA')} className="hidden" />
                    Base Diaspora
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {platform === 'DIASPORA' ? (
                  <div className="space-y-3">
                    <label htmlFor="selectedCountry" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Country of Residence <span className="text-[#CE1126]">*</span>
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
                    Contact Number <span className="text-[#CE1126]">*</span>
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

                {platform === 'GHANA' && (
                  <div className="space-y-3">
                    <label htmlFor="ageRange" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                      Age Bracket <span className="text-[#CE1126]">*</span>
                    </label>
                    <select 
                      id="ageRange"
                      required
                      value={formData.ageRange} 
                      onChange={(e) => handleChange('ageRange', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                    >
                      <option value="">Select Age</option>
                      {ageRanges.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block mb-3">
                  Gender <span className="text-[#CE1126]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label key={g} className={`cursor-pointer border py-3 text-center transition-colors font-meta font-bold text-sm ${formData.gender === g ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => handleChange('gender', g)} className="hidden" />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">
                  Account Password <span className="text-[#CE1126]">*</span>
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

          {/* STEP 2: Demographic Data */}
          {formStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                <h3 className="font-meta font-bold uppercase tracking-tight text-xl text-charcoal-dark">Step 2: Demographic Data (Optional)</h3>
                <p className="text-sm text-slate-500 font-body-md mt-1">This information helps us understand the reach of the movement.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="email" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Email Address <span className="text-[10px] lowercase normal-case opacity-70 tracking-normal">(Optional)</span></label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full form-understate p-4 text-charcoal-dark text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="region" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Region</label>
                  <select 
                    id="region"
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
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="constituency" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Voting Constituency in Ghana</label>
                  {formData.region && regionConstituencies[formData.region] ? (
                    <select 
                      id="constituency"
                      value={formData.constituency} 
                      onChange={(e) => handleChange('constituency', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                    >
                      <option value="">Select Constituency</option>
                      {regionConstituencies[formData.region].map((constituency) => (
                        <option key={constituency} value={constituency}>{constituency}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="constituency"
                      placeholder="E.g. Ayawaso West"
                      value={formData.constituency}
                      onChange={(e) => handleChange('constituency', e.target.value)}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <label htmlFor="residentialAddress" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Residential Address <span className="text-[#CE1126]">*</span></label>
                  <input
                    id="residentialAddress"
                    placeholder="House No, Street Name, City"
                    required
                    value={formData.residentialAddress}
                    onChange={(e) => handleChange('residentialAddress', e.target.value)}
                    className="w-full form-understate p-4 text-charcoal-dark text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="profession" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Profession / Skill <span className="text-[#CE1126]">*</span></label>
                  <input
                    id="profession"
                    placeholder="E.g. Teacher, Artisan"
                    required
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="chapter" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Assigned Chapter <span className="text-[#CE1126]">*</span></label>
                  <input
                    id="chapter"
                    placeholder="E.g. The Base - Accra Chapter"
                    required
                    value={formData.chapter}
                    onChange={(e) => handleChange('chapter', e.target.value)}
                    className="w-full form-understate p-4 text-charcoal-dark text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block mb-3">Currently Employed?</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Yes', 'No'].map((emp) => (
                      <label key={emp} className={`cursor-pointer border py-3 text-center transition-colors font-meta font-bold text-sm ${formData.employment === emp ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input type="radio" name="employment" value={emp} checked={formData.employment === emp} onChange={() => handleChange('employment', emp)} className="hidden" />
                        {emp}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="education" className="text-xs font-bold text-slate-500 font-meta tracking-widest uppercase block">Education Level <span className="text-[#CE1126]">*</span></label>
                  <select 
                    id="education"
                    required
                    value={formData.educationLevel} 
                    onChange={(e) => handleChange('educationLevel', e.target.value)}
                    className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none font-meta"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                  >
                    <option value="">Select Level</option>
                    {educationLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Verification Photo & Declaration */}
          {formStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                <h3 className="font-meta font-bold uppercase tracking-tight text-xl text-charcoal-dark">Step 3: Verification & Oath</h3>
                <p className="text-sm text-slate-500 font-body-md mt-1">Final steps to complete your registration to the movement.</p>
              </div>

              <div className="space-y-6">
                <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block mb-2">
                  Verification Photo <span className="text-[#CE1126]">*</span>
                </label>
                
                {!photoUrl ? (
                  <div className="border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="photo-upload" required />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-base text-slate-700 font-bold mb-1 font-meta uppercase">Upload Passport-style Photo</p>
                    <p className="text-xs text-slate-500 font-meta tracking-wider uppercase">Must clearly show your face</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 p-4 bg-slate-50">
                    <div className="relative w-full h-80 bg-charcoal-dark mb-4">
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
                    <div className="flex items-center gap-4">
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
                        className="shrink-0 p-2 bg-slate-200 text-charcoal-dark hover:bg-[#CE1126] hover:text-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 font-meta tracking-wider uppercase mt-4 text-center">Position your face within the frame</p>
                  </div>
                )}
              </div>

              {/* Oath */}
              <div className="bg-charcoal-dark text-white p-8 mt-8">
                <h3 className="font-meta font-bold uppercase tracking-widest text-warm-gold mb-3 text-sm">The Base Declaration</h3>
                <p className="font-body-md text-sm leading-relaxed mb-6 text-slate-300">
                  I hereby declare that the information provided is accurate to the best of my knowledge. I commit to uphold the core values of <strong>THE BASE</strong> — Patriotism, Honesty, and Discipline — and pledge to advance the cause of <strong>GHANA FIRST</strong> in all my actions.
                </p>
                
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 shrink-0 text-brand-green bg-charcoal-dark border-slate-500 rounded-none focus:ring-brand-green"
                  />
                  <label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer leading-tight">
                    I accept this declaration and agree to the <Link to="/privacy" className="text-warm-gold hover:underline">Privacy Policy</Link> <span className="text-[#CE1126]">*</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-10 mt-8 border-t border-slate-200 flex justify-between gap-4">
            {formStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-charcoal-dark font-meta font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={formStep === 3 && !agreed}
              className={`font-meta font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-3 transition-all ${formStep === 1 ? 'w-full' : 'flex-1'} ${formStep === 3 && !agreed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand-green text-white hover:opacity-90 active:scale-[0.99]'}`}
            >
              {formStep < 3 ? (
                <>Next Step <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Submit Official Registration <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </main>
  )
}
