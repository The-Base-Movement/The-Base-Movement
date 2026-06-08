# Leader Messaging — Design Spec

**Date:** 2026-06-09  
**Feature:** Two-way real-time messaging between members and their assigned leader  
**Branch:** `feat/leader-messaging`

---

## Overview

Members can send and receive messages from their assigned regional, constituency, or chapter leader directly from the dashboard. Leaders manage all inbound conversations from their assigned scope in the admin panel. Messages are delivered in real-time via Supabase Realtime subscriptions.

---

## Data Model

### `conversations` table

| Column            | Type                    | Notes                                      |
| ----------------- | ----------------------- | ------------------------------------------ |
| `id`              | `uuid` PK               | `gen_random_uuid()`                        |
| `member_id`       | `uuid` FK → `users.id`  | UNIQUE — one conversation per member       |
| `leader_id`       | `uuid` FK → `admins.id` | Resolved at conversation creation          |
| `scope_type`      | `text`                  | `'region' \| 'constituency' \| 'chapter'`  |
| `scope_value`     | `text`                  | e.g. `'Greater Accra'`, `'London Chapter'` |
| `status`          | `text`                  | `'open' \| 'closed'`, default `'open'`     |
| `created_at`      | `timestamptz`           | `now()`                                    |
| `last_message_at` | `timestamptz`           | Updated on every new message               |

### `messages` table

| Column            | Type                           | Notes                                                |
| ----------------- | ------------------------------ | ---------------------------------------------------- |
| `id`              | `uuid` PK                      | `gen_random_uuid()`                                  |
| `conversation_id` | `uuid` FK → `conversations.id` | `ON DELETE CASCADE`                                  |
| `sender_type`     | `text`                         | `'member' \| 'leader'`                               |
| `sender_id`       | `uuid`                         | `users.id` or `admins.id` depending on `sender_type` |
| `content`         | `text`                         | NOT NULL, non-empty                                  |
| `read_at`         | `timestamptz`                  | `null` = unread                                      |
| `created_at`      | `timestamptz`                  | `now()`                                              |

---

## Leader Resolution

When a member opens `/dashboard/messages` for the first time, the system resolves their leader in this priority order:

1. **Ghana + has region** → admin with role `CONSTITUENCY_LEAD` where `assigned_region` matches member's region
2. **Ghana fallback** → admin with role `REGIONAL_DIRECTOR` where `assigned_region` matches member's region
3. **Diaspora** → admin with role `CHAPTER_LEAD` where `chapter` matches member's chapter
4. **Global fallback** → any admin with role `ORGANIZER` or `EXECUTIVE` (HQ catch-all)

If no leader is found at any step, the member sees a friendly empty state and no conversation is created.

---

## RLS Policies

**`conversations`:**

- `authenticated` SELECT: `member_id = auth.uid()` OR `leader_id = auth.uid()` (admins.id = auth.uid() directly)
- `authenticated` INSERT: `member_id = auth.uid()` only
- `authenticated` UPDATE: `leader_id = auth.uid()` can update `status`; member cannot

**`messages`:**

- `authenticated` SELECT: user is party to the conversation (`member_id = auth.uid()` OR `leader_id = auth.uid()`)
- `authenticated` INSERT: `sender_id = auth.uid()` AND matching `sender_type`

---

## Service Layer — `messagingService.ts`

```ts
getOrCreateConversation(memberUserId: string): Promise<Conversation | null>
// Resolves leader, finds existing conversation or creates new one.

sendMessage(conversationId: string, content: string, senderType: 'member' | 'leader', senderId: string): Promise<Message>
// Inserts message, updates conversations.last_message_at.

getMessages(conversationId: string): Promise<Message[]>
// Fetch all messages ordered by created_at asc.

subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void): () => void
// Supabase realtime postgres_changes subscription. Returns unsubscribe fn.

markAsRead(conversationId: string, readerType: 'member' | 'leader'): Promise<void>
// Sets read_at = now() on all messages where sender_type != readerType AND read_at IS NULL.

getLeaderConversations(leaderAdminId: string): Promise<ConversationSummary[]>
// Admin side: all conversations where leader_id = leaderAdminId, ordered by last_message_at desc.
// Each summary includes unread count (messages where sender_type = 'member' AND read_at IS NULL).

getUnreadCount(conversationId: string, readerType: 'member' | 'leader'): Promise<number>
// For nav badge: count of unread messages addressed to readerType.
```

---

## UI Surfaces

### Member — `/dashboard/messages`

**Route:** Add `{ path: '/dashboard/messages', element: <DashboardMessages /> }` to `src/routes.tsx`

**Layout:** Full-height flex column inside `DashboardLayout`

**States:**

- **Loading** — skeleton placeholder
- **No leader assigned** — empty state with icon, "Your regional leader hasn't been assigned yet. Contact HQ at info@thebasemovement.com"
- **Conversation closed** — banner: "This conversation has been closed by your leader"
- **Active conversation** — chat thread + input

**Chat thread:**

- Leader info header: avatar, name, role badge (e.g. "Regional Director — Greater Accra")
- Messages scrollable area, anchored to bottom on new message
- Member messages: right-aligned, `hsl(var(--primary))` background, white text
- Leader messages: left-aligned, `hsl(var(--container-low))` background, `hsl(var(--on-surface))` text
- Timestamp below each bubble in muted text

**Input bar (sticky bottom):**

- `<textarea>` (single line, expands to 3 rows max), Enter to send, Shift+Enter for newline
- Send button: `btn btn-primary` with `send` Material Symbol icon
- Disabled when conversation is closed or content is empty

**Realtime:** `subscribeToMessages` called on mount, unsubscribed on unmount. New messages append to list without full re-fetch.

---

### Admin — `/admin/messages`

**Route:** Add `{ path: '/admin/messages', element: <AdminMessages /> }` to `src/routes.tsx`

**Layout:** `.sidebar-main` two-column (left: conversation list, right: active thread)

**Left panel — conversation list:**

- Each row: member avatar/initial, member name + reg number, scope tag pill (region/constituency/chapter), last message preview (truncated), unread count badge, relative timestamp
- Rows sorted by `last_message_at` desc (newest first)
- Click row → loads thread in right panel, calls `markAsRead`

**Right panel — thread:**

- Same bubble layout as member side (leader messages right, member messages left)
- Reply textarea + send button
- "Close conversation" button (sets `status = 'closed'`): `btn-outline-dest` style
- Realtime subscription on active conversation

**Empty right panel state:** "Select a conversation to view messages"

---

## Nav Integration

**Dashboard sidebar:**

- Add `{ label: 'Messages', icon: 'chat', path: '/dashboard/messages' }` to the existing nav config
- Unread badge: red dot when `getUnreadCount(conversationId, 'member') > 0`

**Admin sidebar (`navConfig.ts`):**

- Add Messages entry with `chat` icon
- Unread badge: total unread across all leader's conversations

---

## Shared Components

### `ChatBubble.tsx`

```tsx
interface ChatBubbleProps {
  content: string
  senderType: 'member' | 'leader'
  isSelf: boolean // true when bubble belongs to the current user
  timestamp: string
  senderName?: string
}
```

### `ChatInput.tsx`

```tsx
interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}
```

---

## Error Handling

| Scenario            | Behaviour                                                     |
| ------------------- | ------------------------------------------------------------- |
| No leader found     | Empty state — no conversation created                         |
| Send fails          | Message stays in input, toast: "Message not sent — try again" |
| Realtime drops      | Silent reconnect; toast after 3 failed attempts               |
| Empty submit        | Send button disabled; no-op                                   |
| Conversation closed | Input hidden, banner shown                                    |

---

## Scope — v1 Constraints

- One conversation per member (no multiple threads)
- Text-only — no file or image attachments
- No message editing or deletion
- No typing indicators
- No read receipts shown in the UI (only used internally for unread counts)
- Admin can close a conversation; member cannot reopen it

---

## Files Changed

| File                                                              | Action                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `supabase/migrations/20260609000001_leader_messaging.sql`         | Create `conversations` + `messages` tables, RLS policies |
| `src/services/messagingService.ts`                                | New service                                              |
| `src/pages/dashboard/Messages.tsx`                                | New member chat page                                     |
| `src/pages/admin/Messages.tsx`                                    | New admin inbox + thread page                            |
| `src/components/chat/ChatBubble.tsx`                              | Shared bubble component                                  |
| `src/components/chat/ChatInput.tsx`                               | Shared input component                                   |
| `src/routes.tsx`                                                  | Add two new routes                                       |
| `src/components/layouts/admin/navConfig.ts`                       | Add Messages nav entry                                   |
| `src/components/DashboardLayout.tsx` (inline nav array ~line 380) | Add Messages nav entry                                   |
