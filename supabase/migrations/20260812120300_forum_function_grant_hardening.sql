-- Postgres grants EXECUTE to PUBLIC on new functions, which exposed these over
-- PostgREST as /rest/v1/rpc/*. The two trigger functions are never called directly,
-- and the policy helpers are only ever evaluated for authenticated users.

revoke all on function public.enforce_message_update_scope() from public, anon, authenticated;
revoke all on function public.enforce_group_message_rate_limit() from public, anon, authenticated;

revoke all on function public.is_group_conversation_member(uuid) from public, anon;
revoke all on function public.can_join_group_conversation(uuid) from public, anon;

grant execute on function public.is_group_conversation_member(uuid) to authenticated;
grant execute on function public.can_join_group_conversation(uuid) to authenticated;
