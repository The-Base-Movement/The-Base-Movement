-- Messaging enhancements: expiring messages, department conversations, message list sidebar
-- 1. Add expires_at to messages (30 days after creation)
-- 2. Allow 'department' scope_type for conversations
-- 3. Add department_id field for department conversations

-- Add expires_at column to messages (calculated as created_at + 30 days)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

-- Update constraint to allow 'department' and group forum scope types
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_scope_type_check,
ADD CONSTRAINT conversations_scope_type_check
  CHECK (scope_type IN (
    'region',
    'constituency',
    'chapter',
    'department',
    'group_constituency',
    'group_chapter'
  ));

-- Add department_id for department-scoped conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS department_id text REFERENCES public.helpdesk_departments(id) ON DELETE CASCADE;

-- Create index for message expiry (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_messages_expires_at
  ON public.messages(expires_at DESC NULLS LAST);

-- RLS policy update: allow members to message departments
-- (members can insert into department conversations they have access to via their role)
-- The policy remains unchanged since sender_id = auth.uid() still validates the sender

-- Create a view for non-expired messages (useful for queries)
CREATE OR REPLACE VIEW public.messages_active AS
SELECT * FROM public.messages
WHERE expires_at > now();
