-- Leaders Auth IT views should not depend on multiple client-side table reads.
-- These RPCs centralize the read path, explicitly cast varchar-backed columns
-- to text, and perform their own role gate for privileged IT/admin users.

create or replace function public.get_admin_device_rows()
returns table (
  id uuid,
  admin_id uuid,
  admin_name text,
  role text,
  device_type text,
  device_name text,
  os_type text,
  browser text,
  ip_address text,
  location text,
  status text,
  webauthn_enrolled boolean,
  created_at timestamptz,
  last_seen timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce((select role from public.admins where id = auth.uid()), '')
     not in ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select
    d.id,
    d.admin_id,
    coalesce(u.full_name::text, 'Unknown admin') as admin_name,
    d.role::text,
    d.device_type::text,
    d.device_name::text,
    d.os_type::text,
    d.browser::text,
    d.ip_address::text,
    d.location::text,
    d.status::text,
    d.webauthn_enrolled,
    d.created_at,
    d.last_seen
  from public.admin_devices d
  left join public.users u on u.id = d.admin_id
  order by d.last_seen desc;
end;
$$;

revoke all on function public.get_admin_device_rows() from public;
grant execute on function public.get_admin_device_rows() to authenticated, service_role;

create or replace function public.get_admin_device_activity_rows(
  p_admin_id uuid default null,
  p_action text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  admin_id uuid,
  admin_name text,
  device_type text,
  action text,
  ip_address text,
  location text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce((select role from public.admins where id = auth.uid()), '')
     not in ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select
    a.id,
    a.admin_id,
    case
      when a.admin_id is null then 'System'
      else coalesce(u.full_name::text, 'Unknown admin')
    end as admin_name,
    a.device_type::text,
    a.action::text,
    a.ip_address::text,
    a.location::text,
    a.user_agent::text,
    a.metadata,
    a.created_at
  from public.admin_device_activity a
  left join public.users u on u.id = a.admin_id
  where (p_admin_id is null or a.admin_id = p_admin_id)
    and (p_action is null or a.action = p_action)
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 25), 1000))
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_device_activity_rows(uuid, text, integer, integer) from public;
grant execute on function public.get_admin_device_activity_rows(uuid, text, integer, integer)
  to authenticated, service_role;

create or replace function public.get_admin_device_activity_counts(
  p_admin_id uuid default null
)
returns table (
  action text,
  total bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce((select role from public.admins where id = auth.uid()), '')
     not in ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select
    a.action::text,
    count(*)::bigint as total
  from public.admin_device_activity a
  where p_admin_id is null or a.admin_id = p_admin_id
  group by a.action
  order by a.action;
end;
$$;

revoke all on function public.get_admin_device_activity_counts(uuid) from public;
grant execute on function public.get_admin_device_activity_counts(uuid) to authenticated, service_role;

create or replace function public.get_admin_device_activity_stats()
returns table (
  logins_today bigint,
  alerts bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce((select role from public.admins where id = auth.uid()), '')
     not in ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (
      where a.action in ('verified', 'enrolled')
        and a.created_at >= date_trunc('day', now())
    )::bigint as logins_today,
    count(*) filter (
      where a.action in ('step_up_required', 'blocked')
    )::bigint as alerts
  from public.admin_device_activity a;
end;
$$;

revoke all on function public.get_admin_device_activity_stats() from public;
grant execute on function public.get_admin_device_activity_stats() to authenticated, service_role;
