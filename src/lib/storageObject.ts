import { supabase } from '@/lib/supabase'

const STORAGE_MARKERS = ['public', 'sign', 'authenticated'] as const

export function extractStorageObjectPath(
  bucket: string,
  value: string | null | undefined
): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith(`${bucket}/`)) return trimmed.slice(bucket.length + 1)
    return trimmed
  }

  for (const marker of STORAGE_MARKERS) {
    const prefix = `/storage/v1/object/${marker}/${bucket}/`
    const idx = trimmed.indexOf(prefix)
    if (idx === -1) continue
    return decodeURIComponent(trimmed.slice(idx + prefix.length).split('?')[0])
  }

  return null
}

export async function createSignedStorageUrl(
  bucket: string,
  value: string | null | undefined,
  expiresIn = 300
): Promise<string | null> {
  if (!value) return null

  const path = extractStorageObjectPath(bucket, value)
  if (!path) return /^https?:\/\//i.test(value) ? value : null

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) {
    console.warn(`[storageObject] Failed to sign ${bucket}/${path}:`, error)
    return null
  }

  return data?.signedUrl ?? null
}
