import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, FileText, Upload, User, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import MembershipCard from '../components/MembershipCard'
import { getCroppedImg } from '@/lib/imageUtils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const ageRanges = ['16-25', '26-40', '41-60', '60+']
// Hardcoded fallbacks removed - now fetching from Supabase

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
  const [isLoading, setIsLoading] = useState(false)
  const [dbCountries, setDbCountries] = useState<string[]>([])
  const [dbCountryCodes, setDbCountryCodes] = useState<Record<string, string>>({ 'Ghana': '+233' })
  const [dbRegions, setDbRegions] = useState<{ id: number, name: string }[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<{ region_id: number, name: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')
          .order('name', { ascending: true })

        if (countriesError) throw countriesError

        if (Array.isArray(countriesData)) {
          const names = countriesData.map(c => c.name);
          const codes: Record<string, string> = {};
          countriesData.forEach(c => {
            codes[c.name] = c.dialing_code;
          });
          // Deduplicate and filter Ghana
          const uniqueNames = Array.from(new Set(names.filter(n => n !== 'Ghana')));
          setDbCountries(uniqueNames);
          setDbCountryCodes(codes);
        }

        // 2. Fetch Regions
        const { data: regionsData, error: regionsError } = await supabase
          .from('ghana_regions')
          .select('*')
          .order('name', { ascending: true })

        if (regionsError) throw regionsError
        const uniqueRegions = Array.from(new Map((regionsData || []).map(r => [r.name, r])).values())
        setDbRegions(uniqueRegions)

        // 3. Fetch Constituencies
        const { data: conData, error: conError } = await supabase
          .from('ghana_constituencies')
          .select('*')
          .order('name', { ascending: true })

        if (conError) throw conError
        const uniqueConstituencies = Array.from(
          new Map((conData || []).map(c => [`${c.region_id}-${c.name}`, c])).values()
        )
        setDbConstituencies(uniqueConstituencies)

      } catch (error) {
        console.error('[DATABASE] Failed to fetch master data for registration:', error);
      }
    }
    fetchData();
  }, []);

  const navigate = useNavigate()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    if (newPlatform === 'GHANA') {
      setFormData(prev => ({ ...prev, country: 'Ghana', countryCode: '+233' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 4) {
      setFormStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const randomNum = String(Math.floor(1000 + Math.random() * 9000))
      const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`
      setRegNumber(regNo)

      const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(',')
        const mime = arr[0].match(/:(.*?);/)![1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        return new Blob([u8arr], { type: mime })
      }

      setIsLoading(true)
      try {
        const authEmail = formData.email || `${regNo.toLowerCase()}@thebase.org`
        
        // 1. Upload Avatar to Supabase Storage
        let finalAvatarUrl = photoUrl
        if (photoUrl && croppedAreaPixels) {
          try {
            const croppedBlob = await getCroppedImg(photoUrl, croppedAreaPixels)
            if (!croppedBlob) throw new Error('Cropping failed')
            
            const fileName = `${regNo}.jpg`
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, croppedBlob, { 
                upsert: true,
                contentType: 'image/jpeg'
              })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName)
            
            finalAvatarUrl = urlData.publicUrl
          } catch (uploadErr) {
            console.error('[STORAGE] Avatar upload failed, falling back to local URL:', uploadErr)
          }
        }

        // 2. Supabase Auth Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              avatar_url: finalAvatarUrl
            }
          }
        })

        if (authError) throw authError

        // 3. Insert Profile Data into users table
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user?.id,
            full_name: formData.fullName,
            email: authEmail,
            registration_number: regNo,
            platform: platform,
            country: formData.country,
            phone_number: formData.countryCode + formData.contactNumber,
            gender: formData.gender,
            region: formData.region,
            constituency: formData.constituency,
            chapter: formData.chapter,
            profession: formData.profession,
            status: 'Pending',
            verification_status: 'In Review',
            age_range: formData.ageRange,
            education_level: formData.educationLevel,
            emergency_name: formData.emergencyContactName,
            emergency_relationship: formData.emergencyRelationship,
            emergency_phone: formData.emergencyNumber,
            avatar_url: finalAvatarUrl
          })

        if (dbError) throw dbError

        toast.success('Official records synchronized.')
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error: unknown) {
        console.error('[DATABASE] Registration failed:', error)
        toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-green)]/10 text-[var(--brand-green)] mb-6 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">Registration Complete</h1>
            <p className="text-slate-500 font-meta uppercase tracking-widest text-xs">Welcome to the movement, patriot.</p>
          </div>

          <div className="space-y-8">
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
                  country={formData.country}
                  chapter={formData.chapter}
                />
              </div>

              <div className="bg-slate-50 p-6 mt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-meta font-bold text-xs text-charcoal-dark uppercase tracking-wider mb-1">Registration Number</h4>
                    <p className="font-meta font-black text-xl text-[var(--brand-green)] tracking-tight">{regNumber}</p>
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
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse"></div>
                  <p className="text-xs font-bold text-charcoal-dark font-meta uppercase tracking-tight">Status: Active & Verified</p>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
                  Your official records have been synchronized with the movement's hub. You can now access the member dashboard.
                </p>
              </div>

              <div className="bg-[var(--brand-green)] text-white p-8 flex flex-col justify-between">
                <div>
                  <h4 className="font-meta font-bold text-[10px] text-white/60 uppercase tracking-widest mb-4">Next Step</h4>
                  <p className="text-sm font-bold font-meta uppercase leading-tight mb-4">Access your leadership dashboard to join a chapter.</p>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 p-3 text-center justify-center transition-colors cursor-pointer"
                >
                  Enter Dashboard <ArrowRight className="w-4 h-4" />
                </button>
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
              className="w-full group bg-white border border-slate-200 p-6 flex items-center gap-6 hover:border-[var(--brand-green)] transition-colors text-left shadow-sm"
            >
              <div className="w-16 h-16 bg-surface-warm flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-green)]/10 transition-colors">
                <FileText className="w-8 h-8 text-[var(--brand-green)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-lg mb-1">Local Membership (Ghana)</h3>
                <p className="text-sm text-slate-500">For residents living and voting within the 16 regions of Ghana.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-[var(--brand-green)] transition-colors" />
            </button>

            <button
              onClick={() => {
                handlePlatformChange('DIASPORA')
                setStep('form')
                setFormStep(1)
              }}
              className="w-full group bg-white border border-slate-200 p-6 flex items-center gap-6 hover:border-[var(--brand-gold)] transition-colors text-left shadow-sm"
            >
              <div className="w-16 h-16 bg-surface-warm flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-gold)]/10 transition-colors">
                <User className="w-8 h-8 text-[var(--brand-gold)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-lg mb-1">Diaspora Membership</h3>
                <p className="text-sm text-slate-500">For Ghanaians living abroad who wish to support the movement.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-[var(--brand-gold)] transition-colors" />
            </button>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 font-body-md">
              Already a member? <Link to="/login" className="text-[var(--brand-green)] font-bold hover:underline">Sign in securely</Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-surface-warm font-body-md min-h-screen">
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <img src="/logo.png" alt="The Base" className="h-20 w-auto mx-auto mb-6" />
          <h1 className="text-charcoal-dark mb-2">The Base</h1>
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
          <div className="lg:col-span-3 space-y-2 sticky top-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-4">Registration Progress</p>
            <div className="space-y-1">
              {[
                { step: 1, label: 'Primary Details' },
                { step: 2, label: 'Demographic info' },
                { step: 3, label: 'Emergency contact' },
                { step: 4, label: 'Final Verification' }
              ].map((item) => (
                <div key={item.step} className={`flex items-center gap-4 p-4 transition-all border-l-4 ${formStep === item.step ? 'bg-white border-[var(--brand-green)] shadow-sm' : 'border-transparent text-slate-400 opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta shrink-0 ${formStep >= item.step ? 'bg-[var(--brand-green)] text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {formStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                  </div>
                  <span className={`text-xs font-bold tracking-tight font-meta ${formStep === item.step ? 'text-charcoal-dark' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
              <form onSubmit={handleSubmit}>
              {formStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 1: Primary Details</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Full Name</label>
                    <input required value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'DIASPORA' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Country</label>
                        <select required value={formData.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm">
                          <option value="">Select Country</option>
                          {dbCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Phone</label>
                      <div className="flex">
                        <select value={formData.countryCode} onChange={(e) => handleChange('countryCode', e.target.value)} className="px-2 bg-surface-warm border border-slate-300 text-xs">
                          {Array.from(new Set(Object.values(dbCountryCodes))).map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                        <input required value={formData.contactNumber} onChange={(e) => handleChange('contactNumber', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        minLength={6} 
                        value={formData.password} 
                        onChange={(e) => handleChange('password', e.target.value)} 
                        className="w-full form-understate p-4 pr-12 text-charcoal-dark text-sm" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--brand-green)]"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 2: Demographic Details</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Age Range</label>
                      <select required value={formData.ageRange} onChange={(e) => handleChange('ageRange', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm">
                        <option value="">Select Range</option>
                        {ageRanges.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Gender</label>
                      <select required value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  {platform === 'GHANA' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Region</label>
                        <select required value={formData.region} onChange={(e) => handleChange('region', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm">
                          <option value="">Select Region</option>
                          {dbRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Constituency</label>
                        <select required value={formData.constituency} onChange={(e) => handleChange('constituency', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm">
                          <option value="">Select Constituency</option>
                          {formData.region && dbConstituencies
                            .filter(c => c.region_id === dbRegions.find(r => r.name === formData.region)?.id)
                            .map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                          }
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 3: Emergency & Profile</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Profession</label>
                    <input required value={formData.profession} onChange={(e) => handleChange('profession', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Emergency Name</label>
                      <input required value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Emergency Phone</label>
                      <input required value={formData.emergencyNumber} onChange={(e) => handleChange('emergencyNumber', e.target.value)} className="w-full form-understate p-4 text-charcoal-dark text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-charcoal-dark pb-2 mb-6">
                    <h3 className="text-charcoal-dark">Step 4: Final Verification</h3>
                  </div>
                  <div className="space-y-6">
                    <label className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase block">Photo</label>
                    {!photoUrl ? (
                      <div className="border-2 border-dashed p-12 text-center bg-slate-50 relative">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="mx-auto mb-4 text-slate-300" />
                        <p className="text-[10px] font-bold uppercase text-slate-500">Upload Photo</p>
                      </div>
                    ) : (
                      <div className="relative h-[400px] bg-charcoal-dark">
                        <Cropper image={photoUrl} crop={crop} zoom={zoom} aspect={3/4} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-charcoal-dark text-white border-l-4 border-[var(--brand-green)]">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                    <label className="text-sm">I accept the declaration and agree to the Privacy Policy.</label>
                  </div>
                </div>
              )}

              <div className="pt-10 mt-12 border-t border-slate-200 flex justify-between gap-4">
                {formStep > 1 && (
                  <button type="button" onClick={goBack} className="w-1/3 bg-slate-100 py-4 font-meta font-bold uppercase tracking-widest text-[10px]">Back</button>
                )}
                <button type="submit" disabled={(formStep === 4 && !agreed) || isLoading} className="flex-1 bg-[var(--brand-green)] text-white py-4 font-meta font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    formStep < 4 ? 'Next Step' : 'Submit Registration'
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
