-- Youth Wing (ages 14-17): civic/mobilization track, deliberately NOT party
-- membership. Kept in its own table so no adult count, constituency roll or
-- diaspora roll can ever pick these rows up. No Ghana Card / Voter ID column
-- exists here by design -- minors are not eligible for either.

create table if not exists public.youth_wing_members (
  id uuid primary key default gen_random_uuid(),
  membership_number text unique,
  role text not null default 'youth_wing' check (role = 'youth_wing'),
  full_name text not null,
  birth_year int not null check (birth_year between 1900 and 2200),
  gender text,
  region text,
  country text not null default 'Ghana',
  school_name text,
  education_level text,
  guardian_name text not null,
  guardian_relationship text not null,
  guardian_phone text not null,
  consent_given boolean not null default false,
  consent_at timestamptz,
  status text not null default 'PENDING_CONSENT'
    check (status in ('PENDING_CONSENT', 'ACTIVE', 'REJECTED')),
  verified_at timestamptz,
  verified_by uuid,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists youth_wing_members_status_idx on public.youth_wing_members (status);

-- Distinct prefix so a Youth Wing number can never be mistaken for TBM-GH- / TBM-DI-.
create sequence if not exists public.youth_wing_membership_number_seq as bigint start with 1;
revoke all on sequence public.youth_wing_membership_number_seq from anon, authenticated;

create or replace function public.assign_youth_wing_membership_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if nullif(trim(new.membership_number), '') is not null then
    return new;
  end if;
  new.membership_number := 'TBM-YW-' ||
    lpad(nextval('public.youth_wing_membership_number_seq')::text, 6, '0');
  return new;
end;
$$;

revoke all on function public.assign_youth_wing_membership_number() from public, anon, authenticated;

drop trigger if exists assign_youth_wing_membership_number on public.youth_wing_members;
create trigger assign_youth_wing_membership_number
before insert on public.youth_wing_members
for each row execute function public.assign_youth_wing_membership_number();

alter table public.youth_wing_members enable row level security;

-- Admins only. Public registration goes through the SECURITY DEFINER RPC below,
-- so anon/authenticated never get direct INSERT or SELECT on minors' records.
drop policy if exists youth_wing_members_admin_all on public.youth_wing_members;
create policy youth_wing_members_admin_all on public.youth_wing_members
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on table public.youth_wing_members from anon, authenticated;
grant select, insert, update, delete on table public.youth_wing_members to authenticated;

-- Public registration entry point.
create or replace function public.submit_youth_wing_registration(
  p_full_name text,
  p_birth_year int,
  p_gender text,
  p_region text,
  p_country text,
  p_school_name text,
  p_education_level text,
  p_guardian_name text,
  p_guardian_relationship text,
  p_guardian_phone text,
  p_consent boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_age int;
  v_number text;
begin
  if not coalesce(p_consent, false) then
    raise exception 'Guardian consent is required.';
  end if;
  if nullif(trim(coalesce(p_full_name, '')), '') is null
     or nullif(trim(coalesce(p_guardian_name, '')), '') is null
     or nullif(trim(coalesce(p_guardian_relationship, '')), '') is null
     or nullif(trim(coalesce(p_guardian_phone, '')), '') is null then
    raise exception 'Full name and complete guardian details are required.';
  end if;

  v_age := extract(year from current_date)::int - p_birth_year;
  if v_age < 14 or v_age > 17 then
    raise exception 'The Youth Wing is for ages 14 to 17 only.';
  end if;

  insert into public.youth_wing_members (
    full_name, birth_year, gender, region, country, school_name, education_level,
    guardian_name, guardian_relationship, guardian_phone, consent_given, consent_at
  ) values (
    trim(p_full_name), p_birth_year, nullif(trim(coalesce(p_gender, '')), ''),
    nullif(trim(coalesce(p_region, '')), ''), coalesce(nullif(trim(coalesce(p_country, '')), ''), 'Ghana'),
    nullif(trim(coalesce(p_school_name, '')), ''), nullif(trim(coalesce(p_education_level, '')), ''),
    trim(p_guardian_name), trim(p_guardian_relationship), trim(p_guardian_phone),
    true, now()
  )
  returning membership_number into v_number;

  return v_number;
end;
$$;

revoke all on function public.submit_youth_wing_registration(
  text, int, text, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.submit_youth_wing_registration(
  text, int, text, text, text, text, text, text, text, text, boolean) to anon, authenticated;

-- Youth portal lookup: membership number + birth year acts as the (deliberately
-- low-stakes) credential. Returns only the youth's own summary, never a list.
create or replace function public.get_youth_wing_member(
  p_membership_number text,
  p_birth_year int
)
returns table (
  membership_number text,
  full_name text,
  status text,
  region text,
  country text,
  education_level text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select y.membership_number, y.full_name, y.status, y.region, y.country,
         y.education_level, y.created_at
  from public.youth_wing_members y
  where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
    and y.birth_year = p_birth_year
  limit 1;
$$;

revoke all on function public.get_youth_wing_member(text, int) from public;
grant execute on function public.get_youth_wing_member(text, int) to anon, authenticated;
