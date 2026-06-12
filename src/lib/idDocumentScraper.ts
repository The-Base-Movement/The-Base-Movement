/**
 * ID Document Data Scraping Script
 *
 * Extracts structured data from Ghana Card, Passport, and Voter ID images
 * for registration form auto-population and verification.
 *
 * Supports:
 * - Ghana National Identification Card (Ghana Card)
 * - Ghana Passport
 * - Ghana Voter ID
 * - International Passport (limited fields)
 */

/**
 * OCR Result Structure from Tesseract.js or Cloud Vision API
 * Maps extracted text to standardized field names
 */
interface OCRResult {
  rawText: string
  confidence: number
  regions: OCRRegion[]
}

interface OCRRegion {
  boundingBox: { x: number; y: number; width: number; height: number }
  text: string
  confidence: number
}

/**
 * Scraped ID Document Data
 * Extracted and normalized from OCR processing
 */
export interface ScrapedIDData {
  // Personal Information
  firstName?: string
  lastName?: string
  fullName?: string
  dateOfBirth?: string // YYYY-MM-DD
  age?: number
  gender?: string // 'M' | 'F'
  nationality?: string

  // ID Information
  idNumber?: string
  idType?: 'GHANA_CARD' | 'PASSPORT' | 'VOTER_ID'
  issueDate?: string
  expiryDate?: string
  isExpired?: boolean
  issuingCountry?: string
  issuingAuthority?: string

  // Address Information
  residentialAddress?: string
  city?: string
  region?: string
  postalCode?: string

  // Additional Fields (Ghana Card specific)
  profession?: string
  placeOfBirth?: string
  motherName?: string
  fatherName?: string
  maritalStatus?: string
  bloodType?: string

  // Metadata
  extractionMethod: 'ocr' | 'smile_id' | 'manual'
  confidence: number // 0-100
  warnings: string[]
  rawOCRText?: string
}

/**
 * GHANA CARD FIELD EXTRACTION
 *
 * Ghana Card Layout:
 * - Front: Full Name, ID Number (16 chars), Date of Birth, Gender, Blood Type, MRZ line
 * - Back: Address, Profession, Issue Date, Expiry Date, Signature, Photo
 *
 * Key Identifiers:
 * - ID Number Format: XXXXX-XXXX-XXXX-X (check digit validation possible)
 * - MRZ Line: Machine-readable zone for automated parsing
 * - Issue/Expiry: Typically printed near MRZ
 */
export function scrapeGhanaCard(ocrResult: OCRResult): ScrapedIDData {
  const data: ScrapedIDData = {
    idType: 'GHANA_CARD',
    extractionMethod: 'ocr',
    confidence: ocrResult.confidence,
    warnings: [],
    rawOCRText: ocrResult.rawText,
  }

  const text = ocrResult.rawText.toUpperCase()

  // Extract ID Number: Pattern XXXXX-XXXX-XXXX-X (16 digits with dashes)
  const idMatch = text.match(/(\d{5})-(\d{4})-(\d{4})-(\d)/)
  if (idMatch) {
    data.idNumber = idMatch[0].replace(/-/g, '')
  } else {
    data.warnings.push('Could not extract ID number from Ghana Card')
  }

  // Extract Full Name: Typically before ID number on front
  const nameMatch = text.match(/^([A-Z\s]{5,}?)\n/m)
  if (nameMatch) {
    const fullName = nameMatch[1].trim()
    const [firstName, ...lastNameParts] = fullName.split(/\s+/)
    data.firstName = firstName
    data.lastName = lastNameParts.join(' ')
    data.fullName = fullName
  }

  // Extract Date of Birth: Pattern DD/MM/YYYY or YYYY-MM-DD
  const dobMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{4})-(\d{2})-(\d{2})/)
  if (dobMatch) {
    if (dobMatch[3]) {
      // DD/MM/YYYY format
      const [day, month, year] = [dobMatch[1], dobMatch[2], dobMatch[3]]
      data.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else {
      // YYYY-MM-DD format
      data.dateOfBirth = dobMatch[0]
    }
    // Calculate age
    if (data.dateOfBirth) {
      const [year, month, day] = data.dateOfBirth.split('-')
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const today = new Date()
      data.age = today.getFullYear() - birthDate.getFullYear()
      if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
      ) {
        data.age--
      }
    }
  } else {
    data.warnings.push('Could not extract date of birth')
  }

  // Extract Gender: Look for M/F or Male/Female
  const genderMatch = text.match(/\b([MF]|MALE|FEMALE)\b/)
  if (genderMatch) {
    data.gender = genderMatch[1][0]
  }

  // Extract Blood Type: Look for blood type patterns
  const bloodTypeMatch = text.match(/\b(O[+-]|A[+-]|B[+-]|AB[+-])\b/)
  if (bloodTypeMatch) {
    data.bloodType = bloodTypeMatch[0]
  }

  // Extract Issue and Expiry Dates
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
  const dates = [...text.matchAll(datePattern)]
  if (dates.length >= 2) {
    data.issueDate = dates[0][0]
    data.expiryDate = dates[1][0]
    // Check if expired
    const year = parseInt(dates[1][3])
    const month = parseInt(dates[1][2]) - 1
    const day = parseInt(dates[1][1])
    const expiry = new Date(year, month, day)
    data.isExpired = expiry < new Date()
  }

  // Extract Address (usually on back, multi-line)
  const addressMatch = text.match(/ADDRESS[:\s]+([\s\S]{10,100}?)(?=PROFESSION|$)/i)
  if (addressMatch) {
    data.residentialAddress = addressMatch[1].trim()
  }

  // Extract Profession
  const professionMatch = text.match(/PROFESSION[:\s]+([A-Z\s]{3,}?)(?=\n|$)/i)
  if (professionMatch) {
    data.profession = professionMatch[1].trim()
  }

  return data
}

/**
 * PASSPORT FIELD EXTRACTION
 *
 * Passport Layout:
 * - MRZ Line: Machine-readable zone with standardized format
 * - Header: Passport number, issue/expiry dates
 * - Personal: Name, DOB, gender, place of birth
 *
 * Ghana Passport typically has:
 * - 9-character passport number
 * - Issue/Expiry in YYMMDD format
 * - MRZ with encoded data
 */
export function scrapePassport(ocrResult: OCRResult): ScrapedIDData {
  const data: ScrapedIDData = {
    idType: 'PASSPORT',
    extractionMethod: 'ocr',
    confidence: ocrResult.confidence,
    warnings: [],
    rawOCRText: ocrResult.rawText,
  }

  const text = ocrResult.rawText.toUpperCase()

  // Extract Passport Number: Usually 8-9 alphanumeric
  const passportMatch = text.match(/(?:PASSPORT\s*#?|P\s*No\.?\s*:?\s*)([A-Z0-9]{8,9})/i)
  if (passportMatch) {
    data.idNumber = passportMatch[1]
  }

  // Extract Name from text
  const nameMatch = text.match(/^([A-Z\s]{5,}?)\n/m)
  if (nameMatch) {
    const fullName = nameMatch[1].trim()
    const [firstName, ...lastNameParts] = fullName.split(/\s+/)
    data.firstName = firstName
    data.lastName = lastNameParts.join(' ')
    data.fullName = fullName
  }

  // Extract Date of Birth
  const dobMatch = text.match(/DOB[:\s]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
  if (dobMatch) {
    const day = dobMatch[1].padStart(2, '0')
    const month = dobMatch[2].padStart(2, '0')
    data.dateOfBirth = `${dobMatch[3]}-${month}-${day}`
  }

  // Extract Gender
  const genderMatch = text.match(/SEX[:\s]*([MF])/i)
  if (genderMatch) {
    data.gender = genderMatch[1]
  }

  // Extract Nationality
  data.nationality = 'Ghana'
  data.issuingCountry = 'Ghana'

  // Extract Dates (Issue/Expiry)
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g
  const dates = [...text.matchAll(datePattern)]
  if (dates.length >= 2) {
    data.issueDate = dates[0][0]
    data.expiryDate = dates[1][0]
    const year = parseInt(dates[1][3])
    const month = parseInt(dates[1][2]) - 1
    const day = parseInt(dates[1][1])
    const expiry = new Date(year, month, day)
    data.isExpired = expiry < new Date()
  }

  return data
}

/**
 * VOTER ID FIELD EXTRACTION
 *
 * Voter ID Layout:
 * - Voter Registration Number (VRN): 10-digit format
 * - Name, Polling Station
 * - Simple layout, smaller dataset
 */
export function scrapeVoterID(ocrResult: OCRResult): ScrapedIDData {
  const data: ScrapedIDData = {
    idType: 'VOTER_ID',
    extractionMethod: 'ocr',
    confidence: ocrResult.confidence,
    warnings: [],
    rawOCRText: ocrResult.rawText,
  }

  const text = ocrResult.rawText.toUpperCase()

  // Extract Voter Registration Number
  const vrnMatch = text.match(/VRN[:\s]*(\d{10})/i)
  if (vrnMatch) {
    data.idNumber = vrnMatch[1]
  }

  // Extract Name
  const nameMatch = text.match(/NAME[:\s]*([A-Z\s]{5,}?)(?:\n|POLLING|$)/i)
  if (nameMatch) {
    const fullName = nameMatch[1].trim()
    const [firstName, ...lastNameParts] = fullName.split(/\s+/)
    data.firstName = firstName
    data.lastName = lastNameParts.join(' ')
    data.fullName = fullName
  }

  return data
}

/**
 * MAIN SCRAPER FUNCTION
 * Auto-detects document type and extracts appropriate fields
 */
export async function scrapeIDDocument(
  _base64Image: string,
  detectedType?: 'GHANA_CARD' | 'PASSPORT' | 'VOTER_ID'
): Promise<ScrapedIDData> {
  // In production, this would call Tesseract.js or Cloud Vision API
  // For now, returns template structure

  const mockOCRResult: OCRResult = {
    rawText: 'Mock OCR result - implement actual OCR service',
    confidence: 0,
    regions: [],
  }

  if (detectedType === 'GHANA_CARD') {
    return scrapeGhanaCard(mockOCRResult)
  } else if (detectedType === 'PASSPORT') {
    return scrapePassport(mockOCRResult)
  } else if (detectedType === 'VOTER_ID') {
    return scrapeVoterID(mockOCRResult)
  }

  // Auto-detect from text content
  return scrapeGhanaCard(mockOCRResult)
}

/**
 * VALIDATION & SANITY CHECKS
 */
export function validateScrapedData(data: ScrapedIDData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!data.idNumber) errors.push('ID number is required')
  if (!data.fullName) errors.push('Full name is required')
  if (!data.dateOfBirth) errors.push('Date of birth is required')

  // Validate ID number format by type
  if (data.idType === 'GHANA_CARD' && data.idNumber) {
    if (!/^\d{16}$/.test(data.idNumber.replace(/-/g, ''))) {
      errors.push('Invalid Ghana Card number format (should be 16 digits)')
    }
  }

  // Check expiry
  if (data.isExpired) {
    errors.push('ID document has expired')
  }

  // Validate age (registrants should be 18+)
  if (data.age && data.age < 18) {
    errors.push('Applicant must be 18 years or older')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default {
  scrapeGhanaCard,
  scrapePassport,
  scrapeVoterID,
  scrapeIDDocument,
  validateScrapedData,
}
