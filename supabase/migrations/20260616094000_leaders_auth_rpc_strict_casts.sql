-- Follow-up hardening for Leaders Auth RPCs.
-- The first pass cast the projected columns, but Postgres still reports
-- varchar(255) -> text mismatches on some result columns in production.
-- Force the return shape through typed subqueries so the RETURN QUERY contract
-- is unambiguous.

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
  select *
  from (
    select
      d.id::uuid as id,
      d.admin_id::uuid as admin_id,
      coalesce(u.full_name, 'Unknown admin')::text as admin_name,
      d.role::text as role,
      d.device_type::text as device_type,
      d.device_name::text as device_name,
      d.os_type::text as os_type,
      d.browser::text as browser,
      d.ip_address::text as ip_address,
      d.location::text as location,
      d.status::text as status,
      d.webauthn_enrolled::boolean as webauthn_enrolled,
      d.created_at::timestamptz as created_at,
      d.last_seen::timestamptz as last_seen
    from public.admin_devices d
    left join public.users u on u.id = d.admin_id
    order by d.last_seen desc
  ) typed;
end;
$$;

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
  select *
  from (
    select
      a.id::uuid as id,
      a.admin_id::uuid as admin_id,
      (
        case
          when a.admin_id is null then 'System'
          else coalesce(u.full_name, 'Unknown admin')
        end
      )::text as admin_name,
      a.device_type::text as device_type,
      a.action::text as action,
      a.ip_address::text as ip_address,
      a.location::text as location,
      a.user_agent::text as user_agent,
      a.metadata::jsonb as metadata,
      a.created_at::timestamptz as created_at
    from public.admin_device_activity a
    left join public.users u on u.id = a.admin_id
    where (p_admin_id is null or a.admin_id = p_admin_id)
      and (p_action is null or a.action = p_action)
    order by a.created_at desc
    limit greatest(1, least(coalesce(p_limit, 25), 1000))
    offset greatest(coalesce(p_offset, 0), 0)
  ) typed;
end;
$$;
