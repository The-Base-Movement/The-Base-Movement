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
