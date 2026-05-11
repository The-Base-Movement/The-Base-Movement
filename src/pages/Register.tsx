import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import type { Area } from 'react-easy-crop'
import { getCroppedImg } from '@/lib/imageUtils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import { ChoiceStep } from './register/components/ChoiceStep'
import { RegistrationForm } from './register/components/RegistrationForm'
import { SuccessStep } from './register/components/SuccessStep'
import type { RegistrationFormData, Region, Constituency } from '@/types/registration'
import SEO from '@/components/SEO'

export default function Register() {
  const { settings } = useBranding()
  const [searchParams] = useSearchParams()
  const platformParam = searchParams.get('platform')
  const [step, setStep] = useState<'choice' | 'form'>(platformParam ? 'form' : 'choice')
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState(platformParam || 'GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [regNumber, setRegNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dbCountries, setDbCountries] = useState<string[]>([])
  const [dbCountryCodes, setDbCountryCodes] = useState<Record<string, string>>({})
  const [dbRegions, setDbRegions] = useState<Region[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<Constituency[]>([])
  const [dbChapters, setDbChapters] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: countriesData } = await supabase.from('countries').select('*').order('name', { ascending: true })
        if (Array.isArray(countriesData)) {
          setDbCountries(countriesData.map(c => c.name).filter(n => n !== 'Ghana'))
          
          const codeMap: Record<string, string> = {}
          countriesData.forEach(c => {
            if (c.dialing_code) codeMap[c.name] = c.dialing_code
          })
          setDbCountryCodes(codeMap)
        }

        const { data: regionsData } = await supabase.from('ghana_regions').select('*').order('name', { ascending: true })
        setDbRegions(Array.from(new Map((regionsData || []).map(r => [r.name, r])).values()))

        const { data: conData } = await supabase.from('ghana_constituencies').select('*').order('name', { ascending: true })
        setDbConstituencies(Array.from(new Map((conData || []).map(c => [`${c.region_id}-${c.name}`, c])).values()))

        const { data: chaptersData } = await supabase.from('chapters').select('name').order('name', { ascending: true })
        setDbChapters((chaptersData || []).map(c => c.name))
      } catch (error) {
        console.error('Failed to fetch registration data:', error)
      }
    }
    fetchData()
  }, [])

  const [isScanningId, setIsScanningId] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])


  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanningId(true);
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          setPhotoUrl(result);
          resolve(result);
        };
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ocr-verify', { body: { imageBase64: base64 } });
      if (error) throw error;
      if (data?.success && data?.data) {
        toast.success(`Identity Verified successfully.`);
        setFormData(prev => ({
          ...prev,
          idNumber: data.data.idNumber || prev.idNumber,
        }));
      } else {
        throw new Error(data?.error || 'Could not read ID card');
      }
    } catch {
      toast.error('Verification failed. Please enter details manually.');
    } finally {
      setIsScanningId(false);
    }
  };



  const [formData, setFormData] = useState<RegistrationFormData>({
    idNumber: '', fullName: '', countryCode: '+233', country: 'Ghana', children_count: 0,
    contactNumber: '', ageRange: '', gender: 'Male', password: '', email: '',
    residentialAddress: '', region: '', constituency: '', chapter: '', profession: '',
    educationLevel: '', emergencyContactName: '', emergencyRelationship: '', emergencyNumber: '',
  })

  const handleChange = <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => {
    setFormData(prev => {
      const updates = { ...prev, [field]: value }
      if (field === 'country' && typeof value === 'string' && dbCountryCodes[value]) {
        updates.countryCode = dbCountryCodes[value]
      }
      return updates
    })
  }

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    if (newPlatform === 'GHANA') setFormData(prev => ({ ...prev, country: 'Ghana', countryCode: '+233' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 4) {
      setFormStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsLoading(true)
      try {
        const yearStr = new Date().getFullYear().toString().slice(-2)
        const randomNum = String(Math.floor(1000 + Math.random() * 9000))
        const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`
        setRegNumber(regNo)

        const authEmail = formData.email ? formData.email.trim() : null
        
        // Clean phone number (remove spaces, leading zeros after country code)
        const cleanPhone = formData.countryCode + formData.contactNumber.replace(/^0+/, '').replace(/\s+/g, '')

        const dummyEmail = `${cleanPhone.replace('+', '')}@thebase.org`;
        const finalAuthEmail = authEmail || dummyEmail;

        // 1. Sign up with Email (using dummy email if none provided to bypass disabled phone auth)
        const signUpPromise = supabase.auth.signUp({
          email: finalAuthEmail,
          password: formData.password!,
          options: { data: { full_name: formData.fullName } }
        })

        const { data: authData, error: authError } = await signUpPromise

        if (authError) throw authError

        // 2. NOW upload the avatar using the authenticated session
        let finalAvatarUrl = null
        if (photoUrl && croppedAreaPixels) {
          try {
            const croppedBlob = await getCroppedImg(photoUrl, croppedAreaPixels)
            if (croppedBlob) {
              const fileName = `${regNo}.jpg`
              const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' })
              if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
                finalAvatarUrl = urlData.publicUrl
                // Update auth metadata with the new avatar URL
                await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl } })
              } else {
                console.error("Avatar upload error:", uploadError)
              }
            }
          } catch (err) {
            console.error('Failed to process/upload avatar:', err)
          }
        }

        // 3. Insert into the users table
        const { error: dbError } = await supabase.from('users').insert({
          id: authData.user?.id, national_id: formData.idNumber, full_name: formData.fullName,
          email: authEmail, registration_number: regNo, platform: platform,
          country: formData.country, phone_number: cleanPhone,
          gender: formData.gender, region: formData.region, constituency: formData.constituency,
          chapter: formData.chapter, profession: formData.profession, status: 'Pending',
          verification_status: 'In Review', age_range: formData.ageRange, avatar_url: finalAvatarUrl,
          education_level: formData.educationLevel, emergency_name: formData.emergencyContactName,
          emergency_relationship: formData.emergencyRelationship, emergency_phone: formData.emergencyNumber,
          children_count: formData.children_count, residential_address: formData.residentialAddress
        })

        if (dbError) throw dbError
        
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error) {
        toast.error((error as Error)?.message || 'Registration failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (submitted) {
    return (
      <main className="bg-container-low min-h-screen py-12 px-4 flex items-center justify-center">
        <SuccessStep formData={formData} photoUrl={photoUrl} regNumber={regNumber} onEdit={() => setSubmitted(false)} />
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
        <ChoiceStep settings={settings} onSelect={(p) => { handlePlatformChange(p); setStep('form'); setFormStep(1); }} />
      </main>
    )
  }

  return (
    <main className="bg-container-low min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <SEO title="Member Registration" description="Join The Base Movement. Create your account and help build a better Ghana." canonical="/register" />
      
      <div className="max-w-[480px] w-full">
        <div className="mb-8 flex justify-between items-center px-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-lg font-black tracking-tight text-on-surface">The Base</h1>
          </Link>
          <Button variant="ghost" onClick={() => setStep('choice')} className="text-xs font-bold gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>

        <RegistrationForm 
          platform={platform}
          formStep={formStep}
          formData={formData}
          isLoading={isLoading}
          isScanningId={isScanningId}
          showPassword={showPassword}
          agreed={agreed}
          photoUrl={photoUrl}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onClearPhoto={() => setPhotoUrl(null)}
          dbCountries={dbCountries}
          dbRegions={dbRegions}
          dbConstituencies={dbConstituencies}
          dbChapters={dbChapters}
          onPlatformChange={handlePlatformChange}
          onIdScan={handleIdScan}
          onInputChange={handleChange}
          onPasswordToggle={() => setShowPassword(!showPassword)}
          onAgreedChange={setAgreed}
          onBack={() => setFormStep(prev => prev - 1)}
          onSubmit={handleSubmit}
        />

        <div className="mt-8 text-center">
          <p className="text-[12px] text-on-surface-muted">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in here →</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
