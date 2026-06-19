-- RLS hardening: conversations had a permissive USING(true) SELECT policy, so
-- any authenticated user could read every conversation row (who is messaging
-- whom). Scope reads to the actual participants.
--
-- Visibility model (from messagingService): a conversation is between member_id
-- and leader_id for 1:1/scoped threads, or a group thread (group_id) whose
-- participants live in group_conversation_members. scope_type/scope_value are
-- only a category label, not extra viewers — each member has their own row.
-- group_conversation_members SELECT is already self-scoped (user_id = auth.uid),
-- so the EXISTS check below resolves correctly under the caller's RLS.

drop policy if exists "allow_select" on public.conversations;

create policy "conversations_participant_select" on public.conversations
  for select to authenticated
  using (
    is_admin()
    or member_id = (select auth.uid())
    or leader_id = (select auth.uid())
    or exists (
      select 1
      from group_conversation_members gcm
      where gcm.conversation_id = conversations.id
        and gcm.user_id = (select auth.uid())
    )
  );
