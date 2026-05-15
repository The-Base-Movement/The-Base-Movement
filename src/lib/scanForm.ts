/**
 * scanForm.ts
 * Browser-based form scanner using Tesseract.js (OCR) and PDF.js.
 * No API keys. No server calls. Runs entirely in the browser.
 */

import { createWorker } from 'tesseract.js'
import type { RegistrationFormData } from '@/types/registration'

// ── Ghana regions for matching ────────────────────────────────────────────────
const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Savannah',
  'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East',
]

// ── Extract text from a File using Tesseract ──────────────────────────────────
async function ocrImage(source: File | HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: () => {}, // silence progress logs
  })
  const { data: { text } } = await worker.recognize(source)
  await worker.terminate()
  return text
}

// ── Render PDF pages to canvas and OCR each ───────────────────────────────────
async function ocrPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pageTexts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)

    // First try embedded text (works for digital/searchable PDFs instantly)
    const content = await page.getTextContent()
    const embedded = content.items
      .map((item) => ('str' in item ? (item.str ?? '') : ''))
      .join(' ')
      .trim()

    if (embedded.length > 80) {
      pageTexts.push(embedded)
      continue
    }

    // Fall back to rendering → Tesseract for scanned pages
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, canvas, viewport } as Parameters<typeof page.render>[0]).promise
    const text = await ocrImage(canvas)
    pageTexts.push(text)
  }

  return pageTexts.join('\n')
}

// ── Field extraction helpers ──────────────────────────────────────────────────

function after(text: string, label: RegExp): string | null {
  const m = text.match(label)
  if (!m || m.index === undefined) return null
  const rest = text.slice(m.index + m[0].length).trim()
  // Take up to the next newline or 60 chars
  const line = rest.split(/\n/)[0].trim()
  return line.length > 1 ? line : null
}

function detectPlatform(text: string): 'GHANA' | 'DIASPORA' {
  const upper = text.toUpperCase()
  if (upper.includes('DIASPORA')) return 'DIASPORA'
  return 'GHANA'
}

function extractGender(text: string): string | null {
  // Look for checked box markers (X, ✓, ✗) near gender labels
  if (/\b(x|✓|✗|\[x\]|\(x\))\s*(male|m\b)/i.test(text)) return 'Male'
  if (/\b(x|✓|✗|\[x\]|\(x\))\s*(female|f\b)/i.test(text)) return 'Female'
  if (/gender[:\s]+male/i.test(text)) return 'Male'
  if (/gender[:\s]+female/i.test(text)) return 'Female'
  return null
}

function extractAgeRange(text: string): string | null {
  const ranges = ['18-25', '26-35', '36-45', '46-60', '60+']
  for (const r of ranges) {
    // Check if the range appears near a checkmark or 'x'
    const pattern = new RegExp(`(x|✓|✗|\\[x\\])\\s*${r.replace('+', '\\+')}|${r.replace('+', '\\+')}\\s*(x|✓|✗|\\[x\\])`, 'i')
    if (pattern.test(text)) return r
  }
  // Fall back to just finding a range mentioned near "age"
  const m = text.match(/age\s*range[:\s]+(\d{2}-\d{2}|\d{2}\+)/i)
  if (m) return m[1]
  return null
}

function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : null
}

function extractPhone(text: string): string | null {
  // Match common Ghanaian / international phone patterns
  const m = text.match(/(?:contact|phone|tel|mobile|number)[:\s]*([+\d][\d\s\-()]{7,15})/i)
  if (m) return m[1].replace(/\s+/g, '').trim()
  return null
}

function extractRegion(text: string): string | null {
  for (const region of GHANA_REGIONS) {
    if (new RegExp(`\\b${region}\\b`, 'i').test(text)) return region
  }
  return null
}

function extractEducation(text: string): string | null {
  const levels = ['Postgraduate', 'Tertiary', 'Secondary', 'Basic']
  for (const l of levels) {
    if (new RegExp(`(x|✓|✗|\\[x\\])\\s*${l}|${l}\\s*(x|✓|✗|\\[x\\])`, 'i').test(text)) return l
    if (new RegExp(`education[:\\s]+${l}`, 'i').test(text)) return l
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scanFormFile(file: File): Promise<{
  platform: 'GHANA' | 'DIASPORA'
  fields: Partial<RegistrationFormData>
}> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const text = isPdf ? await ocrPdf(file) : await ocrImage(file)

  const platform = detectPlatform(text)

  const fields: Partial<RegistrationFormData> = {
    fullName:
      after(text, /full\s*name[:\s]*/i) ??
      after(text, /name[:\s]*/i) ??
      undefined,

    gender: extractGender(text) ?? undefined,
    ageRange: extractAgeRange(text) ?? undefined,
    email: extractEmail(text) ?? undefined,
    contactNumber: extractPhone(text) ?? undefined,

    residentialAddress:
      after(text, /residential\s*address[:\s]*/i) ??
      after(text, /address[:\s]*/i) ??
      undefined,

    region: platform === 'GHANA' ? (extractRegion(text) ?? undefined) : undefined,

    constituency:
      platform === 'GHANA'
        ? (after(text, /constituency[:\s]*/i) ?? undefined)
        : undefined,

    country:
      platform === 'DIASPORA'
        ? (after(text, /country[:\s]*/i) ?? undefined)
        : 'Ghana',

    profession:
      after(text, /profession[:\s]*/i) ??
      after(text, /occupation[:\s]*/i) ??
      undefined,

    educationLevel: extractEducation(text) ?? undefined,

    emergencyContactName:
      after(text, /emergency\s*contact\s*name[:\s]*/i) ??
      after(text, /next\s*of\s*kin[:\s]*/i) ??
      undefined,

    emergencyRelationship:
      after(text, /relationship[:\s]*/i) ?? undefined,

    emergencyNumber:
      after(text, /emergency\s*(contact\s*)?number[:\s]*/i) ??
      after(text, /emergency\s*(contact\s*)?phone[:\s]*/i) ??
      undefined,
  }

  // Sanitize extracted values
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  const cleanPhone = (v: string | undefined) => {
    if (!v) return undefined
    const digits = v.replace(/[^\d]/g, '')
    return digits.length >= 7 ? v.replace(/[^\d+\s\-()]/g, '').trim() : undefined
  }

  if (fields.contactNumber) fields.contactNumber = cleanPhone(fields.contactNumber)
  if (fields.emergencyNumber) fields.emergencyNumber = cleanPhone(fields.emergencyNumber)
  if (fields.email && !emailRegex.test(fields.email)) delete fields.email

  // Trim whitespace from all string fields and drop empty strings
  Object.keys(fields).forEach(k => {
    const val = (fields as Record<string, unknown>)[k]
    if (val === undefined || val === null) {
      delete (fields as Record<string, unknown>)[k]
    } else if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed.length === 0) delete (fields as Record<string, unknown>)[k]
      else (fields as Record<string, unknown>)[k] = trimmed
    }
  })

  return { platform, fields }
}
