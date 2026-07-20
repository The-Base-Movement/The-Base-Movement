// src/services/messagingService.ts
import { supabase } from '@/lib/supabase'
import { getPublicDirectoryProfiles } from '@/lib/publicDirectory'
import {
  getDepartmentCatalogRow,
  getDepartmentCatalogRows,
  type DepartmentCatalogRow,
} from '@/lib/departmentCatalog'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Conversation,
  ConversationLeaderInfo,
  ConversationSummary,
  Message,
} from '@/types/admin'

class MessagingService {
  private static instance: MessagingService
  private channels = new Map<string, RealtimeChannel>()
  private constructor() {}

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) MessagingService.instance = new MessagingService()
    return MessagingService.instance
  }

  /**
   * Returns all conversations for this member (one per scope type),
   * creating any that are missing. Returns [] if no leaders found.
   */
  async getOrCreateConversations(memberUserId: string): Promise<Conversation[]> {
    // 1. Return all existing conversations
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('member_id', memberUserId)
      .order('created_at', { ascending: true })
    if (existing && existing.length > 0) return existing as Conversation[]

    // 2. Fetch member scope fields
    const { data: member } = await supabase
      .from('users')
      .select('platform, region, constituency, chapter')
      .eq('id', memberUserId)
      .single()
    if (!member) return []

    const results: Conversation[] = []

    if (member.platform === 'GHANA') {
      // Ghana members → constituency conversation only
      const leaderId = await this.resolveConstituencyLeader(
        member.constituency as string | null,
        member.region as string | null
      )
      if (leaderId) {
        const conv = await this.insertConversation(
          memberUserId,
          leaderId,
          'constituency',
          (member.constituency as string | null) ?? (member.region as string | null) ?? 'Ghana'
        )
        if (conv) results.push(conv)
      }
    } else if (member.platform === 'DIASPORA') {
      // Diaspora members → chapter conversation only
      const leaderId = await this.resolveChapterLeader(member.chapter as string | null)
      if (leaderId) {
        const conv = await this.insertConversation(
          memberUserId,
          leaderId,
          'chapter',
          (member.chapter as string | null) ?? 'Diaspora'
        )
        if (conv) results.push(conv)
      }
    }

    // HQ fallback if no leader found for this member's platform
    if (results.length === 0) {
      const leaderId = await this.resolveHQLeader()
      if (leaderId) {
        const scopeType: Conversation['scope_type'] =
          member.platform === 'DIASPORA' ? 'chapter' : 'constituency'
        const conv = await this.insertConversation(
          memberUserId,
          leaderId,
          scopeType,
          member.platform === 'DIASPORA' ? 'Diaspora' : 'Ghana'
        )
        if (conv) results.push(conv)
      }
    }

    return results
  }

  private async resolveConstituencyLeader(
    constituency: string | null,
    region: string | null
  ): Promise<string | null> {
    // Source of truth: appointed lead on the constituency record
    if (constituency) {
      const { data: gc } = await supabase
        .from('ghana_constituencies')
        .select('leader_id')
        .eq('name', constituency)
        .not('leader_id', 'is', null)
        .limit(1)
        .maybeSingle()
      if (gc?.leader_id) return gc.leader_id as string
    }

    // Fallback: provisioned admins for the region
    if (region) {
      const { data: cl } = await supabase
        .from('admins')
        .select('id')
        .in('role', ['CONSTITUENCY_LEAD', 'REGIONAL_DIRECTOR'])
        .eq('assigned_region', region)
        .limit(1)
        .maybeSingle()
      if (cl) return (cl as { id: string }).id
    }
    return null
  }

  private async resolveChapterLeader(chapter: string | null): Promise<string | null> {
    if (!chapter) return null

    // Source of truth: appointed lead on the chapter record
    const { data: ch } = await supabase
      .from('chapters')
      .select('leader_id')
      .eq('name', chapter)
      .not('leader_id', 'is', null)
      .limit(1)
      .maybeSingle()
    if (ch?.leader_id) return ch.leader_id as string

    // Fallback: provisioned Base Diaspora lead admin
    const { data: chl } = await supabase
      .from('admins')
      .select('id')
      .eq('role', 'BASE_DIASPORA_LEAD')
      .eq('chapter', chapter)
      .limit(1)
      .maybeSingle()
    return chl ? (chl as { id: string }).id : null
  }

  private async resolveDepartmentLeader(departmentId: string): Promise<string | null> {
    const { data: dept, error } = await supabase
      .from('helpdesk_departments')
      .select('id, lead_id, handler_roles')
      .eq('id', departmentId)
      .maybeSingle()

    if (!dept) {
      console.warn(
        '[MessagingService] resolveDepartmentLeader failed: department missing',
        departmentId,
        error
      )
      return null
    }

    if (dept.lead_id) return dept.lead_id as string

    const handlerRoles = (
      (dept as unknown as { handler_roles?: string[] }).handler_roles ?? []
    ).filter(Boolean)
    if (handlerRoles.length === 0) return null

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .in('role', handlerRoles)
      .limit(1)
      .maybeSingle()
    return admin ? (admin as { id: string }).id : null
  }

  private async resolveHQLeader(): Promise<string | null> {
    const { data: hq } = await supabase
      .from('admins')
      .select('id')
      .in('role', ['ORGANIZER', 'EXECUTIVE'])
      .limit(1)
      .maybeSingle()
    return hq ? (hq as { id: string }).id : null
  }

  private async insertConversation(
    memberId: string,
    leaderId: string,
    scopeType: Conversation['scope_type'],
    scopeValue: string
  ): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        member_id: memberId,
        leader_id: leaderId,
        scope_type: scopeType,
        scope_value: scopeValue,
      })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') {
        const { data: ex } = await supabase
          .from('conversations')
          .select('*')
          .eq('member_id', memberId)
          .eq('scope_type', scopeType)
          .maybeSingle()
        return ex as Conversation | null
      }
      console.warn('[MessagingService] insertConversation failed:', error)
      return null
    }
    return data as Conversation
  }

  /**
   * Check if a member can send a message (anti-flood: no unreplied messages).
   * Returns null if they can send, or an error message if blocked.
   */
  async checkCanSendMessage(conversationId: string, senderId: string): Promise<string | null> {
    // Get conversation to check if it's a 1-to-1 or group
    const { data: conv } = await supabase
      .from('conversations')
      .select('member_id, scope_type')
      .eq('id', conversationId)
      .maybeSingle()

    if (!conv) return 'Conversation not found'

    // Only enforce anti-flood on 1-to-1 member conversations with leaders
    if (
      conv.member_id !== senderId ||
      !['constituency', 'chapter', 'department'].includes(conv.scope_type)
    )
      return null

    // Check if member has any unread/unreplied messages from the leader
    const { data: unreplied } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'leader')
      .is('read_at', null)
      .limit(1)

    if (unreplied && unreplied.length > 0) {
      return 'Please reply to the previous message before sending a new one'
    }

    return null
  }

  /** Insert a message and bump last_message_at on the conversation */
  async sendMessage(
    conversationId: string,
    content: string,
    senderType: 'member' | 'leader',
    senderId: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        content,
      })
      .select()
      .single()
    if (error) {
      console.warn('[MessagingService] sendMessage failed:', error)
      return null
    }
    // last_message_at is bumped by DB trigger update_conversation_last_message_at() — no client update needed

    // Notify the other party — fire and forget
    ;(async () => {
      try {
        const { data: convo } = await supabase
          .from('conversations')
          .select('member_id, leader_id')
          .eq('id', conversationId)
          .single()
        if (!convo) return
        const recipientId = senderType === 'member' ? convo.leader_id : convo.member_id
        if (recipientId) {
          const preview = content.length > 80 ? content.slice(0, 80) + '…' : content
          await supabase.from('notifications').insert({
            user_id: recipientId,
            type: 'message',
            title: 'New message',
            message: preview,
            link: '/dashboard/messages',
          })
          // ponytail: reuse existing send-push-notification edge fn
          supabase.functions
            .invoke('send-push-notification', {
              body: {
                userIds: [recipientId],
                title: 'New message',
                body: preview,
                url: '/dashboard/messages',
              },
            })
            .catch(() => {})
        }
      } catch {
        // non-critical
      }
    })()

    return data as Message
  }

  /** Fetch all messages for a conversation, chronological order */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gt('expires_at', new Date().toISOString()) // Filter out expired messages (older than 30 days)
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[MessagingService] getMessages failed:', error)
      return []
    }
    return (data ?? []) as Message[]
  }

  /**
   * Subscribe to new messages in a conversation via Supabase Realtime.
   * Returns an unsubscribe function — call it on component unmount.
   */
  subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void): () => void {
    // Clean up any existing channel for this conversation (guards against React Strict Mode double-invoke)
    const existing = this.channels.get(conversationId)
    if (existing) {
      void supabase.removeChannel(existing)
      this.channels.delete(conversationId)
    }

    const channel: RealtimeChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message)
        }
      )
      .subscribe()

    this.channels.set(conversationId, channel)

    return () => {
      void supabase.removeChannel(channel)
      this.channels.delete(conversationId)
    }
  }

  /**
   * Mark all unread messages FROM the other party as read.
   * readerType = 'member' → marks leader-sent messages as read, and vice versa.
   */
  async markAsRead(conversationId: string, readerType: 'member' | 'leader'): Promise<void> {
    const senderType = readerType === 'member' ? 'leader' : 'member'
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_type', senderType)
      .is('read_at', null)
  }

  /** Admin side: all conversations for this leader with unread counts */
  async getLeaderConversations(leaderAdminId: string): Promise<ConversationSummary[]> {
    // TODO: v2 — replace with DB view for unread counts at scale (current join fetches all messages per conversation)
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `*,
        member:users!member_id(id, full_name, registration_number, avatar_url),
        messages(id, content, sender_type, read_at, created_at)`
      )
      .eq('leader_id', leaderAdminId)
      .order('last_message_at', { ascending: false })
    if (error) {
      console.warn('[MessagingService] getLeaderConversations failed:', error)
      return []
    }
    return (data ?? []).map((row) => {
      const msgs = (row.messages as Message[]) ?? []
      const unread_count = msgs.filter(
        (m) => m.sender_type === 'member' && m.read_at === null
      ).length
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      return {
        id: row.id,
        member_id: row.member_id,
        leader_id: row.leader_id,
        scope_type: row.scope_type as Conversation['scope_type'],
        scope_value: row.scope_value,
        status: row.status as Conversation['status'],
        created_at: row.created_at,
        last_message_at: row.last_message_at,
        member: row.member as ConversationSummary['member'],
        unread_count,
        last_message_content: sorted.at(-1)?.content ?? '',
      } as ConversationSummary
    })
  }

  /** Total unread leader-sent messages across all of a member's conversations */
  async getMemberUnreadTotal(memberId: string): Promise<number> {
    const { count } = await supabase
      .from('messages')
      .select('id, conversations!inner(member_id)', { count: 'exact', head: true })
      .eq('sender_type', 'leader')
      .is('read_at', null)
      .eq('conversations.member_id', memberId)
    return count ?? 0
  }

  /** Total unread member-sent messages across all of a leader's conversations
   *
   * TODO: v2 — Replace with materialized DB view for scale
   * Current approach: joins all messages for a leader (inefficient at 1M+ message volumes)
   * v2 approach: Create view unread_message_counts_by_leader with:
   *   - leader_id, conversation_id, unread_count (updated via trigger on messages table)
   *   - Index on leader_id for fast lookup
   *   - Refreshed on each INSERT/UPDATE/DELETE to messages where read_at changes
   * Benefits: O(1) lookup instead of O(n) join; eliminates per-request full table scans
   * Implementation guide: see docs/database/views-and-triggers.md (to be created)
   */
  async getLeaderUnreadTotal(leaderId: string): Promise<number> {
    const { count } = await supabase
      .from('messages')
      .select('id, conversations!inner(leader_id)', { count: 'exact', head: true })
      .eq('sender_type', 'member')
      .is('read_at', null)
      .eq('conversations.leader_id', leaderId)
    return count ?? 0
  }

  /** Count unread messages for the given reader in a conversation */
  async getUnreadCount(conversationId: string, readerType: 'member' | 'leader'): Promise<number> {
    const senderType = readerType === 'member' ? 'leader' : 'member'
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', senderType)
      .is('read_at', null)
    return count ?? 0
  }

  /** Close a conversation — RLS allows only the leader to do this */
  async closeConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId)
    if (error) console.warn('[MessagingService] closeConversation failed:', error)
  }

  /**
   * Fetch the leader's display info for the conversation header.
   * Name/avatar come from users; role from admins if provisioned,
   * otherwise derived from the conversation scope.
   */
  async getLeaderInfo(
    leaderId: string,
    scopeType?: Conversation['scope_type']
  ): Promise<ConversationLeaderInfo | null> {
    const [[profile], { data: admin }] = await Promise.all([
      getPublicDirectoryProfiles([leaderId]),
      supabase.from('admins').select('role').eq('id', leaderId).maybeSingle(),
    ])
    if (!profile) return null
    const fallbackRole = scopeType === 'chapter' ? 'BASE_DIASPORA_LEAD' : 'CONSTITUENCY_LEAD'
    return {
      id: profile.id as string,
      full_name: (profile.full_name as string | null) ?? 'Leader',
      role: ((admin as { role?: string } | null)?.role as string | undefined) ?? fallbackRole,
      avatar_url: (profile.avatar_url as string | null) ?? null,
    }
  }

  /**
   * Get all available departments for a member to message.
   * Returns departments with their lead info.
   */
  async getDepartments(): Promise<
    Array<{
      id: string
      name: string
      icon: string
      lead_id: string | null
      lead_name: string | null
      lead_avatar: string | null
    }>
  > {
    interface DepartmentRow {
      id: string
      name: string
      icon: string
      lead_id: string | null
    }

    const { data, error } = await supabase
      .from('helpdesk_departments')
      .select('id, name, icon, lead_id')
      .order('name', { ascending: true })

    if (error) {
      console.warn('[MessagingService] getDepartments failed:', error)
      return []
    }

    const leadMap = new Map(
      (
        await getPublicDirectoryProfiles(
          ((data as DepartmentRow[] | null) ?? [])
            .map((dept) => dept.lead_id)
            .filter(Boolean) as string[]
        )
      ).map((profile) => [profile.id, profile])
    )

    return ((data as unknown as DepartmentRow[] | null) ?? []).map((dept) => ({
      id: dept.id,
      name: dept.name,
      icon: dept.icon,
      lead_id: dept.lead_id,
      lead_name: (dept.lead_id && leadMap.get(dept.lead_id)?.full_name) ?? null,
      lead_avatar: (dept.lead_id && leadMap.get(dept.lead_id)?.avatar_url) ?? null,
    }))
  }

  /**
   * Get or create a conversation with a department.
   * One conversation per member-department pair.
   */
  async getOrCreateDepartmentConversation(
    memberUserId: string,
    departmentId: string
  ): Promise<Conversation | null> {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('member_id', memberUserId)
      .eq('department_id', departmentId)
      .eq('scope_type', 'department')
      .maybeSingle()

    if (existing) return existing as Conversation

    // Get department info and resolve a leader to route the conversation to.
    const { data: dept } = await supabase
      .from('helpdesk_departments')
      .select('id, name, lead_id')
      .eq('id', departmentId)
      .maybeSingle()

    if (!dept) {
      console.warn('[MessagingService] Department not found:', departmentId)
      return null
    }

    const leaderId = dept.lead_id ?? (await this.resolveDepartmentLeader(departmentId))
    if (!leaderId) {
      console.warn('[MessagingService] Department has no lead or matching handler:', departmentId)
      return null
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        member_id: memberUserId,
        leader_id: leaderId,
        scope_type: 'department',
        scope_value: dept.name,
        department_id: departmentId,
      })
      .select()
      .single()

    if (error) {
      console.warn('[MessagingService] Failed to create department conversation:', error)
      return null
    }

    return newConv as Conversation
  }

  /**
   * Get department info for display in conversation header.
   */
  async getDepartmentInfo(departmentId: string): Promise<ConversationLeaderInfo | null> {
    interface DeptRow {
      id: string
      name: string
      icon: string
      lead_id: string | null
    }

    const { data: dept } = await supabase
      .from('helpdesk_departments')
      .select('id, name, icon, lead_id')
      .eq('id', departmentId)
      .maybeSingle()

    if (!dept) return null

    const deptData = dept as unknown as DeptRow
    const [leadProfile] = deptData.lead_id
      ? await getPublicDirectoryProfiles([deptData.lead_id])
      : []
    return {
      id: deptData.id,
      full_name: deptData.name,
      role: 'DEPARTMENT',
      avatar_url: leadProfile?.avatar_url ?? null,
    }
  }

  /**
   * Get or create a group conversation for a constituency or chapter forum.
   * All members of that constituency/chapter can read and write.
   */
  async getOrCreateGroupConversation(
    groupType: 'constituency' | 'chapter',
    groupId: string,
    groupName: string,
    leaderId: string
  ): Promise<Conversation | null> {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('group_type', groupType)
      .eq('group_id', groupId)
      .maybeSingle()

    if (existing) return existing as Conversation

    // Create new group conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        member_id: null,
        leader_id: leaderId,
        scope_type: `group_${groupType}` as unknown as Conversation['scope_type'],
        scope_value: groupName,
        group_type: groupType,
        group_id: groupId,
      })
      .select()
      .single()

    if (error) {
      console.warn('[MessagingService] Failed to create group conversation:', error)
      return null
    }

    return newConv as Conversation
  }

  /**
   * Get all group conversations a member can access
   * (based on their constituency/chapter). Creates forums if they don't exist.
   */
  async getMemberGroupConversations(memberId: string): Promise<Conversation[]> {
    // Get member's constituency and chapter, plus their scope info
    const { data: member } = await supabase
      .from('users')
      .select('id, constituency, chapter, platform')
      .eq('id', memberId)
      .single()

    if (!member) return []

    const results: Conversation[] = []

    // Handle constituency forum for Ghana network members
    if (member.constituency) {
      // Get constituency ID and lead
      const { data: constituency } = await supabase
        .from('ghana_constituencies')
        .select('id, leader_id')
        .eq('name', member.constituency)
        .maybeSingle()

      if (constituency?.id && constituency?.leader_id) {
        // Get or create forum (pass UUID, not name)
        const forum = await this.getOrCreateGroupConversation(
          'constituency',
          constituency.id,
          member.constituency,
          constituency.leader_id
        )
        if (forum) {
          await this.addGroupConversationMember(forum.id, memberId)
          results.push(forum)
        }
      }
    }

    // Handle chapter forum for Diaspora network members
    if (member.chapter) {
      // Get chapter ID and lead
      const { data: chapter } = await supabase
        .from('chapters')
        .select('id, leader_id')
        .eq('name', member.chapter)
        .maybeSingle()

      if (chapter?.id && chapter?.leader_id) {
        // Get or create forum (pass UUID, not name)
        const forum = await this.getOrCreateGroupConversation(
          'chapter',
          chapter.id,
          member.chapter,
          chapter.leader_id
        )
        if (forum) {
          await this.addGroupConversationMember(forum.id, memberId)
          results.push(forum)
        }
      }
    }

    return results
  }

  /**
   * Add a member to a group conversation (called on signup/assignment)
   */
  async addGroupConversationMember(
    conversationId: string,
    userId: string,
    role: 'member' | 'moderator' = 'member'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('group_conversation_members')
      .upsert(
        {
          conversation_id: conversationId,
          user_id: userId,
          role,
        },
        {
          onConflict: 'conversation_id, user_id',
          ignoreDuplicates: true,
        }
      )
      .select()

    if (error) {
      console.warn('[MessagingService] Failed to add group member:', error)
      return false
    }

    return true
  }

  /**
   * Get all members of a group conversation
   */
  async getGroupConversationMembers(conversationId: string): Promise<
    Array<{
      id: string
      user_id: string
      name: string
      avatar_url: string | null
      role: 'member' | 'moderator'
      joined_at: string
    }>
  > {
    interface GroupMemberRow {
      id: string
      user_id: string
      role: 'member' | 'moderator'
      joined_at: string
      users: { full_name: string; avatar_url: string | null } | null
    }

    const { data } = await supabase
      .from('group_conversation_members')
      .select(
        `
        id,
        user_id,
        role,
        joined_at,
        users!user_id (
          full_name,
          avatar_url
        )
      `
      )
      .eq('conversation_id', conversationId)
      .order('joined_at', { ascending: true })

    if (!data) return []

    return (data as unknown as GroupMemberRow[]).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      name: m.users?.full_name ?? 'Member',
      avatar_url: m.users?.avatar_url ?? null,
      role: m.role,
      joined_at: m.joined_at,
    }))
  }

  /**
   * Delete a message (for moderators only - handled by RLS)
   */
  async deleteMessage(messageId: string, deletedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_by: deletedBy,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) {
      console.warn('[MessagingService] Failed to delete message:', error)
      return false
    }

    return true
  }

  /**
   * Flag a message for review (member or moderator action)
   */
  async flagMessage(messageId: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_flagged: true,
        flagged_reason: reason,
      })
      .eq('id', messageId)

    if (error) {
      console.warn('[MessagingService] Failed to flag message:', error)
      return false
    }

    return true
  }

  async getDepartmentDashboard(deptId: string): Promise<{
    dept: Record<string, unknown> | null
    stats: {
      open: number
      inProgress: number
      urgentOpen: number
      unassigned: number
      resolved30d: number
      total: number
    }
  }> {
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
    const base = () =>
      supabase
        .from('helpdesk_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', deptId)

    const [{ data: deptRow }, open, inProgress, urgentOpen, unassigned, resolved30d, total] =
      await Promise.all([
        supabase.from('helpdesk_departments').select('*').eq('id', deptId).maybeSingle(),
        base().eq('status', 'open'),
        base().eq('status', 'in-progress'),
        base().in('status', ['open', 'in-progress']).in('priority', ['urgent', 'high']),
        base().in('status', ['open', 'in-progress']).is('assigned_to', null),
        base().eq('status', 'resolved').gte('updated_at', since30d),
        base(),
      ])
    const catalogRow = getDepartmentCatalogRow(deptId)
    return {
      dept: catalogRow
        ? ({ ...catalogRow, ...(deptRow as Partial<DepartmentCatalogRow> | null) } as Record<
            string,
            unknown
          >)
        : ((deptRow as Record<string, unknown> | null) ?? null),
      stats: {
        open: open.count ?? 0,
        inProgress: inProgress.count ?? 0,
        urgentOpen: urgentOpen.count ?? 0,
        unassigned: unassigned.count ?? 0,
        resolved30d: resolved30d.count ?? 0,
        total: total.count ?? 0,
      },
    }
  }

  // Dedicated lookup of the Movement Management secretary from its
  // helpdesk_departments row (id 'movement_management' — matches the catalog id
  // and the assign/revoke RPCs).
  async getMovementSecretaryId(): Promise<string | null> {
    const { data } = await supabase
      .from('helpdesk_departments')
      .select('secretary_id')
      .eq('id', 'movement_management')
      .maybeSingle()
    return (data as { secretary_id: string | null } | null)?.secretary_id ?? null
  }

  async getUserProfile(
    userId: string
  ): Promise<{ id: string; full_name: string; avatar_url: string | null } | null> {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    return data as { id: string; full_name: string; avatar_url: string | null } | null
  }

  async getAdminOptions(): Promise<{ id: string; role: string; full_name: string }[]> {
    const { data } = await supabase.from('admins').select('id, role, users(full_name)')
    const rows = (data ?? []) as unknown as {
      id: string
      role: string
      users: { full_name: string | null } | null
    }[]
    return rows
      .map((r) => ({ id: r.id, role: r.role, full_name: r.users?.full_name ?? 'Unknown' }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }

  async updateDepartmentLead(deptId: string, leadId: string | null): Promise<void> {
    const { error } = await supabase
      .from('helpdesk_departments')
      .update({ lead_id: leadId })
      .eq('id', deptId)
    if (error) throw error
  }

  async getDepartmentsWithOpenTickets(): Promise<{
    departments: { id: string; name: string; icon: string; sort_order: number }[]
    openCounts: Record<string, number>
  }> {
    const [{ data: depts }, { data: tickets }] = await Promise.all([
      supabase
        .from('helpdesk_departments')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('helpdesk_tickets')
        .select('department_id')
        .in('status', ['open', 'in-progress']),
    ])
    const counts: Record<string, number> = {}
    for (const t of (tickets ?? []) as { department_id: string }[]) {
      counts[t.department_id] = (counts[t.department_id] ?? 0) + 1
    }
    const departmentRowsById = new Map(
      ((depts ?? []) as Partial<DepartmentCatalogRow>[]).map((department) => [
        department.id,
        department,
      ])
    )
    const departments = getDepartmentCatalogRows().map((department) => ({
      ...department,
      ...(departmentRowsById.get(department.id) ?? {}),
    }))
    return {
      departments,
      openCounts: counts,
    }
  }
}

export const messagingService = MessagingService.getInstance()
