-- Create security definer function to count users securely without exposing sensitive RLS profile rows
create or replace function get_member_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from users;
$$;

-- Grant execution privileges to anon (guests) and authenticated (members) roles
grant execute on function get_member_count() to anon, authenticated;
