create or replace function public.enforce_user_network_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_region text;
  v_constituency text;
  v_chapter text;
begin
  new.platform := upper(trim(coalesce(new.platform, '')));

  if new.platform not in ('GHANA', 'DIASPORA') then
    raise check_violation using message = 'Invalid member platform';
  end if;

  new.country := nullif(trim(new.country), '');
  new.region := nullif(trim(new.region), '');
  new.constituency := nullif(trim(new.constituency), '');
  new.chapter := nullif(trim(new.chapter), '');

  if new.platform = 'GHANA' then
    if new.chapter is not null then
      raise check_violation using message = 'Ghana members cannot use a chapter assignment';
    end if;

    new.country := 'Ghana';

    if new.constituency is not null then
      select gc.name, gr.name into v_constituency, v_region
      from public.ghana_constituencies gc
      join public.ghana_regions gr on gr.id = gc.region_id
      where lower(trim(gc.name)) = lower(new.constituency)
      limit 1;

      if v_constituency is null then
        raise check_violation using message = 'Invalid Ghana constituency assignment';
      end if;

      new.constituency := v_constituency;
      new.region := v_region;
    end if;
  else
    if new.constituency is not null or new.region is not null then
      raise check_violation using message = 'Diaspora members cannot use Ghana assignments';
    end if;

    if lower(coalesce(new.country, '')) = 'ghana' then
      raise check_violation using message = 'Diaspora members cannot use Ghana as country';
    end if;

    if new.chapter is not null then
      select c.name into v_chapter
      from public.chapters c
      where lower(trim(c.name)) = lower(new.chapter)
        and lower(coalesce(c.country, '')) <> 'ghana'
      limit 1;

      if v_chapter is null then
        raise check_violation using message = 'Invalid Diaspora chapter assignment';
      end if;

      new.chapter := v_chapter;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_user_network_assignment on public.users;
create trigger trg_enforce_user_network_assignment
before insert or update of platform, country, region, constituency, chapter
on public.users
for each row execute function public.enforce_user_network_assignment();

revoke all on function public.enforce_user_network_assignment() from public, anon, authenticated;

create or replace view public.admin_member_assignment_issues
with (security_invoker = true)
as
select
  u.id,
  u.registration_number,
  u.full_name,
  u.platform,
  u.country,
  u.region,
  u.constituency,
  u.chapter,
  case
    when u.platform = 'GHANA' and u.constituency is null then 'missing_constituency'
    when u.platform = 'GHANA' and gc.id is null then 'invalid_constituency'
    when u.platform = 'GHANA' and u.chapter is not null then 'ghana_has_chapter'
    when u.platform = 'DIASPORA' and (u.constituency is not null or u.region is not null)
      then 'diaspora_has_ghana_assignment'
    when u.platform = 'DIASPORA' and lower(coalesce(u.country, '')) = 'ghana'
      then 'diaspora_country_is_ghana'
    when u.platform = 'DIASPORA' and u.chapter is not null and c.id is null
      then 'invalid_diaspora_chapter'
  end as issue_code
from public.users u
left join public.ghana_constituencies gc
  on lower(trim(gc.name)) = lower(trim(u.constituency))
left join public.chapters c
  on lower(trim(c.name)) = lower(trim(u.chapter))
  and lower(coalesce(c.country, '')) <> 'ghana'
where u.deleted_at is null
  and (
    (u.platform = 'GHANA' and (u.constituency is null or gc.id is null or u.chapter is not null))
    or
    (u.platform = 'DIASPORA' and (
      u.constituency is not null
      or u.region is not null
      or lower(coalesce(u.country, '')) = 'ghana'
      or (u.chapter is not null and c.id is null)
    ))
  );

revoke all on public.admin_member_assignment_issues from public, anon;
grant select on public.admin_member_assignment_issues to authenticated;
