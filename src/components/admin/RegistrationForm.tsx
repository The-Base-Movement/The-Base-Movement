import { useState, useCallback } from 'react'
import { X, ArrowRight, ArrowLeft, Upload, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

const ageRanges = ['16-25', '26-40', '41-60', '60+']
const educationLevels = [
  'None', 'Primary', 'JHS / Middle School', 'SHS / Secondary',
  'Vocational / Technical', 'Diploma / HND', "Bachelor's Degree",
  "Master's Degree", 'PhD / Doctorate', 'Professional Certification'
]
const ghanaRegions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
]

const diasporaCountries = [
  'United Kingdom', 'United States', 'Canada', 'Germany', 'France', 'Australia', 'South Africa', 'United Arab Emirates', 'Netherlands', 'Italy', 'Austria', 'Belgium', 'Brazil', 'Burkina Faso', 'Cameroon', 'China', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'India', 'Ireland', 'Israel', 'Japan', 'Kenya', 'Kuwait', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'New Zealand', 'Nigeria', 'Norway', 'Poland', 'Portugal', 'Qatar', 'Russia', 'Saudi Arabia', 'Senegal', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand', 'Togo', 'Turkey'
]

const countryCodes: Record<string, string> = {
  'Ghana': '+233', 'United Kingdom': '+44', 'United States': '+1', 'Canada': '+1', 'Germany': '+49', 'France': '+33', 'Australia': '+61', 'South Africa': '+27', 'United Arab Emirates': '+971', 'Netherlands': '+31', 'Italy': '+39', 'Austria': '+43', 'Belgium': '+32', 'Brazil': '+55', 'Burkina Faso': '+226', 'Cameroon': '+237', 'China': '+86', 'Czech Republic': '+420', 'Denmark': '+45', 'Egypt': '+20', 'Finland': '+358', 'India': '+91', 'Ireland': '+353', 'Israel': '+972', 'Japan': '+81', 'Kenya': '+254', 'Kuwait': '+965', 'Luxembourg': '+352', 'Malaysia': '+60', 'Mexico': '+52', 'Morocco': '+212', 'New Zealand': '+64', 'Nigeria': '+234', 'Norway': '+47', 'Poland': '+48', 'Portugal': '+351', 'Qatar': '+974', 'Russia': '+7', 'Saudi Arabia': '+966', 'Senegal': '+221', 'Singapore': '+65', 'South Korea': '+82', 'Spain': '+34', 'Sweden': '+46', 'Switzerland': '+41', 'Tanzania': '+255', 'Thailand': '+66', 'Togo': '+228', 'Turkey': '+90'
}

const regionConstituencies: Record<string, string[]> = {
  'Ahafo': ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  'Ashanti': ['Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South', 'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Akrofuom', 'Odotobri', 'Manso Nkwanta', 'Manso Edubia', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South', 'Asawase', 'Asokwa', 'Atwima-Kwanwoma', 'Atwima Mponua', 'Atwima-Nwabiagya South', 'Atwima-Nwabiagya North', 'Bekwai', 'Bosome-Freho', 'Bosomtwe', 'Ejisu', 'Ejura-Sekyedumase', 'Juaben', 'Bantama', 'Manhyia North', 'Manhyia South', 'Nhyiaeso', 'Subin', 'Kwabre East', 'Kwadaso', 'Mampong', 'Obuasi East', 'Obuasi West', 'Offinso South', 'Offinso North', 'Oforikrom', 'Old Tafo', 'Sekyere Afram Plains', 'Nsuta-Kwamang-Beposo', 'Afigya Sekyere East', 'Kumawu', 'Effiduase-Asokore', 'Suame'],
  'Bono': ['Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'],
  'Bono East': ['Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'],
  'Central': ['Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa', 'Assin Central', 'Assin North', 'Assin South', 'Awutu-Senya East', 'Awutu-Senya West', 'Cape Coast North', 'Cape Coast South', 'Effutu', 'Ekumfi', 'Gomoa East', 'Gomoa Central', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem', 'Mfantseman', 'Twifo-Atii Morkwaa', 'Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West'],
  'Eastern': ['Abuakwa North', 'Abuakwa South', 'Achiase', 'Akropong', 'Akwapim South', 'Ofoase-Ayirebi', 'Asene Akroso Manso', 'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano', 'Akim Oda', 'Abirem', 'Akim Swedru', 'Akwatia', 'Fanteakwa North', 'Fanteakwa South', 'Kade', 'Afram Plains North', 'Afram Plains South', 'Abetifi', 'Mpraeso', 'Nkawkaw', 'Lower Manya', 'New Juaben North', 'New Juaben South', 'Nsawam Adoagyiri', 'Okere', 'Suhum', 'Upper Manya', 'Upper West Akim', 'Lower West Akim', 'Yilo Krobo'],
  'Greater Accra': ['Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Ablekuma South', 'Odododiodio', 'Okaikwei Central', 'Okaikwei South', 'Ada', 'Sege', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso East', 'Ayawaso North', 'Ayawaso West', 'Anyaa-Sowutuom', 'Dome-Kwabenya', 'Trobu', 'Bortianor-Ngleshie-Amanfrom', 'Domeabra-Obom', 'Amasaman', 'Korle Klottey', 'Kpone-Katamanso', 'Krowor', 'Dade Kotopon', 'Abokobi-Madina', 'Ledzokuku', 'Ningo-Prampram', 'Okaikwei North', 'Shai-Osudoku', 'Tema Central', 'Tema East', 'Tema West', 'Weija'],
  'North East': ['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'],
  'Northern': ['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Mion', 'Nanton', 'Bimbilla', 'Wulensi', 'Saboba', 'Sagnarigu', 'Savelugu', 'Tamale Central']
}

export interface RegistrationSubmission {
  fullName: string
  registrationNumber: string
  platform: string
  country: string
  countryCode: string
  contactNumber: string
  ageRange: string
  gender: string
  email: string
  residentialAddress: string
  region: string
  constituency: string
  chapter: string
  profession: string
  educationLevel: string
  emergencyContactName: string
  emergencyRelationship: string
  emergencyNumber: string
  photoUrl: string | null
}

interface RegistrationFormProps {
  onClose: () => void
  onSuccess: () => void
  onSubmitData?: (data: RegistrationSubmission) => void
}

export default function RegistrationForm({ onClose, onSuccess, onSubmitData }: RegistrationFormProps) {
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState('GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    country: 'Ghana',
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
        newData.country = 'Ghana'
        newData.countryCode = '+233'
      } else {
        newData.country = diasporaCountries[0]
        newData.countryCode = countryCodes[diasporaCountries[0]] || '+1'
      }
      return newData
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      if (field === 'country' && countryCodes[value]) {
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
      const modalElement = document.getElementById('registration-modal-content')
      if (modalElement) modalElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsSubmitting(true)
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const randomNum = String(Math.floor(1000 + Math.random() * 9000))
      const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`

      // Pass the complete submission back to the parent before closing
      if (onSubmitData) {
        onSubmitData({
          ...formData,
          registrationNumber: regNo,
          platform,
          photoUrl,
        })
      }

      setIsSubmitting(false)
      onSuccess()
    }
  }

  const goBack = () => {
    setFormStep(prev => prev - 1)
  }

  return (
    <div className="bg-white max-w-5xl w-full max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-300 shadow-2xl flex flex-col font-meta">
      {/* Header */}
      <div className="bg-on-surface p-8 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Register new member</h2>
          <p className="text-accent text-micro mt-1 tracking-tight font-bold opacity-80">Admin override workflow</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Body */}
      <div id="registration-modal-content" className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Vertical Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-2 sticky top-0 bg-white z-10 pb-4">
            <p className="text-micro font-bold text-muted-foreground/40 tracking-tight mb-8 pl-4">Registration progress</p>
            
            <div className="space-y-2">
              {[
                { step: 1, label: 'Primary Details' },
                { step: 2, label: 'Demographic info' },
                { step: 3, label: 'Emergency & Profession' },
                { step: 4, label: 'Final Verification' }
              ].map((item) => (
                <div 
                  key={item.step}
                  className={`flex items-center gap-5 p-5 transition-all border-l-4 rounded-r-2xl ${formStep === item.step ? 'bg-muted/5 border-primary shadow-sm' : 'border-transparent text-muted-foreground/40 opacity-60'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${formStep >= item.step ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-muted/10 text-muted-foreground/60'}`}>
                    {formStep > item.step ? <CheckCircle2 className="w-6 h-6" /> : item.step}
                  </div>
                  <span className={`text-tiny font-bold tracking-tight ${formStep === item.step ? 'text-on-surface' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white border border-border/40 p-10 shadow-sm rounded-sm">
              {formStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-on-surface pb-4 mb-8">
                    <h3 className="text-on-surface font-bold text-xl tracking-tight">Step 1: Primary details</h3>
                    <p className="text-muted-foreground/60 mt-1 mb-0 text-sm">Basic information required for your membership profile.</p>
                  </div>
 
                  <div className="space-y-3">
                    <label htmlFor="fullName" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="fullName"
                      placeholder="As it appears on official ID"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-micro font-bold text-on-surface/60 tracking-tight block mb-4">
                      Select platform <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer border p-4 text-center transition-all rounded-sm font-bold tracking-tight text-micro ${platform === 'GHANA' ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 text-muted-foreground/40 hover:bg-muted/5'}`}>
                        <input type="radio" name="platform" value="GHANA" checked={platform === 'GHANA'} onChange={() => handlePlatformChange('GHANA')} className="hidden" />
                        Base Ghana
                      </label>
                      <label className={`cursor-pointer border p-4 text-center transition-all rounded-sm font-bold tracking-tight text-micro ${platform === 'DIASPORA' ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 text-muted-foreground/40 hover:bg-muted/5'}`}>
                        <input type="radio" name="platform" value="DIASPORA" checked={platform === 'DIASPORA'} onChange={() => handlePlatformChange('DIASPORA')} className="hidden" />
                        Base Diaspora
                      </label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'DIASPORA' ? (
                      <div className="space-y-3">
                        <label htmlFor="selectedCountry" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                          Country of residence <span className="text-destructive">*</span>
                        </label>
                        <select 
                          id="selectedCountry"
                          required
                          value={formData.country} 
                          onChange={(e) => handleChange('country', e.target.value)}
                          className="w-full p-4 text-on-surface text-sm appearance-none bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                          style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                        >
                          {diasporaCountries.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <label htmlFor="contactNumber" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                        Contact number <span className="text-destructive">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.countryCode}
                          onChange={(e) => handleChange('countryCode', e.target.value)}
                          className="flex items-center px-4 bg-muted/5 border border-border/60 rounded-sm font-bold text-on-surface text-micro appearance-none focus:outline-none"
                        >
                          {Array.from(new Set(Object.values(countryCodes))).sort().map((code) => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <input
                          id="contactNumber"
                          type="tel"
                          placeholder="Phone number"
                          required
                          value={formData.contactNumber}
                          onChange={(e) => handleChange('contactNumber', e.target.value)}
                          className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="password" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                      Account password <span className="text-destructive">*</span>
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
                        className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-on-surface pb-4 mb-8">
                    <h3 className="text-on-surface font-bold text-xl tracking-tight">Step 2: Demographic details</h3>
                    <p className="text-muted-foreground/60 mt-1 mb-0 text-sm">Further details to finalize your membership chapter.</p>
                  </div>
 
                   <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-micro font-bold text-on-surface/60 tracking-tight block mb-4">
                        Age range <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ageRanges.map(range => (
                          <label key={range} className={`cursor-pointer border p-3 text-center transition-all rounded-sm font-bold tracking-tight text-micro ${formData.ageRange === range ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 text-muted-foreground/40 hover:bg-muted/5'}`}>
                            <input type="radio" name="ageRange" value={range} checked={formData.ageRange === range} onChange={() => handleChange('ageRange', range)} className="hidden" />
                            {range}
                          </label>
                        ))}
                      </div>
                    </div>
 
                    <div className="space-y-3">
                      <label className="text-micro font-bold text-on-surface/60 tracking-tight block mb-4">
                        Gender <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map(g => (
                          <label key={g} className={`cursor-pointer border p-3 text-center transition-all rounded-sm font-bold tracking-tight text-micro ${formData.gender === g ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 text-muted-foreground/40 hover:bg-muted/5'}`}>
                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => handleChange('gender', g)} className="hidden" />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="residentialAddress" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                      Residential address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="residentialAddress"
                      placeholder="Street, House Number, City"
                      required
                      value={formData.residentialAddress}
                      onChange={(e) => handleChange('residentialAddress', e.target.value)}
                      className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'GHANA' ? (
                      <>
                        <div className="space-y-3">
                          <label htmlFor="region" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                            Region <span className="text-destructive">*</span>
                          </label>
                          <select 
                            id="region"
                            required
                            value={formData.region} 
                            onChange={(e) => handleChange('region', e.target.value)}
                            className="w-full p-4 text-on-surface text-sm appearance-none bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.65rem auto' }}
                          >
                            <option value="">Select Region</option>
                            {ghanaRegions.map((region) => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label htmlFor="constituency" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                            Constituency <span className="text-destructive">*</span>
                          </label>
                          <select 
                            id="constituency"
                            required
                            disabled={!formData.region}
                            value={formData.constituency} 
                            onChange={(e) => handleChange('constituency', e.target.value)}
                            className="w-full p-4 text-on-surface text-sm appearance-none disabled:opacity-50 bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
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
                        <label htmlFor="chapter" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                          Assigned chapter <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="chapter"
                          placeholder="E.g. UK Chapter - London"
                          required
                          value={formData.chapter}
                          onChange={(e) => handleChange('chapter', e.target.value)}
                          className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-on-surface pb-4 mb-8">
                    <h3 className="text-on-surface font-bold text-xl tracking-tight">Step 3: Emergency & profession details</h3>
                    <p className="text-muted-foreground/60 mt-1 mb-0 text-sm">Crucial for member safety and institutional records.</p>
                  </div>
 
                  <div className="space-y-3">
                    <label htmlFor="emergencyContactName" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                      Emergency contact name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="emergencyContactName"
                      placeholder="Full Name"
                      required
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="emergencyRelationship" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                        Relationship <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="emergencyRelationship"
                        placeholder="E.g. Spouse, Parent, Brother"
                        required
                        value={formData.emergencyRelationship}
                        onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
                        className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="emergencyNumber" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                        Emergency contact number <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="emergencyNumber"
                        type="tel"
                        placeholder="Phone number"
                        required
                        value={formData.emergencyNumber}
                        onChange={(e) => handleChange('emergencyNumber', e.target.value)}
                        className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="profession" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                        Profession / occupation <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="profession"
                        placeholder="E.g. Teacher, Nurse, Student"
                        required
                        value={formData.profession}
                        onChange={(e) => handleChange('profession', e.target.value)}
                        className="w-full p-4 text-on-surface text-sm bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="educationLevel" className="text-micro font-bold text-on-surface/60 tracking-tight block">
                        Education level <span className="text-destructive">*</span>
                      </label>
                      <select 
                        id="educationLevel"
                        required
                        value={formData.educationLevel} 
                        onChange={(e) => handleChange('educationLevel', e.target.value)}
                        className="w-full p-4 text-on-surface text-sm appearance-none bg-muted/5 border border-border/60 focus:border-primary rounded-sm focus:outline-none transition-colors"
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

              {formStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-on-surface pb-4 mb-8">
                    <h3 className="text-on-surface font-bold text-xl tracking-tight">Step 4: Final verification</h3>
                    <p className="text-muted-foreground/60 mt-1 mb-0 text-sm">Identity confirmation and oath of commitment.</p>
                  </div>

                  <div className="space-y-6">
                    <label className="text-micro font-bold text-on-surface/60 tracking-tight block">
                      Passport photo <span className="text-destructive">*</span>
                    </label>
                    
                    {!photoUrl ? (
                      <div className="border-2 border-dashed border-border/40 p-16 text-center bg-muted/5 relative group transition-all hover:border-primary rounded-sm overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-20 h-20 bg-primary/10 rounded-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                          <Upload className="w-10 h-10 text-primary transition-colors" />
                        </div>
                        <p className="font-bold text-on-surface/60 tracking-tight text-micro">Click to upload passport photo</p>
                      </div>
                    ) : (
                      <div className="relative bg-muted/5 p-6 border border-border/40 rounded-sm overflow-hidden">
                        <div className="relative h-[400px] w-full bg-on-surface rounded-sm overflow-hidden shadow-2xl">
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
                        <div className="flex items-center gap-6 mt-8 px-4 pb-2">
                          <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-primary h-2 rounded-lg bg-muted/20"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            className="shrink-0 w-12 h-12 rounded-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all flex items-center justify-center shadow-lg shadow-destructive/10"
                            title="Remove photo"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-micro text-muted-foreground/40 tracking-tight mt-4 text-center font-bold">Position your face within the frame</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-on-surface text-white p-10 mt-10 border-l-8 border-primary rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <h5 className="text-accent mb-4 font-bold tracking-tight text-xs">The Base declaration</h5>
                    <p className="text-white/80 mb-8 leading-relaxed text-sm font-medium">
                      I hereby declare that the information provided is accurate to the best of my knowledge. I commit to uphold the core values of <strong className="text-white">THE BASE</strong>: Patriotism, Honesty, and Discipline and pledge to advance the cause of <strong className="text-accent">GHANA FIRST</strong> in all my actions.
                    </p>
                    
                    <div className="flex items-start gap-5">
                      <input
                        type="checkbox"
                        id="privacy"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-6 h-6 shrink-0 accent-primary bg-on-surface border-white/20 rounded-lg cursor-pointer"
                      />
                      <label htmlFor="privacy" className="text-sm text-white/70 cursor-pointer leading-tight font-bold">
                        I accept this declaration on behalf of the member and agree to the <span className="text-accent font-bold underline underline-offset-4 decoration-accent/20">Privacy Policy</span> <span className="text-destructive">*</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-10 mt-10 border-t border-border/10 flex justify-between gap-6">
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-1/3 h-16 bg-muted/10 hover:bg-muted/20 text-on-surface font-bold tracking-tight text-micro rounded-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                ) : (
                  <div className="w-1/3"></div>
                )}
                
                 <button
                  type="submit"
                  disabled={(formStep === 4 && !agreed) || isSubmitting}
                  className={`h-16 font-bold tracking-tight text-micro rounded-sm flex items-center justify-center gap-4 transition-all flex-1 shadow-2xl active:scale-[0.98] ${((formStep === 4 && !agreed) || isSubmitting) ? 'bg-muted/20 text-muted-foreground/40 cursor-not-allowed' : 'bg-primary text-white hover:shadow-primary/40'}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : formStep < 4 ? (
                    <>Next step <ArrowRight className="w-5 h-5" /></>
                  ) : (
                    <>Submit registration <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
