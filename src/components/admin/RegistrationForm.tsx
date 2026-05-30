import { useState, useCallback, useEffect } from 'react'
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
  'Professional Certification',
]
const ghanaRegions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

const diasporaCountries = [
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'France',
  'Australia',
  'South Africa',
  'United Arab Emirates',
  'Netherlands',
  'Italy',
  'Austria',
  'Belgium',
  'Brazil',
  'Burkina Faso',
  'Cameroon',
  'China',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Finland',
  'India',
  'Ireland',
  'Israel',
  'Japan',
  'Kenya',
  'Kuwait',
  'Luxembourg',
  'Malaysia',
  'Mexico',
  'Morocco',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Poland',
  'Portugal',
  'Qatar',
  'Russia',
  'Saudi Arabia',
  'Senegal',
  'Singapore',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Tanzania',
  'Thailand',
  'Togo',
  'Turkey',
]

const countryCodes: Record<string, string> = {
  Ghana: '+233',
  'United Kingdom': '+44',
  'United States': '+1',
  Canada: '+1',
  Germany: '+49',
  France: '+33',
  Australia: '+61',
  'South Africa': '+27',
  'United Arab Emirates': '+971',
  Netherlands: '+31',
  Italy: '+39',
  Austria: '+43',
  Belgium: '+32',
  Brazil: '+55',
  'Burkina Faso': '+226',
  Cameroon: '+237',
  China: '+86',
  'Czech Republic': '+420',
  Denmark: '+45',
  Egypt: '+20',
  Finland: '+358',
  India: '+91',
  Ireland: '+353',
  Israel: '+972',
  Japan: '+81',
  Kenya: '+254',
  Kuwait: '+965',
  Luxembourg: '+352',
  Malaysia: '+60',
  Mexico: '+52',
  Morocco: '+212',
  'New Zealand': '+64',
  Nigeria: '+234',
  Norway: '+47',
  Poland: '+48',
  Portugal: '+351',
  Qatar: '+974',
  Russia: '+7',
  'Saudi Arabia': '+966',
  Senegal: '+221',
  Singapore: '+65',
  'South Korea': '+82',
  Spain: '+34',
  Sweden: '+46',
  Switzerland: '+41',
  Tanzania: '+255',
  Thailand: '+66',
  Togo: '+228',
  Turkey: '+90',
}

const regionConstituencies: Record<string, string[]> = {
  Ahafo: [
    'Asunafo North',
    'Asunafo South',
    'Asutifi North',
    'Asutifi South',
    'Tano North',
    'Tano South',
  ],
  Ashanti: [
    'Adansi-Asokwa',
    'Fomena',
    'New Edubease',
    'Afigya Kwabre North',
    'Afigya Kwabre South',
    'Ahafo Ano North',
    'Ahafo Ano South East',
    'Ahafo Ano South West',
    'Akrofuom',
    'Odotobri',
    'Manso Nkwanta',
    'Manso Edubia',
    'Asante Akim Central',
    'Asante Akim North',
    'Asante Akim South',
    'Asawase',
    'Asokwa',
    'Atwima-Kwanwoma',
    'Atwima Mponua',
    'Atwima-Nwabiagya South',
    'Atwima-Nwabiagya North',
    'Bekwai',
    'Bosome-Freho',
    'Bosomtwe',
    'Ejisu',
    'Ejura-Sekyedumase',
    'Juaben',
    'Bantama',
    'Manhyia North',
    'Manhyia South',
    'Nhyiaeso',
    'Subin',
    'Kwabre East',
    'Kwadaso',
    'Mampong',
    'Obuasi East',
    'Obuasi West',
    'Offinso South',
    'Offinso North',
    'Oforikrom',
    'Old Tafo',
    'Sekyere Afram Plains',
    'Nsuta-Kwamang-Beposo',
    'Afigya Sekyere East',
    'Kumawu',
    'Effiduase-Asokore',
    'Suame',
  ],
  Bono: [
    'Banda Ahenkro',
    'Berekum East',
    'Berekum West',
    'Dormaa Central',
    'Dormaa East',
    'Dormaa West',
    'Jaman North',
    'Jaman South',
    'Sunyani East',
    'Sunyani West',
    'Tain',
    'Wenchi',
  ],
  'Bono East': [
    'Atebubu-Amantin',
    'Kintampo North',
    'Kintampo South',
    'Nkoranza North',
    'Nkoranza South',
    'Pru East',
    'Pru West',
    'Sene East',
    'Sene West',
    'Techiman South',
    'Techiman North',
  ],
  Central: [
    'Abura-Asebu-Kwamankese',
    'Agona East',
    'Agona West',
    'Ajumako-Enyan-Essiam',
    'Asikuma-Odoben-Brakwa',
    'Assin Central',
    'Assin North',
    'Assin South',
    'Awutu-Senya East',
    'Awutu-Senya West',
    'Cape Coast North',
    'Cape Coast South',
    'Effutu',
    'Ekumfi',
    'Gomoa East',
    'Gomoa Central',
    'Gomoa West',
    'Komenda-Edina-Eguafo-Abirem',
    'Mfantseman',
    'Twifo-Atii Morkwaa',
    'Hemang Lower Denkyira',
    'Upper Denkyira East',
    'Upper Denkyira West',
  ],
  Eastern: [
    'Abuakwa North',
    'Abuakwa South',
    'Achiase',
    'Akropong',
    'Akwapim South',
    'Ofoase-Ayirebi',
    'Asene Akroso Manso',
    'Asuogyaman',
    'Atiwa East',
    'Atiwa West',
    'Ayensuano',
    'Akim Oda',
    'Abirem',
    'Akim Swedru',
    'Akwatia',
    'Fanteakwa North',
    'Fanteakwa South',
    'Kade',
    'Afram Plains North',
    'Afram Plains South',
    'Abetifi',
    'Mpraeso',
    'Nkawkaw',
    'Lower Manya',
    'New Juaben North',
    'New Juaben South',
    'Nsawam Adoagyiri',
    'Okere',
    'Suhum',
    'Upper Manya',
    'Upper West Akim',
    'Lower West Akim',
    'Yilo Krobo',
  ],
  'Greater Accra': [
    'Ablekuma Central',
    'Ablekuma North',
    'Ablekuma West',
    'Ablekuma South',
    'Odododiodio',
    'Okaikwei Central',
    'Okaikwei South',
    'Ada',
    'Sege',
    'Adenta',
    'Ashaiman',
    'Ayawaso Central',
    'Ayawaso East',
    'Ayawaso North',
    'Ayawaso West',
    'Anyaa-Sowutuom',
    'Dome-Kwabenya',
    'Trobu',
    'Bortianor-Ngleshie-Amanfrom',
    'Domeabra-Obom',
    'Amasaman',
    'Korle Klottey',
    'Kpone-Katamanso',
    'Krowor',
    'Dade Kotopon',
    'Abokobi-Madina',
    'Ledzokuku',
    'Ningo-Prampram',
    'Okaikwei North',
    'Shai-Osudoku',
    'Tema Central',
    'Tema East',
    'Tema West',
    'Weija',
  ],
  'North East': ['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'],
  Northern: [
    'Gushegu',
    'Karaga',
    'Kpandai',
    'Kumbungu',
    'Mion',
    'Nanton',
    'Bimbilla',
    'Wulensi',
    'Saboba',
    'Sagnarigu',
    'Savelugu',
    'Tamale Central',
  ],
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
  croppedAreaPixels?: Area | null
}

interface RegistrationFormProps {
  onClose: () => void
  onSuccess: () => void
  onSubmitData?: (data: RegistrationSubmission) => void
}

export default function RegistrationForm({
  onClose,
  onSuccess,
  onSubmitData,
}: RegistrationFormProps) {
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState('GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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
    setFormData((prev) => {
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
    setFormData((prev) => {
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
      setFormStep((prev) => prev + 1)
      const modalElement = document.getElementById('registration-modal-content')
      if (modalElement) modalElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsSubmitting(true)
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const randomNum = String(Math.floor(1000 + Math.random() * 9000))
      const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`

      if (onSubmitData) {
        onSubmitData({
          ...formData,
          registrationNumber: regNo,
          platform,
          photoUrl,
          croppedAreaPixels,
        })
      }

      setIsSubmitting(false)
      onSuccess()
    }
  }

  const goBack = () => {
    setFormStep((prev) => prev - 1)
  }

  return (
    <div
      className="panel"
      style={{
        maxWidth: '1000px',
        width: '100%',
        maxHeight: isMobile ? '95vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        background: '#fff',
        borderRadius: isMobile ? 8 : undefined,
      }}
    >
      {/* Header */}
      <div
        className="ph"
        style={{
          padding: isMobile ? '14px 16px' : '24px 32px',
          background: 'hsl(var(--on-surface))',
        }}
      >
        <div>
          <h2
            style={{
              color: '#fff',
              fontSize: isMobile ? '18px' : '24px',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Register new member
          </h2>
          <div
            className="meta"
            style={{
              color: 'hsl(var(--accent))',
              marginTop: '4px',
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Admin override workflow
          </div>
        </div>
        <button
          onClick={onClose}
          className="ico"
          style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'transparent', color: '#fff' }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Body */}
      <div
        id="registration-modal-content"
        style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
            gap: '32px',
          }}
        >
          {/* Progress Sidebar — desktop only */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              height: 'fit-content',
              display: isMobile ? 'none' : 'block',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '24px',
              }}
            >
              Registration progress
            </div>

            <div className="space-y-2">
              {[
                { step: 1, label: 'Primary Details' },
                { step: 2, label: 'Demographic info' },
                { step: 3, label: 'Emergency & Profession' },
                { step: 4, label: 'Final Verification' },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    background:
                      formStep === item.step ? 'hsl(var(--container-low))' : 'transparent',
                    borderLeft: `4px solid ${formStep === item.step ? 'hsl(var(--primary))' : 'transparent'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      background:
                        formStep >= item.step ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                      color: formStep >= item.step ? '#fff' : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {formStep > item.step ? (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        check
                      </span>
                    ) : (
                      item.step
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color:
                        formStep === item.step
                          ? 'hsl(var(--on-surface))'
                          : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="panel" style={{ padding: isMobile ? '20px 16px' : '40px' }}>
            {/* Mobile step progress bar */}
            {isMobile && (
              <div
                style={{
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 99,
                        background: formStep >= s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        transition: 'background .2s',
                      }}
                    />
                  ))}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  Step {formStep} of 4 —{' '}
                  {
                    [
                      'Primary Details',
                      'Demographic Info',
                      'Emergency & Profession',
                      'Final Verification',
                    ][formStep - 1]
                  }
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {formStep === 1 && (
                <div className="space-y-8">
                  <div
                    style={{
                      borderBottom: '2px solid hsl(var(--on-surface))',
                      paddingBottom: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        margin: 0,
                      }}
                    >
                      Step 1: Primary details
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: '4px',
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      Basic information required for the membership profile.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="input-efc762"
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Full name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      aria-label="As it appears on official ID"
                      name="name-efc762"
                      id="input-efc762"
                      placeholder="As it appears on official ID"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        fontSize: '14px',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '4px',
                        outline: 'none',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '12px',
                      }}
                    >
                      Select platform <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['GHANA', 'DIASPORA'].map((p) => (
                        <label
                          key={p}
                          style={{
                            cursor: 'pointer',
                            border: '1px solid hsl(var(--border))',
                            padding: '16px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background:
                              platform === p ? 'hsla(var(--primary), 0.05)' : 'transparent',
                            borderColor:
                              platform === p ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            color:
                              platform === p
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--on-surface-muted))',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            id="input-76964c"
                            type="radio"
                            name="platform"
                            value={p}
                            checked={platform === p}
                            onChange={() => handlePlatformChange(p)}
                            style={{ display: 'none' }}
                          />
                          Base {p === 'GHANA' ? 'Ghana' : 'Diaspora'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: isMobile ? '20px' : '24px',
                    }}
                  >
                    {platform === 'DIASPORA' && (
                      <div className="space-y-2">
                        <label
                          htmlFor="select-ea007f"
                          style={{
                            fontSize: '10px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface-muted))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Country of residence{' '}
                          <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                        </label>
                        <select
                          name="name-ea007f"
                          id="select-ea007f"
                          required
                          value={formData.country}
                          onChange={(e) => handleChange('country', e.target.value)}
                          className="reg"
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            fontSize: '14px',
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {diasporaCountries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label
                        htmlFor="input-109f3c"
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Contact number <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
                        <select
                          name="name-9533b6"
                          id="select-9533b6"
                          value={formData.countryCode}
                          onChange={(e) => handleChange('countryCode', e.target.value)}
                          className="reg"
                          style={{
                            width: '80px',
                            flexShrink: 0,
                            padding: '14px 8px',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {Array.from(new Set(Object.values(countryCodes)))
                            .sort()
                            .map((code) => (
                              <option key={code} value={code}>
                                {code}
                              </option>
                            ))}
                        </select>
                        <input
                          aria-label="Phone number"
                          name="name-109f3c"
                          id="input-109f3c"
                          type="tel"
                          placeholder="Phone number"
                          required
                          value={formData.contactNumber}
                          onChange={(e) => handleChange('contactNumber', e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            boxSizing: 'border-box',
                            padding: '14px 18px',
                            fontSize: '14px',
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            outline: 'none',
                            color: 'hsl(var(--on-surface))',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="input-ec50d2"
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Account password <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        aria-label="Minimum 6 characters"
                        name="name-ec50d2"
                        id="input-ec50d2"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          fontSize: '14px',
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'hsl(var(--on-surface))',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8">
                  <div
                    style={{
                      borderBottom: '2px solid hsl(var(--on-surface))',
                      paddingBottom: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        margin: 0,
                      }}
                    >
                      Step 2: Demographic details
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: '4px',
                      }}
                    >
                      Further details to finalize the membership chapter.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '32px',
                    }}
                  >
                    <div className="space-y-3">
                      <label
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '12px',
                        }}
                      >
                        Age range <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ageRanges.map((range) => (
                          <label
                            key={range}
                            style={{
                              cursor: 'pointer',
                              border: '1px solid hsl(var(--border))',
                              padding: '12px',
                              textAlign: 'center',
                              borderRadius: '4px',
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background:
                                formData.ageRange === range
                                  ? 'hsla(var(--primary), 0.05)'
                                  : 'transparent',
                              borderColor:
                                formData.ageRange === range
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--border))',
                              color:
                                formData.ageRange === range
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--on-surface-muted))',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              id="input-d93ff7"
                              type="radio"
                              name="ageRange"
                              value={range}
                              checked={formData.ageRange === range}
                              onChange={() => handleChange('ageRange', range)}
                              style={{ display: 'none' }}
                            />
                            {range}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '12px',
                        }}
                      >
                        Gender <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map((g) => (
                          <label
                            key={g}
                            style={{
                              cursor: 'pointer',
                              border: '1px solid hsl(var(--border))',
                              padding: '12px',
                              textAlign: 'center',
                              borderRadius: '4px',
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background:
                                formData.gender === g
                                  ? 'hsla(var(--primary), 0.05)'
                                  : 'transparent',
                              borderColor:
                                formData.gender === g
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--border))',
                              color:
                                formData.gender === g
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--on-surface-muted))',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              id="input-27f402"
                              type="radio"
                              name="gender"
                              value={g}
                              checked={formData.gender === g}
                              onChange={() => handleChange('gender', g)}
                              style={{ display: 'none' }}
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="input-f8cc39"
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Residential address{' '}
                      <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      aria-label="Street, House Number, City"
                      name="name-f8cc39"
                      id="input-f8cc39"
                      placeholder="Street, House Number, City"
                      required
                      value={formData.residentialAddress}
                      onChange={(e) => handleChange('residentialAddress', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        fontSize: '14px',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '4px',
                        outline: 'none',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '32px',
                    }}
                  >
                    {platform === 'GHANA' ? (
                      <>
                        <div className="space-y-2">
                          <label
                            htmlFor="select-0e9706"
                            style={{
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                          </label>
                          <select
                            name="name-0e9706"
                            id="select-0e9706"
                            required
                            value={formData.region}
                            onChange={(e) => handleChange('region', e.target.value)}
                            className="reg"
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              fontSize: '14px',
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '4px',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            <option value="">Select Region</option>
                            {ghanaRegions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="select-3ce1cd"
                            style={{
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                          </label>
                          <select
                            name="name-3ce1cd"
                            id="select-3ce1cd"
                            required
                            disabled={!formData.region}
                            value={formData.constituency}
                            onChange={(e) => handleChange('constituency', e.target.value)}
                            className="reg"
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              fontSize: '14px',
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '4px',
                              color: 'hsl(var(--on-surface))',
                              opacity: !formData.region ? 0.5 : 1,
                            }}
                          >
                            <option value="">Select Constituency</option>
                            {formData.region &&
                              regionConstituencies[formData.region]?.map((con) => (
                                <option key={con} value={con}>
                                  {con}
                                </option>
                              ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <label
                          htmlFor="input-4d1480"
                          style={{
                            fontSize: '10px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface-muted))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Assigned chapter{' '}
                          <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                        </label>
                        <input
                          aria-label="E.g. UK Chapter - London"
                          name="name-4d1480"
                          id="input-4d1480"
                          placeholder="E.g. UK Chapter - London"
                          required
                          value={formData.chapter}
                          onChange={(e) => handleChange('chapter', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            fontSize: '14px',
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            outline: 'none',
                            color: 'hsl(var(--on-surface))',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8">
                  <div
                    style={{
                      borderBottom: '2px solid hsl(var(--on-surface))',
                      paddingBottom: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        margin: 0,
                      }}
                    >
                      Step 3: Emergency & profession details
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: '4px',
                      }}
                    >
                      Crucial for member safety and institutional records.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="input-6a8f94"
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Emergency contact name{' '}
                      <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      aria-label="Full Name"
                      name="name-6a8f94"
                      id="input-6a8f94"
                      placeholder="Full Name"
                      required
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        fontSize: '14px',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '4px',
                        outline: 'none',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '32px',
                    }}
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="input-6df3eb"
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Relationship <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <input
                        aria-label="E.g. Spouse, Parent, Brother"
                        name="name-6df3eb"
                        id="input-6df3eb"
                        placeholder="E.g. Spouse, Parent, Brother"
                        required
                        value={formData.emergencyRelationship}
                        onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          fontSize: '14px',
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'hsl(var(--on-surface))',
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="input-434c82"
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Emergency contact number{' '}
                        <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <input
                        aria-label="Phone number"
                        name="name-434c82"
                        id="input-434c82"
                        type="tel"
                        placeholder="Phone number"
                        required
                        value={formData.emergencyNumber}
                        onChange={(e) => handleChange('emergencyNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          fontSize: '14px',
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'hsl(var(--on-surface))',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '32px',
                    }}
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="input-fcf881"
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Profession / occupation{' '}
                        <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <input
                        aria-label="E.g. Teacher, Nurse, Student"
                        name="name-fcf881"
                        id="input-fcf881"
                        placeholder="E.g. Teacher, Nurse, Student"
                        required
                        value={formData.profession}
                        onChange={(e) => handleChange('profession', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          fontSize: '14px',
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'hsl(var(--on-surface))',
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="select-b50420"
                        style={{
                          fontSize: '10px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Education level <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                      <select
                        name="name-b50420"
                        id="select-b50420"
                        required
                        value={formData.educationLevel}
                        onChange={(e) => handleChange('educationLevel', e.target.value)}
                        className="reg"
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          fontSize: '14px',
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <option value="">Select Level</option>
                        {educationLevels.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8">
                  <div
                    style={{
                      borderBottom: '2px solid hsl(var(--on-surface))',
                      paddingBottom: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        margin: 0,
                      }}
                    >
                      Step 4: Final verification
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: '4px',
                      }}
                    >
                      Identity confirmation and oath of commitment.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label
                      style={{
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Passport photo <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>

                    {!photoUrl ? (
                      <div
                        style={{
                          border: '2px dashed hsl(var(--border))',
                          padding: '60px',
                          textAlign: 'center',
                          background: 'hsl(var(--container-low))',
                          position: 'relative',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          aria-label="Upload profile photo"
                          onChange={handlePhotoUpload}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                          }}
                        />
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            background: 'hsla(var(--primary), 0.1)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '32px', color: 'hsl(var(--primary))' }}
                          >
                            upload
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Click to upload passport photo
                        </p>
                      </div>
                    ) : (
                      <div
                        className="panel"
                        style={{ padding: '24px', background: 'hsl(var(--container-low))' }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            height: '400px',
                            width: '100%',
                            background: 'hsl(var(--on-surface))',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            marginTop: '24px',
                          }}
                        >
                          <input
                            name="zoom"
                            id="input-d97898"
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            style={{ flex: 1, accentColor: 'hsl(var(--primary))' }}
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            className="ico no"
                            style={{ width: '40px', height: '40px' }}
                            title="Remove photo"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            textAlign: 'center',
                            marginTop: '16px',
                          }}
                        >
                          Position the face within the frame
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: 'hsl(var(--on-surface))',
                      color: '#fff',
                      padding: '32px',
                      marginTop: '40px',
                      borderLeft: '8px solid hsl(var(--primary))',
                      borderRadius: '4px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <h5
                      style={{
                        color: 'hsl(var(--accent))',
                        marginBottom: '12px',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      The Base declaration
                    </h5>
                    <p
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '24px',
                      }}
                    >
                      I hereby declare that the information provided is accurate to the best of my
                      knowledge. I commit to uphold the core values of <strong>THE BASE</strong>:
                      Patriotism, Honesty, and Discipline and pledge to advance the cause of{' '}
                      <strong style={{ color: 'hsl(var(--accent))' }}>GHANA FIRST</strong> in all my
                      actions.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <input
                        name="name-698fba"
                        type="checkbox"
                        id="privacy"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        style={{
                          marginTop: '4px',
                          width: '20px',
                          height: '20px',
                          accentColor: 'hsl(var(--primary))',
                        }}
                      />
                      <label
                        htmlFor="privacy"
                        style={{
                          fontSize: '13px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                        }}
                      >
                        I accept this declaration on behalf of the member and agree to the{' '}
                        <span style={{ color: 'hsl(var(--accent))', textDecoration: 'underline' }}>
                          Privacy Policy
                        </span>{' '}
                        <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '40px',
                  paddingTop: '32px',
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn btn-outline"
                    style={{ flex: 1, height: '54px' }}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={(formStep === 4 && !agreed) || isSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    height: '54px',
                    opacity: (formStep === 4 && !agreed) || isSubmitting ? 0.5 : 1,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        className="material-symbols-outlined animate-spin"
                        style={{ fontSize: '20px' }}
                      >
                        refresh
                      </span>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {formStep < 4 ? 'Next step' : 'Submit registration'}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
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
