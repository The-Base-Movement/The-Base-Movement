import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
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

const ageRanges = ['16-25', '26-40', '41-60', '60+']

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
  const [dbRegions, setDbRegions] = useState<Region[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<Constituency[]>([])

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

  const [formData, setFormData] = useState<RegistrationFormData>({
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

  const handleChange = (field: string, value: any) => {
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

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: formData.password!,
          options: {
            data: {
              full_name: formData.fullName,
              avatar_url: finalAvatarUrl
            }
          }
        })

        if (authError) throw authError

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
        <SuccessStep 
          formData={formData} 
          photoUrl={photoUrl} 
          regNumber={regNumber} 
          onEdit={() => setSubmitted(false)} 
        />
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-background font-body-md min-h-screen flex flex-col justify-center py-12 px-4">
        <ChoiceStep 
          settings={settings} 
          onSelect={(p) => { 
            handlePlatformChange(p); 
            setStep('form'); 
            setFormStep(1); 
          }} 
        />
      </main>
    )
  }

  return (
    <main className="bg-background font-body-md min-h-screen">
      <header className="bg-white border-b border-border/60 pt-16 pb-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <img src={settings.logo_url} alt="The Base" className="h-20 w-auto mx-auto mb-6 object-contain" decoding="async" />
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
      </header>

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
              dbCountries={dbCountries}
              dbCountryCodes={dbCountryCodes}
              dbRegions={dbRegions}
              dbConstituencies={dbConstituencies}
              ageRanges={ageRanges}
              onPlatformChange={handlePlatformChange}
              onIdScan={handleIdScan}
              onInputChange={handleChange}
              onPasswordToggle={() => setShowPassword(!showPassword)}
              onAgreedChange={setAgreed}
              onPhotoUpload={handlePhotoUpload}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onBack={goBack}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
