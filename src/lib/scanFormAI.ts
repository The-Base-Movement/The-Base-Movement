/**
 * @file scanFormAI.ts
 * @description Server-side AI form scanner. Sends an image of the completed
 * registration form to the `scan-form-public` edge function (OpenAI vision) and
 * returns the extracted registration fields. Falls back to the client-side
 * Tesseract scanner (scanForm.ts) at the call site if this throws.
 */

import { supabase } from '@/lib/supabase'
import type { RegistrationFormData } from '@/types/registration'

type ProgressFn = (status: string) => void

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
const MAX_DIM = 1600 // downscale longest edge to keep payload small and fast

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read the image.'))
    img.src = src
  })
}

/** Render the form (image or first PDF page) to a downscaled JPEG canvas. */
async function fileToCanvas(file: File, isPdf: boolean): Promise<HTMLCanvasElement> {
  if (isPdf) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, canvas, viewport } as Parameters<typeof page.render>[0])
      .promise
    return canvas
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function scanFormAI(
  file: File,
  onProgress?: ProgressFn
): Promise<{ platform: 'GHANA' | 'DIASPORA'; fields: Partial<RegistrationFormData> }> {
  const name = file.name.toLowerCase()
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : ''
  const isPdf = file.type === 'application/pdf' || ext === '.pdf'
  const isImage = IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/.test(ext)
  if (!isPdf && !isImage) throw new Error('Unsupported file type for AI scan.')

  onProgress?.('Preparing…')
  const canvas = await fileToCanvas(file, isPdf)
  const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]

  onProgress?.('Reading your form with AI…')
  const { data, error } = await supabase.functions.invoke('scan-form-public', {
    body: { imageBase64, mediaType: 'image/jpeg' },
  })
  if (error) throw error
  if (!data?.success) throw new Error(data?.error || 'AI scan unavailable.')

  const raw = (data.data ?? {}) as Record<string, unknown>
  const platform: 'GHANA' | 'DIASPORA' = raw.platform === 'DIASPORA' ? 'DIASPORA' : 'GHANA'

  // Keep only the registration keys with non-null string/number values.
  const allowed: (keyof RegistrationFormData)[] = [
    'fullName',
    'gender',
    'ageRange',
    'email',
    'countryCode',
    'country',
    'contactNumber',
    'residentialAddress',
    'region',
    'constituency',
    'profession',
    'educationLevel',
    'emergencyContactName',
    'emergencyRelationship',
    'emergencyNumber',
    'votersIdCard',
  ]
  const fields: Partial<RegistrationFormData> = {}
  for (const key of allowed) {
    const v = raw[key]
    if (v == null) continue
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) (fields as Record<string, unknown>)[key] = t
    } else {
      ;(fields as Record<string, unknown>)[key] = v
    }
  }

  return { platform, fields }
}
