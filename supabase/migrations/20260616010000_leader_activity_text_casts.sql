-- Fix: get_leader_activity / _breakdown / get_leader_accounts declared their
-- text columns as `text`, but the source columns are varchar (audit_logs.action
-- /resource/status, users.full_name varchar(255), admins.role, device columns).
-- Postgres raises 42804 "structure of query does not match function result type"
-- on RETURN QUERY. Cast every varchar-sourced column to ::text so the returned
-- types match the declared signatures. Signatures unchanged.

create or replace function public.get_leader_activity(
  p_admin uuid default null,
  p_category text default null,
  p_action text default null,
  p_limit int default 25,
  p_offset int default 0
)
returns table (
  id uuid,
  source text,
  admin_id uuid,
  admin_name text,
  role text,
  action text,
  resource text,
  status text,
  device_type text,
  ip_address text,
  location text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    return;
  end if;

  return query
  with leaders as (
    select a.id, a.role::text as role, u.full_name::text as full_name
    from admins a
    join users u on u.id = a.id
    where is_leader_role(a.role)
  ),
  unified as (
    select
      al.id,
      'action'::text as source,
      al.admin_id,
      l.full_name as admin_name,
      l.role,
      al.action::text as action,
      al.resource::text as resource,
      al.status::text as status,
      null::text as device_type,
      (al.metadata ->> 'ip_address')::text as ip_address,
      (al.metadata ->> 'location')::text as location,
      (al.metadata ->> 'user_agent')::text as user_agent,
      al.metadata,
      al."timestamp" as created_at
    from audit_logs al
    join leaders l on l.id = al.admin_id
    union all
    select
      d.id,
      'device'::text as source,
      d.admin_id,
      l.full_name as admin_name,
      l.role,
      d.action::text as action,
      null::text as resource,
      null::text as status,
      d.device_type::text as device_type,
      d.ip_address::text as ip_address,
      d.location::text as location,
      d.user_agent::text as user_agent,
      d.metadata,
      d.created_at
    from admin_device_activity d
    join leaders l on l.id = d.admin_id
  )
  select *
  from unified u
  where (p_admin is null or u.admin_id = p_admin)
    and (p_category is null or u.source = p_category)
    and (p_action is null or u.action = p_action)
  order by u.created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
end;
$$;

create or replace function public.get_leader_activity_breakdown(p_admin uuid default null)
returns table (source text, label text, value bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    return;
  end if;

  return query
  with leaders as (
    select a.id, a.role
    from admins a
    where is_leader_role(a.role)
  ),
  buckets as (
    select 'device'::text as source, d.action::text as label
    from admin_device_activity d
    join leaders l on l.id = d.admin_id
    where (p_admin is null or d.admin_id = p_admin)
    union all
    select 'action'::text as source, split_part(coalesce(al.resource, 'OTHER'), '/', 1)::text as label
    from audit_logs al
    join leaders l on l.id = al.admin_id
    where (p_admin is null or al.admin_id = p_admin)
  )
  select b.source, b.label, count(*)::bigint as value
  from buckets b
  group by b.source, b.label
  order by value desc;
end;
$$;

create or replace function public.get_leader_accounts()
returns table (admin_id uuid, name text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    return;
  end if;

  return query
  select a.id, u.full_name::text as name, a.role::text as role
  from admins a
  join users u on u.id = a.id
  where is_leader_role(a.role)
  order by u.full_name;
end;
$$;
