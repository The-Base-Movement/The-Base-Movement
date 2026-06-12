-- Count verified, non-deleted members securely bypassing RLS to avoid frontend 403 blocks
create or replace function get_verified_member_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from users where deleted_at is null and verification_status = 'Verified';
$$;

-- Count all non-deleted registered members securely bypassing RLS
create or replace function get_registered_member_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from users where deleted_at is null;
$$;

-- Grant execution privileges to public roles
grant execute on function get_verified_member_count() to anon, authenticated;
grant execute on function get_registered_member_count() to anon, authenticated;
