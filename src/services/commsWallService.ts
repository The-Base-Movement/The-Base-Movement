import { supabase } from '@/lib/supabase'
import type { Briefing, CommsRole } from './mediaHubService'

// Member-facing side of the Media Hub. Front-end Media/Mobilization members read
// briefings targeted to their tag, comment (via mediaHubService), and submit links
// that land in the admin inbox. All writes are RLS-gated to the member's own rows.

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

/** Audiences a member with these tags is allowed to see. */
function audiencesFor(roles: CommsRole[]): Briefing['audience'][] {
  const set = new Set<Briefing['audience']>(['both'])
  if (roles.includes('MEDIA')) set.add('media')
  if (roles.includes('MOBILIZATION')) set.add('mobilization')
  return [...set]
}

export const commsWallService = {
  async getMyRoles(): Promise<CommsRole[]> {
    // Explicit uid filter: the select policy also allows admins to read all rows,
    // so relying on RLS alone would return other members' tags for an admin.
    const userId = await getCurrentUserId()
    const { data } = await supabase.from('member_comms_roles').select('role').eq('user_id', userId)
    return (data ?? []).map((r) => r.role as CommsRole)
  },

  async getWallBriefings(roles: CommsRole[]): Promise<Briefing[]> {
    if (!roles.length) return []
    const { data } = await supabase
      .from('media_briefings')
      .select('*')
      .in('audience', audiencesFor(roles))
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (!data?.length) return []

    const authorIds = [...new Set(data.map((b) => b.author_id))]
    const { data: authors } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', authorIds)
    const authorMap = new Map(
      (authors ?? []).map((a) => [a.id, { name: a.full_name, avatar: a.avatar_url }])
    )

    return data.map((b) => ({
      ...b,
      author_name: authorMap.get(b.author_id)?.name ?? 'The Base team',
      author_avatar: authorMap.get(b.author_id)?.avatar ?? undefined,
    }))
  },

  async submitLink(link: string, note: string): Promise<boolean> {
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('media_wall_submissions').insert({
      author_id: userId,
      link: link.trim(),
      note: note.trim() || null,
    })
    if (error) console.error('submitLink error:', error)
    return !error
  },
}
