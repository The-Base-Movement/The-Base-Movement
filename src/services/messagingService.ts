// src/services/messagingService.ts
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Conversation,
  ConversationLeaderInfo,
  ConversationSummary,
  Message,
} from '@/types/admin'

class MessagingService {
  private static instance: MessagingService
  private constructor() {}

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) MessagingService.instance = new MessagingService()
    return MessagingService.instance
  }

  /**
   * Returns the existing conversation for this member, or creates one by
   * resolving their leader. Returns null if no leader can be found.
   */
  async getOrCreateConversation(memberUserId: string): Promise<Conversation | null> {
    // 1. Return existing conversation if present
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('member_id', memberUserId)
      .maybeSingle()
    if (existing) return existing as Conversation

    // 2. Fetch member platform + scope fields
    const { data: member } = await supabase
      .from('users')
      .select('platform, region, constituency, chapter')
      .eq('id', memberUserId)
      .single()
    if (!member) return null

    // 3. Resolve leader
    const leaderId = await this.resolveLeader(
      member.platform as string,
      member.region as string | null,
      member.chapter as string | null
    )
    if (!leaderId) return null

    // 4. Determine scope_type and scope_value
    const scope_type: Conversation['scope_type'] =
      member.platform === 'GHANA' ? 'region' : 'chapter'
    const scope_value: string =
      member.platform === 'GHANA'
        ? ((member.region as string | null) ?? 'Ghana')
        : ((member.chapter as string | null) ?? 'Diaspora')

    // 5. Create conversation (RLS enforces member_id = auth.uid())
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ member_id: memberUserId, leader_id: leaderId, scope_type, scope_value })
      .select()
      .single()
    if (error) {
      console.warn('[MessagingService] createConversation failed:', error)
      return null
    }
    return created as Conversation
  }

  private async resolveLeader(
    platform: string,
    region: string | null,
    chapter: string | null
  ): Promise<string | null> {
    if (platform === 'GHANA' && region) {
      // Step 1: CONSTITUENCY_LEAD for this region
      const { data: cl } = await supabase
        .from('admins')
        .select('id')
        .eq('role', 'CONSTITUENCY_LEAD')
        .eq('assigned_region', region)
        .limit(1)
        .maybeSingle()
      if (cl) return (cl as { id: string }).id

      // Step 2: REGIONAL_DIRECTOR for this region
      const { data: rd } = await supabase
        .from('admins')
        .select('id')
        .eq('role', 'REGIONAL_DIRECTOR')
        .eq('assigned_region', region)
        .limit(1)
        .maybeSingle()
      if (rd) return (rd as { id: string }).id
    }

    if (platform === 'DIASPORA' && chapter) {
      // Step 3: CHAPTER_LEAD for this chapter
      const { data: chl } = await supabase
        .from('admins')
        .select('id')
        .eq('role', 'CHAPTER_LEAD')
        .eq('chapter', chapter)
        .limit(1)
        .maybeSingle()
      if (chl) return (chl as { id: string }).id
    }

    // Step 4: HQ fallback — any ORGANIZER or EXECUTIVE
    const { data: hq } = await supabase
      .from('admins')
      .select('id')
      .in('role', ['ORGANIZER', 'EXECUTIVE'])
      .limit(1)
      .maybeSingle()
    return hq ? (hq as { id: string }).id : null
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
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
    return data as Message
  }

  /** Fetch all messages for a conversation, chronological order */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
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
    return () => {
      void supabase.removeChannel(channel)
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
    await supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId)
  }

  /** Fetch the leader's display info for the conversation header */
  async getLeaderInfo(leaderId: string): Promise<ConversationLeaderInfo | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('id, full_name, role, avatar_url')
      .eq('id', leaderId)
      .single()
    if (error) return null
    return data as ConversationLeaderInfo
  }
}

export const messagingService = MessagingService.getInstance()
