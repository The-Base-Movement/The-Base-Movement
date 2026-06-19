-- Enable row-level security and policies for group_conversation_members
-- This table is used by group messaging membership checks and must allow members
-- to add their own membership row for open constituency/chapter forums.

ALTER TABLE public.group_conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_conversation_members_select" ON public.group_conversation_members;
DROP POLICY IF EXISTS "group_conversation_members_insert" ON public.group_conversation_members;

CREATE POLICY "group_conversation_members_select" ON public.group_conversation_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "group_conversation_members_insert" ON public.group_conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.status = 'open'
        AND c.group_type IS NOT NULL
    )
  );
