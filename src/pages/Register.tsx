import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, FileText, Upload, User, Eye, EyeOff, CheckCircle2, Loader2, Zap, Download } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import MembershipCard from '../components/MembershipCard'
import { getCroppedImg } from '@/lib/imageUtils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

const ageRanges = ['16-25', '26-40', '41-60', '60+']
// Hardcoded fallbacks removed - now fetching from Supabase

export default function Register() {
  const { settings } = useBranding()
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
  const [isScanningId, setIsScanningId] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanningId(true);
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ocr-verify', {
        body: { imageBase64: base64 }
      });

      if (error) throw error;
      
      if (data && data.success && data.data) {
        toast.success(`Identity Verified: Welcome, ${data.data.fullName || 'Patriot'}`);
        
        setFormData(prev => ({
          ...prev,
          fullName: data.data.fullName || prev.fullName,
          idNumber: data.data.idNumber || prev.idNumber,
        }));
        
        if (data.data.dateOfBirth) {
          const birthYear = new Date(data.data.dateOfBirth).getFullYear();
          const currentYear = new Date().getFullYear();
          const age = currentYear - birthYear;
          
          let computedAgeRange = '';
          if (age >= 16 && age <= 25) computedAgeRange = '16-25';
          else if (age >= 26 && age <= 40) computedAgeRange = '26-40';
          else if (age >= 41 && age <= 60) computedAgeRange = '41-60';
          else if (age > 60) computedAgeRange = '60+';
          
          if (computedAgeRange) {
             setFormData(prev => ({ ...prev, ageRange: computedAgeRange }));
          }
        }
      } else {
        throw new Error(data?.error || 'Could not read ID card');
      }
      
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Verification failed. Please enter details manually.');
    } finally {
      setIsScanningId(false);
    }
  };
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
    idNumber: '',
    fullName: '',
    countryCode: '+233',
    country: 'Ghana',
    children_count: 0,
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
            national_id: formData.idNumber,
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
            avatar_url: finalAvatarUrl,
            children_count: formData.children_count
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
      <main className="bg-background font-body-md min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tighter font-meta mb-2">Registration complete</h1>
            <p className="text-muted-foreground/90 font-meta tracking-tight text-xs">Welcome to the movement, patriot.</p>
          </div>

          <div className="space-y-8">
            <div className="bg-white border border-border/60 p-2 shadow-2xl relative">
              <div className="border-b border-border/40 pb-3 mb-4 px-4 pt-2">
                <h3 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight">Official membership card</h3>
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

              <div className="bg-muted/30 p-6 mt-4 border-t border-border/40">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-meta font-bold text-xs text-on-surface tracking-tight mb-1">Registration number</h4>
                    <p className="font-meta font-bold text-xl text-primary tracking-tight">{regNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="gold"
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-6 py-3 h-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">print</span>
                      Print card
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => setSubmitted(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 h-auto text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" /> Edit info
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-border/60 p-8 shadow-sm">
                <h4 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight mb-4">Membership verification</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <p className="text-xs font-bold text-on-surface font-meta tracking-tight">Status: Verified</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-body-md leading-relaxed">
                  Your official records have been synchronized with the movement's hub. You can now access the platform overview.
                </p>
                </div>

                <div className="bg-primary text-primary-foreground p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <h4 className="font-meta font-bold text-micro text-primary-foreground/90 tracking-tight mb-4 uppercase">Next step</h4>
                  <p className="text-sm font-bold font-meta leading-tight mb-4">Access your portal to join a chapter and start mobilizing.</p>
                </div>
                <Button
                  variant="default"
                  onClick={() => navigate('/dashboard')}
                  className="w-full inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-primary-foreground h-auto p-3 text-center justify-center font-bold transition-all active:scale-95 shadow-sm"
                >
                  Enter Overview <ArrowRight className="w-4 h-4" />
                </Button>
                </div>            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-background font-body-md min-h-screen flex flex-col justify-center py-12 px-4">
        <SEO 
          title="Join the Movement"
          description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
          canonical="/register"
        />
        <div className="max-w-5xl w-full mx-auto">
          <div className="text-center mb-12">
            <img src={settings.logo_url} alt="The Base" className="h-24 w-auto mx-auto mb-6 object-contain"  decoding="async" />
            <h1 className="text-4xl font-bold text-on-surface tracking-tighter font-meta mb-2">The Base</h1>
            <div className="w-20 h-1.5 bg-destructive mx-auto mb-6"></div>
            <h2 className="text-sm font-bold text-muted-foreground tracking-tight font-meta">Membership registration options</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Local Membership Card */}
            <div 
              onClick={() => {
                handlePlatformChange('GHANA')
                setStep('form')
                setFormStep(1)
              }}
              className="group relative bg-white border border-border/60 hover:border-brand-green/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10 flex flex-col justify-between"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-green group-hover:w-full transition-all duration-700" />
              
              <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                  <div className="w-20 h-20 bg-brand-green/5 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                    <FileText className="w-10 h-10 text-brand-green" />
                  </div>
                  <div className="text-micro font-bold text-brand-green bg-brand-green/10 px-3 py-1 tracking-tight">In-country</div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-green transition-colors">
                    Local membership <br/> (Ghana)
                  </h3>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                      Designed for citizens and residents currently living within the 16 regions of Ghana. This is the core of our grassroots mobilization.
                    </p>
                    <ul className="space-y-3">
                      {[
                        'Automatic assignment to your regional and constituency chapter',
                        'Full voting rights on tactical and leadership directives',
                        'Eligibility for local leadership and volunteer roles',
                        'Access to physical field stations and community hubs'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      <Link 
                        to="/register/preview?platform=GHANA" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-micro font-bold tracking-tight text-brand-green/60 hover:text-brand-green hover:underline transition-all"
                      >
                        <Download className="w-3 h-3" />
                        Download paper form (Ghana)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-green">
                  Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="text-on-surface/5 group-hover:text-brand-green/20 transition-colors">
                  <ArrowRight className="w-16 h-16 rotate-[-45deg]" />
                </div>
              </div>
            </div>

            {/* Diaspora Membership Card */}
            <div 
              onClick={() => {
                handlePlatformChange('DIASPORA')
                setStep('form')
                setFormStep(1)
              }}
              className="group relative bg-white border border-border/60 hover:border-brand-gold/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 flex flex-col justify-between"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-gold group-hover:w-full transition-all duration-700" />
              
              <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                  <div className="w-20 h-20 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <User className="w-10 h-10 text-brand-gold" />
                  </div>
                  <div className="text-micro font-bold text-brand-gold bg-brand-gold/10 px-3 py-1 tracking-tight">Global community</div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-gold transition-colors">
                    Diaspora <br/> membership
                  </h3>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                      Tailored for Ghanaians and supporters living abroad. Leverage your global expertise and resources to transform the motherland.
                    </p>
                    <ul className="space-y-3">
                      {[
                        'Participation in global advisory and expert committees',
                        'Special access to digital town halls and diaspora forums',
                        'Support the movement\'s logistics and intelligence operations',
                        'Dedicated Diaspora Member ID and recognition'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      <Link 
                        to="/register/preview?platform=DIASPORA" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-micro font-bold tracking-tight text-brand-gold/60 hover:text-brand-gold hover:underline transition-all"
                      >
                        <Download className="w-3 h-3" />
                        Download paper form (Diaspora)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-gold">
                  Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="text-on-surface/5 group-hover:text-brand-gold/20 transition-colors">
                  <ArrowRight className="w-16 h-16 rotate-[-45deg]" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16 pt-8 border-t border-border/60">
            <p className="text-sm text-muted-foreground font-body-md">
              Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign in securely</Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background font-body-md min-h-screen">
      <div className="bg-white border-b border-border/60 pt-16 pb-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <img src={settings.logo_url} alt="The Base" className="h-20 w-auto mx-auto mb-6 object-contain"  decoding="async" />
          <h1 className="text-on-surface mb-2">The Base</h1>
          <div className="w-24 h-1.5 mx-auto mb-4 flex">
            <div className="flex-1 bg-destructive"></div>
            <div className="flex-1 bg-accent"></div>
            <div className="flex-1 bg-primary"></div>
          </div>
          <h2 className="text-muted-foreground mb-8">Official Registration Form</h2>
          <Button
            variant="default"
            onClick={() => setStep('choice')}
            className="inline-flex items-center gap-2 px-6 py-2 h-auto text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to registration options
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-3 space-y-2 sticky top-8">
            <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mb-6 pl-4">Registration progress</p>
            <div className="space-y-1">
              {[
                { step: 1, label: 'Primary details' },
                { step: 2, label: 'Demographic info' },
                { step: 3, label: 'Emergency contact' },
                { step: 4, label: 'Final verification' }
              ].map((item) => (
                <div key={item.step} className={`flex items-center gap-4 p-4 transition-all border-l-4 ${formStep === item.step ? 'bg-white border-primary shadow-sm' : 'border-transparent text-muted-foreground/80 opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta shrink-0 ${formStep >= item.step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {formStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                  </div>
                  <span className={`text-xs font-bold tracking-tight font-meta ${formStep === item.step ? 'text-on-surface' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 pl-4 pt-8 border-t border-border/60">
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mb-1">Need assistance?</p>
              <a href="mailto:info@thebasemovement.com" className="text-xs font-meta font-medium text-muted-foreground hover:text-primary transition-colors">
                info@thebasemovement.com
              </a>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white border border-border/60 p-8 md:p-12 shadow-sm">
              <form onSubmit={handleSubmit}>
              {formStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-primary/20 pb-3 mb-8">
                    <h3 className="text-on-surface">Step 1: Primary details</h3>
                  </div>

                  {/* AI Verification Scanner - Local Membership Only */}
                  {platform === 'GHANA' && (
                    <div className="relative overflow-hidden mb-10 bg-on-surface rounded-sm p-8 border border-white/5 shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 -mr-32 -mt-32 blur-3xl"></div>
                      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-accent" />
                            <h4 className="text-white font-meta font-bold tracking-tight text-lg">AI identity verification</h4>
                          </div>
                          <p className="text-white/80 text-sm max-w-sm mb-0">
                            Scan your Ghana Card or Voter ID to instantly auto-fill your profile and verify your membership.
                          </p>
                        </div>
                        <div className="relative shrink-0">
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={handleIdScan} 
                            disabled={isScanningId}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          />
                          <Button 
                            type="button"
                            variant="solid"
                            disabled={isScanningId}
                            className="relative z-10 w-full sm:w-auto shadow-lg shadow-primary/20"
                          >
                            {isScanningId ? (
                              <span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</span>
                            ) : (
                              <span className="flex items-center"><Eye className="w-4 h-4 mr-2" /> Scan National ID</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">
                      Full name <span className="text-muted-foreground/80 ml-1">(First & last name)</span>
                    </label>
                    <input 
                      required 
                      pattern=".*\s+.*" 
                      title="Please enter both your first and last name separated by a space."
                      value={formData.fullName} 
                      onChange={(e) => handleChange('fullName', e.target.value)} 
                      className="w-full form-understate p-4 text-on-surface text-sm" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Membership platform</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={platform === 'GHANA' ? 'primary' : 'default'}
                        onClick={() => handlePlatformChange('GHANA')}
                        className={cn(
                          "h-auto p-4 text-sm transition-all active:scale-95 shadow-sm",
                          platform === 'GHANA' ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                        )}
                      >
                        Ghana Base
                      </Button>
                      <Button
                        type="button"
                        variant={platform === 'DIASPORA' ? 'gold' : 'default'}
                        onClick={() => handlePlatformChange('DIASPORA')}
                        className={cn(
                          "h-auto p-4 text-sm transition-all active:scale-95 shadow-sm",
                          platform === 'DIASPORA' ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                        )}
                      >
                        Diaspora Base
                      </Button>
                    </div>
                  </div>
                  
                  {platform === 'GHANA' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">National ID number (Optional)</label>
                      <input value={formData.idNumber} onChange={(e) => handleChange('idNumber', e.target.value)} placeholder="GHA-000000000-0" className="w-full form-understate p-4 text-on-surface text-sm" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-8">
                    {platform === 'DIASPORA' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Country</label>
                        <select 
                          required 
                          value={formData.country} 
                          onChange={(e) => {
                            const selectedCountry = e.target.value;
                            setFormData(prev => ({ 
                              ...prev, 
                              country: selectedCountry,
                              countryCode: dbCountryCodes[selectedCountry] || prev.countryCode
                            }));
                          }} 
                          className="w-full form-understate p-4 text-on-surface text-sm"
                        >
                          <option value="">Select Country</option>
                          {dbCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Phone</label>
                      <div className="flex">
                        <select value={formData.countryCode} onChange={(e) => handleChange('countryCode', e.target.value)} className="px-2 bg-muted border border-border/60 text-xs">
                          {Array.from(new Set(Object.values(dbCountryCodes))).map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                        <input required value={formData.contactNumber} onChange={(e) => handleChange('contactNumber', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        minLength={8} 
                        value={formData.password} 
                        onChange={(e) => handleChange('password', e.target.value)} 
                        className="w-full form-understate p-4 pr-12 text-on-surface text-sm" 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-primary"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </Button>
                    </div>
                    <p className="text-micro text-muted-foreground/80 font-meta leading-relaxed">
                      Avoid weak passwords like <span className="text-on-surface font-bold">"password123"</span> or <span className="text-on-surface font-bold">"ghana2024"</span>. Use a mix of letters, numbers, and symbols.
                    </p>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-primary/20 pb-3 mb-8">
                    <h3 className="text-on-surface">Step 2: Demographic details</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Age range</label>
                      <select required value={formData.ageRange} onChange={(e) => handleChange('ageRange', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm">
                        <option value="">Select Range</option>
                        {ageRanges.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Gender</label>
                      <select required value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Number of children</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.children_count} 
                        onChange={(e) => handleChange('children_count', e.target.value)} 
                        className="w-full form-understate p-4 text-on-surface text-sm" 
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {platform === 'GHANA' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Region</label>
                        <select required value={formData.region} onChange={(e) => handleChange('region', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm">
                          <option value="">Select Region</option>
                          {dbRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Constituency</label>
                        <select required value={formData.constituency} onChange={(e) => handleChange('constituency', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm">
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
                  <div className="border-b-2 border-primary/20 pb-3 mb-8">
                    <h3 className="text-on-surface">Step 3: Emergency & profile</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Profession</label>
                    <input required value={formData.profession} onChange={(e) => handleChange('profession', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Emergency name</label>
                      <input required value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Emergency phone</label>
                      <input required value={formData.emergencyNumber} onChange={(e) => handleChange('emergencyNumber', e.target.value)} className="w-full form-understate p-4 text-on-surface text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b-2 border-primary/20 pb-3 mb-8">
                    <h3 className="text-on-surface">Step 4: Final verification</h3>
                  </div>
                  <div className="space-y-6">
                    <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Photo</label>
                    {!photoUrl ? (
                      <div className="border-2 border-dashed p-12 text-center bg-muted/30 relative">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="mx-auto mb-4 text-muted-foreground/40" />
                        <p className="text-micro font-bold text-muted-foreground">Upload photo</p>
                      </div>
                    ) : (
                      <div className="relative h-[400px] bg-on-surface">
                        <Cropper image={photoUrl} crop={crop} zoom={zoom} aspect={3/4} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-on-surface text-white border-l-4 border-primary">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                    <label className="text-sm">I accept the declaration and agree to the Privacy Policy.</label>
                  </div>
                </div>
              )}

              <div className="pt-10 mt-12 border-t border-border/60 flex justify-between gap-4">
                {formStep > 1 && (
                  <Button type="button" variant="default" onClick={goBack} className="w-1/3 py-6">Back</Button>
                )}
                <Button 
                  type="submit" 
                  variant="solid"
                  disabled={(formStep === 4 && !agreed) || isLoading} 
                  className="flex-1 py-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                    </>
                  ) : (
                    <>
                      {formStep < 4 ? 'Next step' : 'Submit registration'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
