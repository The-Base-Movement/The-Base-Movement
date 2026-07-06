import { supabase } from '@/lib/supabase'

export interface PublicDirectoryProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  chapter: string | null
  constituency: string | null
}

export async function getPublicDirectoryProfiles(
  ids?: string[]
): Promise<PublicDirectoryProfile[]> {
  const uniqueIds = ids ? [...new Set(ids.filter(Boolean))] : null
  // ponytail: chapter/constituency counts need a whole-directory read; split by dedicated count RPCs only if this gets large.
  const { data, error } = await supabase.rpc('public_directory_profiles', {
    target_ids: uniqueIds && uniqueIds.length > 0 ? uniqueIds : null,
  })

  if (error) {
    console.warn('[publicDirectory] lookup failed:', error)
    return []
  }

  return (data ?? []) as PublicDirectoryProfile[]
}
