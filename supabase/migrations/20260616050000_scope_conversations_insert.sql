-- Replace the always-true INSERT policy on conversations with a participant
-- check. Blocks creating a DM/department conversation you're not part of (the
-- impersonation vector), while still allowing the three legitimate app flows:
--   • member-initiated DM / constituency / chapter / department → auth.uid() = member_id
--   • leader-initiated conversation                              → auth.uid() = leader_id
--   • member lazily creating a group forum (member_id is null)   → group row shape
-- Group rows confer no access on their own: reading/joining is still gated by
-- group_conversation_members RLS, and forums are deduped by (group_type, group_id).
drop policy if exists "allow_insert" on public.conversations;

create policy "conversations_participant_insert" on public.conversations
  for insert to authenticated
  with check (
    is_admin()
    or (select auth.uid()) = member_id
    or (select auth.uid()) = leader_id
    or (member_id is null and group_id is not null and group_type in ('constituency', 'chapter'))
  );
