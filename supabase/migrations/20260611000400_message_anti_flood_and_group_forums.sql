-- Anti-flood protection and group forums (constituency/chapter)
-- 1. Add fields to conversations to support group conversations
-- 2. Create group_conversation_members table for many-to-many
-- 3. Add moderation support for group messages

-- Extend conversations table to support groups
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS group_type text CHECK (group_type IN ('constituency', 'chapter')),
ADD COLUMN IF NOT EXISTS group_id uuid;

-- Create group_conversation_members table (track who's in the forum)
CREATE TABLE IF NOT EXISTS public.group_conversation_members (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role             text        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator')),
  joined_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_conversation_members_conversation_id
  ON public.group_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_conversation_members_user_id
  ON public.group_conversation_members(user_id);

-- Add moderation fields to messages (for forum moderation)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason text;

-- Update RLS policies for group conversations
-- Allow all members of a constituency/chapter forum to read messages
CREATE POLICY "group_messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    -- Existing: access own 1-to-1 conversations
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
    )
    OR
    -- New: access group conversation if member of the group
    EXISTS (
      SELECT 1 FROM public.group_conversation_members gcm
      WHERE gcm.conversation_id = conversation_id
        AND gcm.user_id = auth.uid()
    )
  );

-- Allow members to send messages to group conversations
CREATE POLICY "group_messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.status = 'open'
    )
    AND (
      -- Existing: 1-to-1 conversations
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
          AND (c.member_id = auth.uid() OR c.leader_id = auth.uid())
      )
      OR
      -- New: group conversations
      EXISTS (
        SELECT 1 FROM public.group_conversation_members gcm
        WHERE gcm.conversation_id = conversation_id
          AND gcm.user_id = auth.uid()
      )
    )
  );

-- Allow message authors and moderators to delete/flag messages
CREATE POLICY "group_messages_delete" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid()
    OR
    -- Moderator can delete
    EXISTS (
      SELECT 1 FROM public.group_conversation_members gcm
      WHERE gcm.conversation_id = conversation_id
        AND gcm.user_id = auth.uid()
        AND gcm.role = 'moderator'
    )
  );

-- Allow members of group conversations to update read status
CREATE POLICY "group_messages_update_read" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.member_id = auth.uid() OR c.leader_id = auth.uid() OR
             EXISTS (
               SELECT 1 FROM public.group_conversation_members gcm
               WHERE gcm.conversation_id = conversation_id
                 AND gcm.user_id = auth.uid()
             ))
    )
  );

-- Create index for checking unreplied messages (anti-flood)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_unread
  ON public.messages(conversation_id, sender_id, read_at);
