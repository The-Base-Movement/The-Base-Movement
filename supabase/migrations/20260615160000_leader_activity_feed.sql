-- Unified activity feed for privileged "leader" roles. Merges in-app action
-- audit (audit_logs) with device/auth events (admin_device_activity) so the
-- Leaders Auth · All Activity page can show *everything* a leader does, tied to
-- their profile. All functions are admin-gated (is_admin) and run SECURITY
-- DEFINER so they can read both source tables regardless of per-table RLS.

-- The five privileged roles we capture. Keep in sync with the app's
-- LEADER_ROLES (src/services/leaderActivityService.ts).
create or replace function public.is_leader_role(p_role text)
returns boolean language sql immutable as $$
  select p_role in ('FOUNDER', 'SUPER_ADMIN', 'IT_MANAGER', 'FINANCE_OFFICER', 'EXECUTIVE')
$$;

-- Paginated, filterable unified feed (most recent first).
--   p_category: 'action' (in-app), 'device' (auth/device), or null for both.
--   p_action:   exact action match (optional).
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
    select a.id, a.role, u.full_name
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
      al.action,
      al.resource,
      al.status,
      null::text as device_type,
      (al.metadata ->> 'ip_address') as ip_address,
      (al.metadata ->> 'location') as location,
      (al.metadata ->> 'user_agent') as user_agent,
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
      d.action,
      null::text as resource,
      null::text as status,
      d.device_type,
      d.ip_address,
      d.location,
      d.user_agent,
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

-- Breakdown for the pie chart + KPI derivation: one row per event "bucket".
-- Device events bucket by their action; in-app actions bucket by resource.
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
    select 'device'::text as source, d.action as label
    from admin_device_activity d
    join leaders l on l.id = d.admin_id
    where (p_admin is null or d.admin_id = p_admin)
    union all
    select 'action'::text as source, coalesce(al.resource, 'OTHER') as label
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

-- Leader accounts for the filter dropdown (every privileged account, even ones
-- with no activity yet).
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
  select a.id, u.full_name, a.role
  from admins a
  join users u on u.id = a.id
  where is_leader_role(a.role)
  order by u.full_name;
end;
$$;

grant execute on function public.get_leader_activity(uuid, text, text, int, int) to authenticated;
grant execute on function public.get_leader_activity_breakdown(uuid) to authenticated;
grant execute on function public.get_leader_accounts() to authenticated;
