-- SECURITY FIX: the group_messages_* policies used a tautological condition
-- (gcm.conversation_id = gcm.conversation_id — always true), so any member of
-- ANY group conversation could read/insert/update messages in EVERY
-- conversation, including private member-leader threads. Corrected to
-- correlate with messages.conversation_id.
--
-- The legacy 1:1 policies (messages_select/insert/update) are strictly
-- contained in the corrected group policies' member/leader branches, so each
-- action is consolidated into a single permissive policy (also clears the
-- multiple_permissive_policies perf lints on this hot table).

DROP POLICY IF EXISTS group_messages_select ON public.messages;
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.member_id = (select auth.uid())
        OR c.leader_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM group_conversation_members gcm
          WHERE gcm.conversation_id = messages.conversation_id
            AND gcm.user_id = (select auth.uid())
        )
      )
  )
);

DROP POLICY IF EXISTS group_messages_insert ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id AND c.status = 'open'
  )
  AND (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          (c.member_id = (select auth.uid()) AND messages.sender_type = 'member')
          OR (c.leader_id = (select auth.uid()) AND messages.sender_type = 'leader')
        )
    )
    OR EXISTS (
      SELECT 1 FROM group_conversation_members gcm
      WHERE gcm.conversation_id = messages.conversation_id
        AND gcm.user_id = (select auth.uid())
    )
  )
);

DROP POLICY IF EXISTS group_messages_delete ON public.messages;
DROP POLICY IF EXISTS group_messages_update_read ON public.messages;
DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages FOR UPDATE TO authenticated
USING (
  sender_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.member_id = (select auth.uid())
        OR c.leader_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM group_conversation_members gcm
          WHERE gcm.conversation_id = messages.conversation_id
            AND gcm.user_id = (select auth.uid())
        )
      )
  )
)
WITH CHECK (
  sender_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.member_id = (select auth.uid())
        OR c.leader_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM group_conversation_members gcm
          WHERE gcm.conversation_id = messages.conversation_id
            AND gcm.user_id = (select auth.uid())
        )
      )
  )
);
