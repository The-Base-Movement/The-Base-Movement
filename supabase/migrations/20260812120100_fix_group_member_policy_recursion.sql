-- group_conversation_members_select referenced its own table, so every policy that
-- probes gcm (messages_select, messages_insert, messages_update, conversations_select)
-- recursed and failed. Route the co-member check through a SECURITY DEFINER helper,
-- which runs as the table owner and therefore does not re-enter RLS.

create or replace function public.is_group_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.group_conversation_members g
    where g.conversation_id = conv_id and g.user_id = auth.uid()
  )
$$;

grant execute on function public.is_group_conversation_member(uuid) to authenticated, anon;

drop policy if exists group_conversation_members_select on public.group_conversation_members;
create policy group_conversation_members_select on public.group_conversation_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or is_admin()
    or public.is_group_conversation_member(conversation_id)
  );
