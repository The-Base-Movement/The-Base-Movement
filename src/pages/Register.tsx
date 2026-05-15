import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { Area } from 'react-easy-crop'
import { getCroppedImg } from '@/lib/imageUtils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import { ChoiceStep } from './register/components/ChoiceStep'
import { RegistrationForm } from './register/components/RegistrationForm'
import { SuccessStep } from './register/components/SuccessStep'
import { adminService } from '@/services/adminService'
import { scanFormFile } from '@/lib/scanForm'
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
  const [physicalSubmitted, setPhysicalSubmitted] = useState(false)
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
  const [isScanningForm, setIsScanningForm] = useState(false)
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

  const handleFormScan = async (file: File) => {
    setIsScanningForm(true)
    try {
      const { platform: detectedPlatform, fields } = await scanFormFile(file)

      handlePlatformChange(detectedPlatform)
      setFormData(prev => ({ ...prev, ...fields }))

      setStep('form')
      setFormStep(1)

      const fieldCount = Object.keys(fields).length
      const platformLabel = detectedPlatform === 'DIASPORA' ? 'Diaspora' : 'Ghana'
      if (fieldCount === 0) {
        toast.warning('Nothing could be read from the form — please fill in your details manually.')
      } else if (fieldCount < 4) {
        toast.info(`${platformLabel} form partially read — please review and complete the remaining fields.`)
      } else {
        toast.success(`${platformLabel} form scanned — please review and complete your details.`)
      }
    } catch (error) {
      console.error('Form scan error:', error)
      toast.error('Could not read form. Please fill in your details manually.')
      setStep('form')
      setFormStep(1)
    } finally {
      setIsScanningForm(false)
    }
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
        if (photoUrl && croppedAreaPixels && authData.user) {
          try {
            const croppedBlob = await getCroppedImg(photoUrl, croppedAreaPixels)
            if (croppedBlob) {
              // Standardize pathing: {userId}/{timestamp}.jpg
              const fileName = adminService.generateAvatarPath(regNo)
              const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
              
              if (!uploadError) {
                finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
                // Update auth metadata with the new avatar URL
                await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl } })
              } else {
                console.error("Avatar upload error details:", {
                  error: uploadError,
                  fileName,
                  user: authData.user.id
                })
                toast.error("Profile picture upload failed. You can update it in settings later.")
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
          children_count: formData.children_count, residential_address: formData.residentialAddress,
          city: formData.city
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

  if (physicalSubmitted) {
    return (
      <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-[480px] w-full auth-frame p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined" style={{ fontSize: 40 }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface mb-3 tracking-tight">Form Received, Patriot!</h2>
          <p className="text-[14px] text-on-surface-muted leading-relaxed mb-8">
            Your physical registration form has been securely uploaded to the Command Center. Our admin team will verify the details and contact you via phone/email once your account is activated.
          </p>
          <div className="space-y-4">
            <Link to="/" className="block w-full py-4 bg-primary text-white font-bold uppercase tracking-widest text-[12px] rounded-sm hover:opacity-90 transition-all">
              Return Home
            </Link>
            <button onClick={() => setPhysicalSubmitted(false)} className="w-full text-xs font-bold bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-on-surface transition-colors py-2">
              Upload Another Form
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
        <ChoiceStep
          settings={settings}
          isScanning={isScanningForm}
          onSelect={(p, file) => {
            if (p === 'PHYSICAL' && file) {
              handleFormScan(file)
            } else {
              handlePlatformChange(p)
              setStep('form')
              setFormStep(1)
            }
          }}
        />
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
            <h1 className="text-lg font-extrabold tracking-tight text-on-surface">The Base</h1>
          </Link>
          <button onClick={() => setStep('choice')} className="text-xs font-bold gap-2 flex items-center bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span> Back
          </button>
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
