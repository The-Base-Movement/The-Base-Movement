-- Profile photos for Youth Wing members.
--
-- Youth Wing members have no auth account by design, so the `avatars` bucket is
-- unusable for them: its policies key on auth.uid(). They also cannot be given
-- anon write access to a bucket -- the membership number is sequential, so any
-- anon-writable path keyed on it would let one youth overwrite another's photo,
-- and would hand the internet a free file dump.
--
-- Instead: a bucket with NO anon or authenticated write policy at all. Uploads
-- go through the `youth-avatar` edge function, which verifies membership number
-- + date of birth (the same credential pair as the portal sign-in) or an admin
-- JWT, then writes with the service role, which bypasses RLS.

alter table public.youth_wing_members
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'youth-avatars',
  'youth-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read only. The object path is keyed on the row's uuid plus a random
-- filename, never the sequential membership number, so the bucket being public
-- does not make a minor's photo enumerable.
drop policy if exists "Youth avatars are publicly readable" on storage.objects;
create policy "Youth avatars are publicly readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'youth-avatars');

-- No INSERT / UPDATE / DELETE policy is defined on purpose: only the service
-- role (which bypasses RLS) may write here.

/**
 * Records an uploaded photo against a Youth Wing member. Called by the
 * youth-avatar edge function after it has verified the caller, hence the
 * service_role gate -- this must never be reachable from a browser, or anyone
 * could point another member's row at an image of their choosing.
 */
create or replace function public.set_youth_wing_avatar(
  p_membership_number text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_service_role() then
    raise exception 'not_authorized: service role required';
  end if;

  update public.youth_wing_members
    set avatar_url = p_avatar_url
    where upper(trim(membership_number)) = upper(trim(p_membership_number));

  if not found then
    raise exception 'member not found: %', p_membership_number;
  end if;
end;
$$;

revoke all on function public.set_youth_wing_avatar(text, text) from public, anon, authenticated;

-- The portal and the card need to read the photo back.
drop function if exists public.get_youth_wing_member(text, date);

create or replace function public.get_youth_wing_member(
  p_membership_number text,
  p_date_of_birth date
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
  avatar_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select y.membership_number, y.full_name, y.status, y.gender, y.region, y.country,
         y.religion, y.education_level, y.school_name, y.date_of_birth,
         public.youth_wing_age(y.date_of_birth), y.avatar_url, y.created_at
  from public.youth_wing_members y
  where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
    and y.date_of_birth = p_date_of_birth
  limit 1;
$$;

revoke all on function public.get_youth_wing_member(text, date) from public;
grant execute on function public.get_youth_wing_member(text, date) to anon, authenticated;

drop function if exists public.admin_get_youth_wing_member(text);

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
  avatar_url text,
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
           public.youth_wing_age(y.date_of_birth), y.avatar_url, y.created_at
    from public.youth_wing_members y
    where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
    limit 1;
end;
$$;

revoke all on function public.admin_get_youth_wing_member(text) from public, anon;
grant execute on function public.admin_get_youth_wing_member(text) to authenticated;
