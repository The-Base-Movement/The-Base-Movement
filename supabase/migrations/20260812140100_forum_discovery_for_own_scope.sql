-- Discovery previously special-cased only the movement forum, so a member still
-- could not SELECT their own constituency or chapter room before joining it —
-- the same chicken-and-egg, one scope wider.
--
-- can_join_group_conversation() already encodes exactly "this room is yours"
-- (movement for every approved member, constituency/chapter matched on the member's
-- own values), so reuse it for visibility. It subsumes the movement-only branch.

drop policy if exists conversations_participant_select on public.conversations;
create policy conversations_participant_select on public.conversations
  for select to authenticated
  using (
    is_admin()
    or member_id = (select auth.uid())
    or leader_id = (select auth.uid())
    or public.is_group_conversation_member(id)
    or public.can_join_group_conversation(id)
  );
