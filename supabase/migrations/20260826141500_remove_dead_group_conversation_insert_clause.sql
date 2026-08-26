-- conversations_participant_insert allowed any authenticated user to
-- create a group_type='constituency'/'chapter' conversation row for ANY
-- group_id/scope_value, with no check they lead or belong to that
-- specific group -- no unique constraint on group_id/scope_value either,
-- so an attacker could create duplicate/fake group channels, fragmenting
-- legitimate ones (getMemberGroupConversations joins every matching row
-- for a scope_value, adding the member to all of them).
--
-- Confirmed dead: no frontend code, edge function, or DB
-- trigger/function anywhere inserts a conversations row with
-- group_type constituency/chapter -- these rows are provisioned
-- out-of-band (manually/admin), never through this authenticated path.

DROP POLICY IF EXISTS "conversations_participant_insert" ON public.conversations;

CREATE POLICY "conversations_participant_insert"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  OR auth.uid() = member_id
  OR auth.uid() = leader_id
);
