import { supabase } from '@/lib/supabase'
import { getPublicDirectoryProfiles } from '@/lib/publicDirectory'
// ── Types ──

export type BriefingAudience = 'team' | 'media' | 'mobilization' | 'both'

export interface Briefing {
  id: string
  title: string
  body: string
  priority: 'routine' | 'important' | 'urgent'
  audience: BriefingAudience
  pinned: boolean
  author_id: string
  author_name?: string
  author_avatar?: string
  attachments: unknown[]
  publish_by: string | null
  created_at: string
  updated_at: string
  read_count?: number
  comment_count?: number
  is_read?: boolean
}

export interface BriefingComment {
  id: string
  briefing_id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  body: string
  created_at: string
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  briefing_id: string | null
  briefing_title?: string
  assigned_to: string
  assignee_name?: string
  assigned_by: string
  assigner_name?: string
  status: 'pending' | 'draft' | 'in_review' | 'published' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  deadline: string | null
  created_at: string
  updated_at: string
}

export type CommsRole = 'MEDIA' | 'MOBILIZATION'

export interface WallSubmission {
  id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  link: string
  note: string | null
  status: 'new' | 'reviewed' | 'archived'
  created_at: string
}

export interface CommsMember {
  id: string
  name: string
  registration_number: string | null
  platform: string | null
  roles: CommsRole[]
}

const MEDIA_ROLES = [
  'CHIEF_EDITOR',
  'SENIOR_EDITOR',
  'EDITOR',
  'JUNIOR_EDITOR',
  'REGIONAL_CORRESPONDENT',
  'COMMUNICATIONS_OFFICER',
]

const CONTENT_ACTION_LABELS: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  published: 'published',
  unpublished: 'unpublished',
  submitted: 'submitted for verification',
  trashed: 'moved to trash',
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

async function resolveUserNames(
  userIds: string[]
): Promise<Map<string, { full_name: string; avatar_url: string | null }>> {
  const map = new Map<string, { full_name: string; avatar_url: string | null }>()
  if (!userIds.length) return map
  const data = await getPublicDirectoryProfiles(userIds)
  if (data) {
    for (const u of data) {
      map.set(u.id, { full_name: u.full_name ?? 'Unknown', avatar_url: u.avatar_url })
    }
  }
  return map
}

export const mediaHubService = {
  // ── Briefings ──

  async getBriefings(): Promise<Briefing[]> {
    const userId = await getCurrentUserId()

    const [{ data: briefings }, { data: reads }, { data: comments }, { data: userReads }] =
      await Promise.all([
        supabase
          .from('media_briefings')
          .select('*')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('media_briefing_reads').select('briefing_id'),
        supabase.from('media_briefing_comments').select('briefing_id'),
        supabase.from('media_briefing_reads').select('briefing_id').eq('user_id', userId),
      ])

    if (!briefings) return []

    // Count reads and comments per briefing
    const readCounts = new Map<string, number>()
    for (const r of reads ?? []) {
      readCounts.set(r.briefing_id, (readCounts.get(r.briefing_id) ?? 0) + 1)
    }
    const commentCounts = new Map<string, number>()
    for (const c of comments ?? []) {
      commentCounts.set(c.briefing_id, (commentCounts.get(c.briefing_id) ?? 0) + 1)
    }
    const userReadSet = new Set((userReads ?? []).map((r) => r.briefing_id))

    // Resolve author names
    const authorIds = briefings.map((b) => b.author_id)
    const userMap = await resolveUserNames(authorIds)

    return briefings.map((b) => ({
      ...b,
      author_name: userMap.get(b.author_id)?.full_name,
      author_avatar: userMap.get(b.author_id)?.avatar_url ?? undefined,
      read_count: readCounts.get(b.id) ?? 0,
      comment_count: commentCounts.get(b.id) ?? 0,
      is_read: userReadSet.has(b.id),
    }))
  },

  async createBriefing(data: {
    title: string
    body: string
    priority: string
    audience?: BriefingAudience
    pinned?: boolean
    publish_by?: string
  }): Promise<string | null> {
    const userId = await getCurrentUserId()
    const { data: row, error } = await supabase
      .from('media_briefings')
      .insert({
        title: data.title,
        body: data.body,
        priority: data.priority,
        audience: data.audience ?? 'team',
        pinned: data.pinned ?? false,
        publish_by: data.publish_by ?? null,
        author_id: userId,
      })
      .select('id')
      .single()
    if (error) {
      console.error('createBriefing error:', error)
      return null
    }
    return row.id
  },

  async updateBriefing(
    id: string,
    data: Partial<{
      title: string
      body: string
      priority: string
      audience: BriefingAudience
      pinned: boolean
      publish_by: string | null
    }>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('media_briefings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('updateBriefing error:', error)
    return !error
  },

  async deleteBriefing(id: string): Promise<boolean> {
    const { error } = await supabase.from('media_briefings').delete().eq('id', id)
    if (error) console.error('deleteBriefing error:', error)
    return !error
  },

  async togglePin(id: string, pinned: boolean): Promise<boolean> {
    const { error } = await supabase.from('media_briefings').update({ pinned }).eq('id', id)
    if (error) console.error('togglePin error:', error)
    return !error
  },

  // ── Read receipts ──

  async markAsRead(briefingId: string): Promise<void> {
    const userId = await getCurrentUserId()
    await supabase
      .from('media_briefing_reads')
      .upsert(
        { briefing_id: briefingId, user_id: userId, read_at: new Date().toISOString() },
        { onConflict: 'briefing_id,user_id' }
      )
  },

  async getReadReceipts(
    briefingId: string
  ): Promise<{ user_id: string; name: string; read_at: string }[]> {
    const { data: reads } = await supabase
      .from('media_briefing_reads')
      .select('user_id, read_at')
      .eq('briefing_id', briefingId)
    if (!reads?.length) return []

    const userMap = await resolveUserNames(reads.map((r) => r.user_id))
    return reads.map((r) => ({
      user_id: r.user_id,
      name: userMap.get(r.user_id)?.full_name ?? 'Unknown',
      read_at: r.read_at,
    }))
  },

  // ── Comments ──

  async getComments(briefingId: string): Promise<BriefingComment[]> {
    const { data: comments } = await supabase
      .from('media_briefing_comments')
      .select('*')
      .eq('briefing_id', briefingId)
      .order('created_at', { ascending: true })
    if (!comments?.length) return []

    const userMap = await resolveUserNames(comments.map((c) => c.author_id))
    return comments.map((c) => ({
      ...c,
      author_name: userMap.get(c.author_id)?.full_name,
      author_avatar: userMap.get(c.author_id)?.avatar_url ?? undefined,
    }))
  },

  async addComment(briefingId: string, body: string): Promise<BriefingComment | null> {
    const userId = await getCurrentUserId()
    const { data: row, error } = await supabase
      .from('media_briefing_comments')
      .insert({ briefing_id: briefingId, author_id: userId, body })
      .select('*')
      .single()
    if (error) {
      console.error('addComment error:', error)
      return null
    }
    const userMap = await resolveUserNames([userId])
    return {
      ...row,
      author_name: userMap.get(userId)?.full_name,
      author_avatar: userMap.get(userId)?.avatar_url ?? undefined,
    }
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const { error } = await supabase.from('media_briefing_comments').delete().eq('id', commentId)
    if (error) console.error('deleteComment error:', error)
    return !error
  },

  // ── Assignments ──

  async getAssignments(): Promise<Assignment[]> {
    const { data: assignments } = await supabase
      .from('media_assignments')
      .select('*')
      .order('created_at', { ascending: false })
    if (!assignments?.length) return []

    // Collect all user ids and briefing ids to resolve
    const userIds = [
      ...assignments.map((a) => a.assigned_to),
      ...assignments.map((a) => a.assigned_by),
    ]
    const briefingIds = assignments
      .map((a) => a.briefing_id)
      .filter((id): id is string => id !== null)

    const [userMap, briefingMap] = await Promise.all([
      resolveUserNames(userIds),
      (async () => {
        if (!briefingIds.length) return new Map<string, string>()
        const { data } = await supabase
          .from('media_briefings')
          .select('id, title')
          .in('id', briefingIds)
        const m = new Map<string, string>()
        for (const b of data ?? []) m.set(b.id, b.title)
        return m
      })(),
    ])

    return assignments.map((a) => ({
      ...a,
      assignee_name: userMap.get(a.assigned_to)?.full_name,
      assigner_name: userMap.get(a.assigned_by)?.full_name,
      briefing_title: a.briefing_id ? briefingMap.get(a.briefing_id) : undefined,
    }))
  },

  async createAssignment(data: {
    title: string
    description?: string
    briefing_id?: string
    assigned_to: string
    priority?: string
    deadline?: string
  }): Promise<string | null> {
    const userId = await getCurrentUserId()
    const { data: row, error } = await supabase
      .from('media_assignments')
      .insert({
        title: data.title,
        description: data.description ?? null,
        briefing_id: data.briefing_id ?? null,
        assigned_to: data.assigned_to,
        assigned_by: userId,
        priority: data.priority ?? 'normal',
        deadline: data.deadline ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.error('createAssignment error:', error)
      return null
    }
    return row.id
  },

  async updateAssignmentStatus(id: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('media_assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('updateAssignmentStatus error:', error)
    return !error
  },

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<boolean> {
    // Strip computed fields that don't exist in the table
    const { assignee_name, assigner_name, briefing_title, ...updateData } = data
    void assignee_name
    void assigner_name
    void briefing_title
    const { error } = await supabase
      .from('media_assignments')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('updateAssignment error:', error)
    return !error
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase.from('media_assignments').delete().eq('id', id)
    if (error) console.error('deleteAssignment error:', error)
    return !error
  },

  // ── Helpers ──

  async createContentActivityAlert(data: {
    action: 'created' | 'updated' | 'published' | 'unpublished' | 'submitted' | 'trashed'
    postId: string
    title: string
    status?: string
    slug?: string
  }): Promise<void> {
    const userId = await getCurrentUserId()
    const { data: adminRow, error: adminError } = await supabase
      .from('admins')
      .select('id, role, users!admins_id_fkey(full_name)')
      .eq('id', userId)
      .maybeSingle()

    if (adminError) {
      console.warn('[MEDIA HUB] Failed to resolve content actor:', adminError)
      return
    }

    const typedAdmin = adminRow as {
      id: string
      role: string
      users: { full_name: string | null } | { full_name: string | null }[] | null
    } | null
    if (!typedAdmin || !MEDIA_ROLES.includes(typedAdmin.role)) return

    const profile = Array.isArray(typedAdmin.users) ? typedAdmin.users[0] : typedAdmin.users
    const actorName = profile?.full_name || 'Unknown media operator'
    const occurredAt = new Date()
    const actionLabel = CONTENT_ACTION_LABELS[data.action] ?? data.action
    const bodyRows = [
      `${actorName} ${actionLabel} a blog article in the editorial workflow.`,
      '',
      `Title: ${data.title}`,
      `Article ID: ${data.postId}`,
      `Actor: ${actorName}`,
      `Role: ${typedAdmin.role}`,
      `Date/time: ${occurredAt.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}`,
      `ISO timestamp: ${occurredAt.toISOString()}`,
    ]
    if (data.status) bodyRows.push(`Status: ${data.status}`)
    if (data.slug) bodyRows.push(`Slug: ${data.slug}`)
    const body = bodyRows.join('\n')

    const priority = ['published', 'trashed'].includes(data.action) ? 'urgent' : 'important'
    const { error } = await supabase.from('media_briefings').insert({
      title: `Editorial activity: ${data.title}`,
      body,
      priority,
      pinned: data.action === 'published',
      author_id: userId,
    })

    if (error) {
      console.warn('[MEDIA HUB] Failed to create content activity alert:', error)
    }
  },

  async getMediaTeamMembers(): Promise<{ id: string; name: string; role: string }[]> {
    const { data } = await supabase
      .from('admins')
      .select('id, role, users!admins_id_fkey(full_name)')
      .in('role', MEDIA_ROLES)
      .order('role')

    return (
      (data as unknown as {
        id: string
        role: string
        users: { full_name: string | null } | { full_name: string | null }[] | null
      }[]) ?? []
    ).map((u) => {
      const profile = Array.isArray(u.users) ? u.users[0] : u.users
      return {
        id: u.id,
        name: profile?.full_name ?? 'Unknown',
        role: u.role,
      }
    })
  },

  // ── Member submissions (inbox) ──

  async getInboxSubmissions(): Promise<WallSubmission[]> {
    const { data } = await supabase
      .from('media_wall_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!data?.length) return []

    const userMap = await resolveUserNames(data.map((s) => s.author_id))
    return data.map((s) => ({
      ...s,
      author_name: userMap.get(s.author_id)?.full_name,
      author_avatar: userMap.get(s.author_id)?.avatar_url ?? undefined,
    }))
  },

  async updateSubmissionStatus(id: string, status: WallSubmission['status']): Promise<boolean> {
    const { error } = await supabase.from('media_wall_submissions').update({ status }).eq('id', id)
    if (error) console.error('updateSubmissionStatus error:', error)
    return !error
  },

  // ── Member comms tags (front-end Media / Mobilization members) ──

  async getCommsMembers(): Promise<CommsMember[]> {
    const { data: rows } = await supabase.from('member_comms_roles').select('user_id, role')
    if (!rows?.length) return []

    const byUser = new Map<string, CommsRole[]>()
    for (const r of rows) {
      const list = byUser.get(r.user_id) ?? []
      list.push(r.role as CommsRole)
      byUser.set(r.user_id, list)
    }

    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name, registration_number, platform')
      .in('id', [...byUser.keys()])

    return (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? 'Unknown',
      registration_number: p.registration_number,
      platform: p.platform,
      roles: byUser.get(p.id) ?? [],
    }))
  },

  async searchMembers(query: string): Promise<CommsMember[]> {
    const q = query.trim()
    if (q.length < 2) return []
    const { data } = await supabase
      .from('users')
      .select('id, full_name, registration_number, platform')
      .or(`full_name.ilike.%${q}%,registration_number.ilike.%${q}%`)
      .limit(15)
    if (!data?.length) return []

    const { data: roleRows } = await supabase
      .from('member_comms_roles')
      .select('user_id, role')
      .in(
        'user_id',
        data.map((d) => d.id)
      )
    const byUser = new Map<string, CommsRole[]>()
    for (const r of roleRows ?? []) {
      const list = byUser.get(r.user_id) ?? []
      list.push(r.role as CommsRole)
      byUser.set(r.user_id, list)
    }

    return data.map((p) => ({
      id: p.id,
      name: p.full_name ?? 'Unknown',
      registration_number: p.registration_number,
      platform: p.platform,
      roles: byUser.get(p.id) ?? [],
    }))
  },

  async assignCommsRole(userId: string, role: CommsRole): Promise<boolean> {
    const actorId = await getCurrentUserId()
    const { error } = await supabase
      .from('member_comms_roles')
      .upsert({ user_id: userId, role, assigned_by: actorId }, { onConflict: 'user_id,role' })
    if (error) console.error('assignCommsRole error:', error)
    return !error
  },

  async removeCommsRole(userId: string, role: CommsRole): Promise<boolean> {
    const { error } = await supabase
      .from('member_comms_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)
    if (error) console.error('removeCommsRole error:', error)
    return !error
  },
}
