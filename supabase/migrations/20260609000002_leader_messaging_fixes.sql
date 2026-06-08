-- Fix security and correctness issues in leader messaging tables

-- Drop old policies to recreate with fixes
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP INDEX IF EXISTS idx_messages_conversation_id;

-- Recreate messages_insert with sender_type validation
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
        AND c.status = 'open'
        AND (
          (c.member_id = auth.uid() AND sender_type = 'member')
          OR (c.leader_id = auth.uid() AND sender_type = 'leader')
        )
    )
  );

-- Recreate messages_update with read_at-only restriction
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
    )
  )
  WITH CHECK (
    read_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
    )
  );

-- Recreate conversations_update restricted to status='closed' only
CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING  (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid() AND status = 'closed');

-- Replace single-column index with composite for query efficiency
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at);

-- Trigger: keep conversations.last_message_at in sync with latest message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_messages_update_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message_at();

-- Add conversations to Realtime so member UIs receive live close events
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
