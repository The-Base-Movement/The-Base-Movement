-- Per-member job rows for the Jobs Analytics Dashboard. Role-gated so only the
-- approved privileged roles can read aggregate member job data. The frontend
-- aggregates/filters these rows client-side (SPA drill-down, no reload).
create or replace function public.get_job_analytics_rows()
returns table (
  industry_id smallint,
  industry_name text,
  sub_category_id smallint,
  sub_category_name text,
  role_id integer,
  role_name text,
  level text,
  custom_title text,
  is_custom boolean
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
  select
    u.job_industry_id,
    i.name,
    u.job_sub_category_id,
    sc.name,
    u.job_role_id,
    r.name,
    coalesce(r.level, case when u.job_custom_title is not null then 'Other' end),
    u.job_custom_title,
    (u.job_role_id is null and u.job_custom_title is not null) as is_custom
  from public.users u
  left join public.job_industries i on i.id = u.job_industry_id
  left join public.job_sub_categories sc on sc.id = u.job_sub_category_id
  left join public.job_roles r on r.id = u.job_role_id
  where u.job_industry_id is not null
     or u.job_role_id is not null
     or u.job_custom_title is not null;
end;
$$;

revoke all on function public.get_job_analytics_rows() from public;
revoke all on function public.get_job_analytics_rows() from anon;
grant execute on function public.get_job_analytics_rows() to authenticated;
