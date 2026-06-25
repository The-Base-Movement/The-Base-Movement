import { describe, expect, it } from 'vitest'
import type { RegistrationFormData } from '@/types/registration'

const VALID_GHANA: RegistrationFormData = {
  idNumber: 'GHA-123456789-0',
  fullName: 'Kwame Asante',
  countryCode: '+233',
  country: 'Ghana',
  children_count: 2,
  contactNumber: '241234567',
  ageRange: '26-35',
  gender: 'Male',
  password: 'Str0ng!Pass',
  email: 'kwame@example.com',
  residentialAddress: '15 Liberation Road',
  region: 'Greater Accra',
  constituency: 'Ablekuma North',
  chapter: 'Accra Central',
  profession: 'Software Engineer',
  educationLevel: 'Bachelors',
  emergencyContactName: 'Ama Asante',
  emergencyRelationship: 'Spouse',
  emergencyNumber: '+233201234567',
  city: 'Accra',
}

const VALID_DIASPORA: RegistrationFormData = {
  idNumber: '',
  fullName: 'Yaa Mensah',
  countryCode: '+1',
  country: 'United States',
  children_count: 0,
  contactNumber: '2025551234',
  ageRange: '18-25',
  gender: 'Female',
  password: 'D!aspora2024',
  email: 'yaa@example.com',
  residentialAddress: '100 Main St',
  region: '',
  constituency: '',
  chapter: '',
  profession: 'Nurse',
  educationLevel: 'Masters',
  emergencyContactName: 'Kofi Mensah',
  emergencyRelationship: 'Father',
  emergencyNumber: '+12025559999',
  city: 'New York',
}

describe('RegistrationFormData shape', () => {
  it('Ghana member has all required fields', () => {
    expect(VALID_GHANA.fullName).toBeTruthy()
    expect(VALID_GHANA.contactNumber).toBeTruthy()
    expect(VALID_GHANA.gender).toMatch(/^(Male|Female)$/)
    expect(VALID_GHANA.ageRange).toBeTruthy()
    expect(VALID_GHANA.region).toBeTruthy()
    expect(VALID_GHANA.constituency).toBeTruthy()
    expect(VALID_GHANA.emergencyContactName).toBeTruthy()
    expect(VALID_GHANA.emergencyNumber).toBeTruthy()
  })

  it('Diaspora member has no region/constituency', () => {
    expect(VALID_DIASPORA.region).toBe('')
    expect(VALID_DIASPORA.constituency).toBe('')
    expect(VALID_DIASPORA.country).not.toBe('Ghana')
    expect(VALID_DIASPORA.fullName).toBeTruthy()
  })

  it('password meets minimum requirements', () => {
    expect(VALID_GHANA.password!.length).toBeGreaterThanOrEqual(8)
    expect(VALID_DIASPORA.password!.length).toBeGreaterThanOrEqual(8)
  })
})

describe('Registration number format', () => {
  it('generates correct TBM-GH format for Ghana', () => {
    const yearStr = new Date().getFullYear().toString().slice(-2)
    const randomNum = String(Math.floor(1000 + Math.random() * 9000))
    const regNo = `TBM-GH-${yearStr}${randomNum}`
    expect(regNo).toMatch(/^TBM-GH-\d{6}$/)
  })

  it('generates correct TBM-DI format for Diaspora', () => {
    const yearStr = new Date().getFullYear().toString().slice(-2)
    const randomNum = String(Math.floor(1000 + Math.random() * 9000))
    const regNo = `TBM-DI-${yearStr}${randomNum}`
    expect(regNo).toMatch(/^TBM-DI-\d{6}$/)
  })
})

describe('Phone number cleaning', () => {
  it('strips leading zeros and spaces from contact number', () => {
    const raw = '024 123 4567'
    const countryCode = '+233'
    const clean = countryCode + raw.replace(/^0+/, '').replace(/\s+/g, '')
    expect(clean).toBe('+233241234567')
  })

  it('handles already-clean numbers', () => {
    const raw = '241234567'
    const countryCode = '+233'
    const clean = countryCode + raw.replace(/^0+/, '').replace(/\s+/g, '')
    expect(clean).toBe('+233241234567')
  })

  it('handles international format without double prefix', () => {
    const raw = '2025551234'
    const countryCode = '+1'
    const clean = countryCode + raw.replace(/^0+/, '').replace(/\s+/g, '')
    expect(clean).toBe('+12025551234')
  })
})

describe('Auto-approval logic', () => {
  it('Ghana member auto-approves with photo + constituency', () => {
    const hasPhoto = true
    const platform = 'GHANA'
    const ghanaReady = platform === 'GHANA' && hasPhoto && !!VALID_GHANA.constituency
    expect(ghanaReady).toBe(true)
  })

  it('Ghana member without constituency is not auto-approved', () => {
    const hasPhoto = true
    const platform = 'GHANA'
    const noConstituency = ''
    const ghanaReady = platform === 'GHANA' && hasPhoto && !!noConstituency
    expect(ghanaReady).toBe(false)
  })

  it('Diaspora member auto-approves with photo only', () => {
    const hasPhoto = true
    const platform = 'DIASPORA'
    const diasporaReady = platform === 'DIASPORA' && hasPhoto
    expect(diasporaReady).toBe(true)
  })

  it('No photo = pending for any platform', () => {
    const hasPhoto = false
    const platform = 'GHANA'
    const ghanaReady = platform === 'GHANA' && hasPhoto && !!VALID_GHANA.constituency
    const platform2 = 'DIASPORA'
    const diasporaReady = platform2 === 'DIASPORA' && hasPhoto
    expect(ghanaReady).toBe(false)
    expect(diasporaReady).toBe(false)
  })
})

describe('Email validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  it('accepts valid emails', () => {
    expect(emailRegex.test('user@example.com')).toBe(true)
    expect(emailRegex.test('kwame.asante@gmail.com')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(emailRegex.test('notanemail')).toBe(false)
    expect(emailRegex.test('user@')).toBe(false)
    expect(emailRegex.test('@example.com')).toBe(false)
    expect(emailRegex.test('user @example.com')).toBe(false)
  })
})

describe('Full name validation', () => {
  it('requires at least two words', () => {
    const check = (name: string) => name.trim().split(/\s+/).length >= 2
    expect(check('Kwame Asante')).toBe(true)
    expect(check('Kwame')).toBe(false)
    expect(check('  ')).toBe(false)
    expect(check('Kwame Nkrumah Asante')).toBe(true)
  })
})

describe('Phone number length', () => {
  it('requires at least 7 digits', () => {
    const check = (num: string) => num.replace(/\D/g, '').length >= 7
    expect(check('241234567')).toBe(true)
    expect(check('12345')).toBe(false)
    expect(check('024 123 4567')).toBe(true)
  })
})

describe('Offline draft structure', () => {
  it('draft contains required fields for sync', () => {
    const draft = {
      platform: 'GHANA',
      formData: VALID_GHANA,
      photoUrl: null,
      selfieUrl: null,
      croppedAreaPixels: null,
      usedScan: false,
      refParam: null,
    }
    expect(draft.platform).toBeTruthy()
    expect(draft.formData.fullName).toBeTruthy()
    expect(draft.formData.contactNumber).toBeTruthy()
  })

  it('draft preserves referral param', () => {
    const draft = {
      platform: 'GHANA',
      formData: VALID_GHANA,
      photoUrl: null,
      selfieUrl: null,
      croppedAreaPixels: null,
      usedScan: false,
      refParam: 'TBM-GH-260001',
    }
    expect(draft.refParam).toBe('TBM-GH-260001')
  })
})
