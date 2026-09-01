-- Lets an admin open a Youth Wing member's own portal view without knowing that
-- member's date of birth (the credential a youth signs in with).
--
-- Deliberately a separate function from get_youth_wing_member rather than an
-- "admin can skip the DOB" branch inside it: that would put an is_admin() escape
-- hatch on the anon-executable RPC, where a bug in the branch is a full
-- enumeration hole over minors' records. This one is admin-gated at the top and
-- is not granted to anon at all.
create or replace function public.admin_get_youth_wing_member(
  p_membership_number text
)
returns table (
  membership_number text,
  full_name text,
  status text,
  gender text,
  region text,
  country text,
  religion text,
  education_level text,
  school_name text,
  date_of_birth date,
  age int,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized: admin access required';
  end if;

  return query
    select y.membership_number, y.full_name, y.status, y.gender, y.region, y.country,
           y.religion, y.education_level, y.school_name, y.date_of_birth,
           public.youth_wing_age(y.date_of_birth), y.created_at
    from public.youth_wing_members y
    where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
    limit 1;
end;
$$;

revoke all on function public.admin_get_youth_wing_member(text) from public, anon;
grant execute on function public.admin_get_youth_wing_member(text) to authenticated;
