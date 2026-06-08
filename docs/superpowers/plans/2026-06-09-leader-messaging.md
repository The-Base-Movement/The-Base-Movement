# Leader Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two-way real-time messaging between members and their assigned regional/constituency/chapter leader, accessible from `/dashboard/messages` (member) and `/admin/messages` (leader).

**Architecture:** A `conversations` table (one per member, UNIQUE on `member_id`) links to a `messages` table. Leader is resolved at first conversation creation by matching admin `role` + `assigned_region`/`chapter` to the member's profile. Supabase Realtime `postgres_changes` delivers live messages to both parties without polling.

**Tech Stack:** Supabase (Realtime postgres_changes, RLS), React 19 + TypeScript 5.9, custom CSS design system (inline styles, no Tailwind), Material Symbols icons, date-fns v4 (already installed).

**Spec:** `docs/superpowers/specs/2026-06-09-leader-messaging-design.md`

---

## File Map

| File                                                      | Action          | Responsibility                                                                   |
| --------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `supabase/migrations/20260609000001_leader_messaging.sql` | Create          | Tables, indexes, RLS, Realtime publication                                       |
| `src/types/admin.ts`                                      | Modify (append) | `Conversation`, `Message`, `ConversationSummary`, `ConversationLeaderInfo` types |
| `src/services/messagingService.ts`                        | Create          | All DB calls: resolve leader, CRUD, Realtime sub, markAsRead                     |
| `src/components/chat/ChatBubble.tsx`                      | Create          | Single chat message bubble with self/other styling                               |
| `src/components/chat/ChatInput.tsx`                       | Create          | Auto-grow textarea + send button                                                 |
| `src/pages/dashboard/Messages.tsx`                        | Create          | Member chat page: load/create conversation, thread, Realtime                     |
| `src/pages/admin/Messages.tsx`                            | Create          | Admin inbox list + thread panel, close action                                    |
| `src/routes.tsx`                                          | Modify          | Add two lazy imports + route entries                                             |
| `src/components/DashboardLayout/Sidebar.tsx`              | Modify          | Add Messages nav entry to Personal group                                         |
| `src/components/layouts/admin/navConfig.ts`               | Modify          | Add Messages nav entry to Members group                                          |

---

### Task 1: Database migration

**Files:**

- Create: `supabase/migrations/20260609000001_leader_messaging.sql`

- [ ] **Step 1: Create the migration file with this exact content**

```sql
-- Leader Messaging: conversations + messages tables with RLS
-- One conversation per member (UNIQUE member_id), resolved leader on first open.

CREATE TABLE IF NOT EXISTS public.conversations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        uuid        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  leader_id        uuid        NOT NULL REFERENCES public.admins(id) ON DELETE RESTRICT,
  scope_type       text        NOT NULL CHECK (scope_type IN ('region', 'constituency', 'chapter')),
  scope_value      text        NOT NULL,
  status           text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_message_at  timestamptz
);

CREATE TABLE IF NOT EXISTS public.messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type      text        NOT NULL CHECK (sender_type IN ('member', 'leader')),
  sender_id        uuid        NOT NULL,
  content          text        NOT NULL CHECK (char_length(content) > 0),
  read_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_leader_id
  ON public.conversations(leader_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON public.conversations(last_message_at DESC NULLS LAST);

-- Enable Supabase Realtime on messages (for live delivery)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- conversations: both parties can read
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR leader_id = auth.uid());

-- conversations: member creates (their own uid only)
CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

-- conversations: leader closes (status update)
CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING  (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid());

-- messages: both parties can read messages in their conversations
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
    )
  );

-- messages: sender inserts their own message into an open conversation
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
        AND c.status = 'open'
    )
  );

-- messages: both parties can update read_at (mark as read)
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
    )
  );
```

- [ ] **Step 2: Apply migration to Supabase remote**

```bash
supabase db push
```

Expected: no errors. Verify at Supabase dashboard → Table Editor that `conversations` and `messages` tables now appear.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260609000001_leader_messaging.sql
git commit -m "feat: add conversations and messages tables with RLS"
```

---

### Task 2: TypeScript types

**Files:**

- Modify: `src/types/admin.ts` (append at end of file)

- [ ] **Step 1: Append these type definitions to the end of `src/types/admin.ts`**

```ts
// ─── Leader Messaging ────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  member_id: string
  leader_id: string
  scope_type: 'region' | 'constituency' | 'chapter'
  scope_value: string
  status: 'open' | 'closed'
  created_at: string
  last_message_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'member' | 'leader'
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export interface ConversationSummary extends Conversation {
  unread_count: number
  last_message_content: string
  member: {
    id: string
    full_name: string
    registration_number: string
    avatar_url: string | null
  } | null
}

export interface ConversationLeaderInfo {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/admin.ts
git commit -m "feat: add Conversation, Message, ConversationSummary types"
```

---

### Task 3: messagingService.ts

**Files:**

- Create: `src/services/messagingService.ts`

- [ ] **Step 1: Create the service with this exact content**

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/messagingService.ts
git commit -m "feat: add messagingService with leader resolution and Realtime"
```

---

### Task 4: Shared chat components

**Files:**

- Create: `src/components/chat/ChatBubble.tsx`
- Create: `src/components/chat/ChatInput.tsx`

- [ ] **Step 1: Create `src/components/chat/ChatBubble.tsx`**

```tsx
// src/components/chat/ChatBubble.tsx
import { formatDistanceToNow } from 'date-fns'

interface ChatBubbleProps {
  content: string
  senderType: 'member' | 'leader'
  isSelf: boolean // true when this bubble belongs to the current logged-in user
  timestamp: string
  senderName?: string // shown above the bubble when isSelf is false
}

export function ChatBubble({ content, isSelf, timestamp, senderName }: ChatBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        gap: 2,
        maxWidth: '72%',
        alignSelf: isSelf ? 'flex-end' : 'flex-start',
      }}
    >
      {senderName && !isSelf && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            paddingLeft: 4,
          }}
        >
          {senderName}
        </span>
      )}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: isSelf ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isSelf ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
          color: isSelf ? '#ffffff' : 'hsl(var(--on-surface))',
          fontSize: 13.5,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        }}
      >
        {content}
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          paddingLeft: isSelf ? 0 : 4,
          paddingRight: isSelf ? 4 : 0,
        }}
      >
        {timeAgo}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/chat/ChatInput.tsx`**

```tsx
// src/components/chat/ChatInput.tsx
import { useRef, useState } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message…',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-grow up to 3 rows (72px)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 72) + 'px'
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '12px 16px',
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: 13.5,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          background: 'hsl(var(--container-low))',
          boxSizing: 'border-box',
          outline: 'none',
          lineHeight: 1.5,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          send
        </span>
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ChatBubble.tsx src/components/chat/ChatInput.tsx
git commit -m "feat: add ChatBubble and ChatInput shared components"
```

---

### Task 5: Member dashboard messages page

**Files:**

- Create: `src/pages/dashboard/Messages.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
// src/pages/dashboard/Messages.tsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Conversation, ConversationLeaderInfo, Message } from '@/types/admin'

function roleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DashboardMessages() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [leaderInfo, setLeaderInfo] = useState<ConversationLeaderInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load or create conversation on mount
  useEffect(() => {
    if (!user) return
    void (async () => {
      const conv = await messagingService.getOrCreateConversation(user.id)
      setConversation(conv)
      if (conv) {
        const [msgs, leader] = await Promise.all([
          messagingService.getMessages(conv.id),
          messagingService.getLeaderInfo(conv.leader_id),
        ])
        setMessages(msgs)
        setLeaderInfo(leader)
        void messagingService.markAsRead(conv.id, 'member')
      }
      setLoading(false)
    })()
  }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return
    const unsub = messagingService.subscribeToMessages(conversation.id, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'leader') {
        void messagingService.markAsRead(conversation.id, 'member')
      }
    })
    return unsub
  }, [conversation])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!conversation || !user) return
    setSending(true)
    const msg = await messagingService.sendMessage(conversation.id, content, 'member', user.id)
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } else {
      const { toast } = await import('sonner')
      toast.error('Message not sent — try again')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="main" style={{ padding: '24px 20px' }}>
        <div className="panel" style={{ padding: 24 }}>
          <div
            style={{
              height: 40,
              background: 'hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              width: '40%',
              marginBottom: 12,
            }}
          />
          <div
            style={{
              height: 20,
              background: 'hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              width: '70%',
            }}
          />
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="main" style={{ padding: '24px 20px' }}>
        <div
          className="panel"
          style={{
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))' }}
          >
            mark_chat_unread
          </span>
          <p
            style={{
              fontSize: 15,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            No leader assigned yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              maxWidth: 340,
              margin: 0,
            }}
          >
            Your regional leader hasn&apos;t been assigned yet. Contact HQ at{' '}
            <a href="mailto:info@thebasemovement.com" style={{ color: 'hsl(var(--primary))' }}>
              info@thebasemovement.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  const isClosed = conversation.status === 'closed'
  const leaderInitial = leaderInfo?.full_name.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="main" style={{ padding: '24px 20px' }}>
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 140px)',
          minHeight: 400,
          overflow: 'hidden',
        }}
      >
        {/* Conversation header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {leaderInfo?.avatar_url ? (
            <img
              src={leaderInfo.avatar_url}
              alt={leaderInfo.full_name}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
              }}
            >
              {leaderInitial}
            </div>
          )}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {leaderInfo?.full_name ?? 'Your Leader'}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {leaderInfo ? roleLabel(leaderInfo.role) : ''}
              {conversation.scope_value ? ` — ${conversation.scope_value}` : ''}
            </p>
          </div>
          {isClosed && (
            <span className="pill pill-err" style={{ marginLeft: 'auto' }}>
              Closed
            </span>
          )}
        </div>

        {/* Messages scrollable area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
                marginTop: 32,
              }}
            >
              No messages yet. Send one to your leader!
            </p>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              content={msg.content}
              senderType={msg.sender_type}
              isSelf={msg.sender_type === 'member'}
              timestamp={msg.created_at}
              senderName={
                msg.sender_type === 'leader' ? (leaderInfo?.full_name ?? 'Leader') : undefined
              }
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar or closed banner */}
        {isClosed ? (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              textAlign: 'center',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            This conversation has been closed by your leader.
          </div>
        ) : (
          <ChatInput
            onSend={(content) => {
              void handleSend(content)
            }}
            disabled={sending}
            placeholder="Message your leader…"
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/dashboard/Messages.tsx
git commit -m "feat: add member dashboard messages page"
```

---

### Task 6: Admin messages page

**Files:**

- Create: `src/pages/admin/Messages.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
// src/pages/admin/Messages.tsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Conversation, ConversationSummary, Message } from '@/types/admin'

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AdminMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load all conversations for this leader on mount
  useEffect(() => {
    if (!user) return
    void (async () => {
      const convs = await messagingService.getLeaderConversations(user.id)
      setConversations(convs)
      setLoading(false)
    })()
  }, [user])

  // Load thread when active conversation changes
  useEffect(() => {
    if (!activeConv) return
    void (async () => {
      const msgs = await messagingService.getMessages(activeConv.id)
      setMessages(msgs)
      void messagingService.markAsRead(activeConv.id, 'leader')
      // Clear unread badge in the list
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
      )
    })()
  }, [activeConv?.id])

  // Realtime on active conversation
  useEffect(() => {
    if (!activeConv) return
    const unsub = messagingService.subscribeToMessages(activeConv.id, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'member') {
        void messagingService.markAsRead(activeConv.id, 'leader')
      }
    })
    return unsub
  }, [activeConv?.id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!activeConv || !user) return
    setSending(true)
    const msg = await messagingService.sendMessage(activeConv.id, content, 'leader', user.id)
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } else {
      const { toast } = await import('sonner')
      toast.error('Message not sent — try again')
    }
    setSending(false)
  }

  const handleClose = async () => {
    if (!activeConv) return
    await messagingService.closeConversation(activeConv.id)
    const closed: Conversation['status'] = 'closed'
    setActiveConv((prev) => (prev ? { ...prev, status: closed } : prev))
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: closed } : c))
    )
  }

  const memberInitial = (name: string | undefined | null) =>
    name ? name.trim().charAt(0).toUpperCase() : '?'

  return (
    <div className="main" style={{ padding: '24px 20px' }}>
      {/* Page header */}
      <div className="ph" style={{ marginBottom: 20 }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Messages
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>
            Member conversations in your scope
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div
        className="sidebar-main"
        style={{ height: 'calc(100vh - 180px)', minHeight: 400, alignItems: 'stretch' }}
      >
        {/* Left: conversation list */}
        <aside
          className="panel"
          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid hsl(var(--border))',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {loading
              ? 'Loading…'
              : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.map((conv) => {
              const isActive = activeConv?.id === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConv(conv)
                    setMessages([])
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: isActive ? 'hsl(var(--container-low))' : 'transparent',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid hsl(var(--border))',
                    borderRadius: 0,
                  }}
                >
                  {conv.member?.avatar_url ? (
                    <img
                      src={conv.member.avatar_url}
                      alt={conv.member.full_name}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        flexShrink: 0,
                      }}
                    >
                      {memberInitial(conv.member?.full_name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.member?.full_name ?? 'Member'}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {formatRelative(conv.last_message_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span className="pill pill-mute" style={{ fontSize: 9, padding: '1px 6px' }}>
                        {conv.scope_value}
                      </span>
                      {conv.status === 'closed' && (
                        <span className="pill pill-err" style={{ fontSize: 9, padding: '1px 6px' }}>
                          Closed
                        </span>
                      )}
                    </div>
                    {conv.last_message_content && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {conv.last_message_content}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'hsl(var(--destructive))',
                        color: '#fff',
                        fontSize: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        flexShrink: 0,
                      }}
                    >
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right: thread */}
        <main
          className="panel"
          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {!activeConv ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
                chat
              </span>
              <p style={{ fontSize: 13, margin: 0 }}>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {activeConv.member?.full_name ?? 'Member'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {activeConv.member?.registration_number ?? ''} · {activeConv.scope_value}
                  </p>
                </div>
                {activeConv.status === 'open' && (
                  <button
                    className="btn btn-outline-dest btn-sm"
                    onClick={() => {
                      void handleClose()
                    }}
                  >
                    Close conversation
                  </button>
                )}
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {messages.length === 0 && (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 13,
                      marginTop: 32,
                    }}
                  >
                    No messages yet.
                  </p>
                )}
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    senderType={msg.sender_type}
                    isSelf={msg.sender_type === 'leader'}
                    timestamp={msg.created_at}
                    senderName={
                      msg.sender_type === 'member'
                        ? (activeConv.member?.full_name ?? 'Member')
                        : undefined
                    }
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input or closed banner */}
              {activeConv.status === 'closed' ? (
                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Conversation closed
                </div>
              ) : (
                <ChatInput
                  onSend={(content) => {
                    void handleSend(content)
                  }}
                  disabled={sending}
                  placeholder={`Reply to ${activeConv.member?.full_name ?? 'member'}…`}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Messages.tsx
git commit -m "feat: add admin messages inbox and thread page"
```

---

### Task 7: Routes + Nav wiring

**Files:**

- Modify: `src/routes.tsx`
- Modify: `src/components/DashboardLayout/Sidebar.tsx`
- Modify: `src/components/layouts/admin/navConfig.ts`

- [ ] **Step 1: Add lazy imports to `src/routes.tsx`**

After line 127 (`const NotificationsPage = lazy(...)`) add:

```ts
const DashboardMessages = lazy(() => import('./pages/dashboard/Messages'))
const AdminMessages = lazy(() => import('./pages/admin/Messages'))
```

- [ ] **Step 2: Add dashboard route to `src/routes.tsx`**

In the `DashboardLayout` children array (around line 208), add after the notifications route:

```ts
{ path: '/dashboard/messages', element: <DashboardMessages /> },
```

- [ ] **Step 3: Add admin route to `src/routes.tsx`**

In the `AdminLayout` children array, find `{ path: '/admin/newsletter', element: <AdminNewsletter /> }` and add after it:

```ts
{ path: '/admin/messages', element: <AdminMessages /> },
```

- [ ] **Step 4: Add Messages entry to dashboard sidebar**

In `src/components/DashboardLayout/Sidebar.tsx`, find the `'Personal'` group items array. Add Messages after the Tickets entry and before Settings:

```ts
// Before (lines ~143–147):
{ to: '/dashboard/liked', icon: 'favorite', label: 'Liked Posts' },
{ to: '/dashboard/referrals', icon: 'group_add', label: 'Referrals' },
{ to: '/dashboard/my-donations', icon: 'volunteer_activism', label: 'My Donations' },
{ to: '/dashboard/tickets', icon: 'confirmation_number', label: 'My Tickets' },
{ to: '/dashboard/settings', icon: 'settings', label: 'Settings' },

// After:
{ to: '/dashboard/liked', icon: 'favorite', label: 'Liked Posts' },
{ to: '/dashboard/referrals', icon: 'group_add', label: 'Referrals' },
{ to: '/dashboard/my-donations', icon: 'volunteer_activism', label: 'My Donations' },
{ to: '/dashboard/tickets', icon: 'confirmation_number', label: 'My Tickets' },
{ to: '/dashboard/messages', icon: 'chat', label: 'Messages' },
{ to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
```

- [ ] **Step 5: Add Messages entry to admin nav**

In `src/components/layouts/admin/navConfig.ts`, find the `'Members'` group items array (around line 72–95) and append Messages as the last item:

```ts
{
  to: '/admin/messages',
  icon: 'chat',
  label: 'Messages',
  permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
},
```

The full Members group items array becomes:

```ts
items: [
  {
    to: '/admin/members',
    icon: 'group',
    label: 'Member directory',
    permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
  },
  {
    to: '/admin/verification',
    icon: 'verified_user',
    label: 'KYC queue',
    pill: pendingVerificationsCount > 0 ? pendingVerificationsCount.toString() : undefined,
    permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
  },
  {
    to: '/admin/leadership',
    icon: 'shield',
    label: 'Leadership hub',
    permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
  },
  {
    to: '/admin/messages',
    icon: 'chat',
    label: 'Messages',
    permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
  },
],
```

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/routes.tsx src/components/DashboardLayout/Sidebar.tsx src/components/layouts/admin/navConfig.ts
git commit -m "feat: wire messages routes and nav entries"
```

---

### Task 8: Smoke test + final build

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Member flow test**

1. Log in as a member who has a region or chapter set.
2. Navigate to `http://localhost:3000/dashboard/messages`.
3. Expected: conversation opens (or empty-state "No leader assigned" if no admin with matching scope exists).
4. Type a message and press Enter.
5. Expected: message appears as a right-aligned green bubble immediately.
6. Verify in Supabase dashboard: `SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;`

- [ ] **Step 3: Admin flow test**

1. In a separate browser (or incognito), log in as the admin who is the leader for that member's region.
2. Navigate to `http://localhost:3000/admin/messages`.
3. Expected: the conversation appears in the left panel with the member's name.
4. Click the conversation row. Expected: thread loads with the member's message. Unread badge clears.
5. Type a reply and press Enter.
6. Expected: reply appears as right-aligned bubble on admin side.

- [ ] **Step 4: Real-time cross-session test**

1. Keep both the member tab and admin tab open simultaneously.
2. Send a message from the member tab.
3. Expected: the message appears in the admin thread **without page refresh**.
4. Send a reply from admin.
5. Expected: the reply appears in the member thread **without page refresh**.

- [ ] **Step 5: Closed conversation test**

1. On admin side, click "Close conversation".
2. Expected: status pill shows "Closed", input bar disappears, banner "Conversation closed" appears.
3. Reload the member tab.
4. Expected: closed banner shows, input is hidden.

- [ ] **Step 6: Final typecheck + build**

```bash
npm run typecheck && npm run build
```

Expected: TypeScript clean, Vite build succeeds with no errors.

- [ ] **Step 7: Push branch**

```bash
git push -u origin feat/leader-messaging
```
