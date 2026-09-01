-- Youth Wing, part 2:
--  1. Real date of birth (not just a year) so age can be monitored as they grow,
--     plus religion, so the directory can filter by age / gender / region / religion.
--  2. A GRADUATED status + a function that flags members who have turned 18.
--  3. blog_posts.audience so Youth Wing articles never mix with adult articles.

-- ---------------------------------------------------------------- 1. birth date

alter table public.youth_wing_members
  add column if not exists date_of_birth date,
  add column if not exists religion text;

-- birth_year becomes derived, so it can never drift from the real date of birth.
-- Safe to rebuild: existing rows (if any) carry their year forward first.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'youth_wing_members'
      and column_name = 'birth_year' and is_generated = 'NEVER'
  ) then
    update public.youth_wing_members
      set date_of_birth = make_date(birth_year, 1, 1)
      where date_of_birth is null;
    alter table public.youth_wing_members drop column birth_year;
  end if;
end
$$;

alter table public.youth_wing_members
  alter column date_of_birth set not null;

alter table public.youth_wing_members
  drop constraint if exists youth_wing_members_dob_sane;
alter table public.youth_wing_members
  add constraint youth_wing_members_dob_sane
  check (date_of_birth > date '1900-01-01' and date_of_birth < current_date);

alter table public.youth_wing_members
  add column if not exists birth_year int
  generated always as (extract(year from date_of_birth)::int) stored;

-- ------------------------------------------------------- 2. growing up / status

alter table public.youth_wing_members drop constraint if exists youth_wing_members_status_check;
alter table public.youth_wing_members
  add constraint youth_wing_members_status_check
  check (status in ('PENDING_CONSENT', 'ACTIVE', 'REJECTED', 'GRADUATED'));

alter table public.youth_wing_members
  add column if not exists graduated_at timestamptz;

/**
 * Age today, in whole years. Not a generated column on purpose: age depends on
 * current_date, which is not immutable, so it is computed on read instead.
 */
create or replace function public.youth_wing_age(p_dob date)
returns int
language sql
stable
set search_path = ''
as $$
  select extract(year from age(current_date, p_dob))::int;
$$;

grant execute on function public.youth_wing_age(date) to authenticated;

-- Admin directory source. security_invoker keeps the base table's admin-only RLS
-- in force, so this view never widens who can read minors' records.
drop view if exists public.youth_wing_directory;
create view public.youth_wing_directory
with (security_invoker = true) as
  select
    y.*,
    public.youth_wing_age(y.date_of_birth) as age,
    (public.youth_wing_age(y.date_of_birth) >= 18) as is_over_age,
    (date_trunc('year', age(current_date + interval '30 days', y.date_of_birth))
       <> date_trunc('year', age(current_date, y.date_of_birth))) as has_birthday_within_30_days
  from public.youth_wing_members y;

revoke all on public.youth_wing_directory from anon, authenticated;
grant select on public.youth_wing_directory to authenticated;

/**
 * Moves members who have turned 18 out of the active youth roll. They are NOT
 * auto-enrolled as adults: adult membership needs their own registration at
 * /register. Idempotent, safe to run from cron.
 */
create or replace function public.flag_youth_wing_graduates()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorised.';
  end if;

  update public.youth_wing_members
    set status = 'GRADUATED', graduated_at = now()
    where status in ('PENDING_CONSENT', 'ACTIVE')
      and public.youth_wing_age(date_of_birth) >= 18;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.flag_youth_wing_graduates() from public, anon;
grant execute on function public.flag_youth_wing_graduates() to authenticated;

-- ------------------------------------------------------------ 3. registration

drop function if exists public.submit_youth_wing_registration(
  text, int, text, text, text, text, text, text, text, text, boolean);

create or replace function public.submit_youth_wing_registration(
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_region text,
  p_country text,
  p_religion text,
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
  if p_date_of_birth is null then
    raise exception 'Date of birth is required.';
  end if;

  v_age := public.youth_wing_age(p_date_of_birth);
  if v_age < 14 or v_age > 17 then
    raise exception 'The Youth Wing is for ages 14 to 17 only.';
  end if;

  insert into public.youth_wing_members (
    full_name, date_of_birth, gender, region, country, religion, school_name,
    education_level, guardian_name, guardian_relationship, guardian_phone,
    consent_given, consent_at
  ) values (
    trim(p_full_name), p_date_of_birth, nullif(trim(coalesce(p_gender, '')), ''),
    nullif(trim(coalesce(p_region, '')), ''),
    coalesce(nullif(trim(coalesce(p_country, '')), ''), 'Ghana'),
    nullif(trim(coalesce(p_religion, '')), ''),
    nullif(trim(coalesce(p_school_name, '')), ''),
    nullif(trim(coalesce(p_education_level, '')), ''),
    trim(p_guardian_name), trim(p_guardian_relationship), trim(p_guardian_phone),
    true, now()
  )
  returning membership_number into v_number;

  return v_number;
end;
$$;

revoke all on function public.submit_youth_wing_registration(
  text, date, text, text, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.submit_youth_wing_registration(
  text, date, text, text, text, text, text, text, text, text, text, boolean) to anon, authenticated;

-- ------------------------------------------------------------- 4. portal + card

drop function if exists public.get_youth_wing_member(text, int);

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
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select y.membership_number, y.full_name, y.status, y.gender, y.region, y.country,
         y.religion, y.education_level, y.school_name, y.date_of_birth,
         public.youth_wing_age(y.date_of_birth), y.created_at
  from public.youth_wing_members y
  where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
    and y.date_of_birth = p_date_of_birth
  limit 1;
$$;

revoke all on function public.get_youth_wing_member(text, date) from public;
grant execute on function public.get_youth_wing_member(text, date) to anon, authenticated;

/**
 * Card QR verification. Returns only what an officer needs to confirm a card is
 * genuine: name, status, area. Never the date of birth, school or guardian.
 */
create or replace function public.verify_youth_wing_member(p_membership_number text)
returns table (
  membership_number text,
  full_name text,
  status text,
  region text,
  country text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select y.membership_number, y.full_name, y.status, y.region, y.country, y.created_at
  from public.youth_wing_members y
  where upper(trim(y.membership_number)) = upper(trim(p_membership_number))
  limit 1;
$$;

revoke all on function public.verify_youth_wing_member(text) from public;
grant execute on function public.verify_youth_wing_member(text) to anon, authenticated;

-- --------------------------------------------------- 5. article audience split

alter table public.blog_posts
  add column if not exists audience text not null default 'ADULT';

alter table public.blog_posts drop constraint if exists blog_posts_audience_check;
alter table public.blog_posts
  add constraint blog_posts_audience_check check (audience in ('ADULT', 'YOUTH'));

create index if not exists blog_posts_audience_idx on public.blog_posts (audience);
