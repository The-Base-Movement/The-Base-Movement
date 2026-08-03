-- Migration: Create get_job_taxonomy_usage() RPC to aggregate counts on the database side efficiently.
create or replace function public.get_job_taxonomy_usage()
returns table (
  entry_type text,
  entry_id integer,
  usage_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce((select role from public.admins where id = auth.uid()), '')
     not in ('ADMIN','SUPER_ADMIN','FOUNDER','IT_MANAGER','MOVEMENT_LEADER','FINANCE_OFFICER') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select 'industry'::text as entry_type, job_industry_id::integer as entry_id, count(*)::bigint as usage_count
  from public.users
  where job_industry_id is not null
  group by job_industry_id
  union all
  select 'sub_category'::text as entry_type, job_sub_category_id::integer as entry_id, count(*)::bigint as usage_count
  from public.users
  where job_sub_category_id is not null
  group by job_sub_category_id
  union all
  select 'role'::text as entry_type, job_role_id::integer as entry_id, count(*)::bigint as usage_count
  from public.users
  where job_role_id is not null
  group by job_role_id;
end;
$$;

revoke all on function public.get_job_taxonomy_usage() from public;
revoke all on function public.get_job_taxonomy_usage() from anon;
grant execute on function public.get_job_taxonomy_usage() to authenticated;
