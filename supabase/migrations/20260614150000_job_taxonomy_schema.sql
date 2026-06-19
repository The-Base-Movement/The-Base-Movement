-- Job taxonomy (master list) — 7 industries > 35 sub-categories > 175 roles.
create table if not exists public.job_industries (
  id smallint primary key,
  name text not null unique,
  sort_order smallint not null default 0
);

create table if not exists public.job_sub_categories (
  id smallint primary key,
  industry_id smallint not null references public.job_industries(id) on delete cascade,
  code text not null unique,
  name text not null,
  sort_order smallint not null default 0,
  unique (industry_id, name)
);

create table if not exists public.job_roles (
  id serial primary key,
  sub_category_id smallint not null references public.job_sub_categories(id) on delete cascade,
  name text not null,
  level text not null default 'Professional',
  sort_order smallint not null default 0,
  unique (sub_category_id, name)
);

create index if not exists idx_job_sub_categories_industry on public.job_sub_categories(industry_id);
create index if not exists idx_job_roles_sub_category on public.job_roles(sub_category_id);

-- Taxonomy is public-readable (registration runs as anon/just-signed-up users);
-- writes are admin-only.
alter table public.job_industries enable row level security;
alter table public.job_sub_categories enable row level security;
alter table public.job_roles enable row level security;

drop policy if exists job_industries_read on public.job_industries;
drop policy if exists job_sub_categories_read on public.job_sub_categories;
drop policy if exists job_roles_read on public.job_roles;
create policy job_industries_read on public.job_industries for select to anon, authenticated using (true);
create policy job_sub_categories_read on public.job_sub_categories for select to anon, authenticated using (true);
create policy job_roles_read on public.job_roles for select to anon, authenticated using (true);

drop policy if exists job_industries_admin_write on public.job_industries;
drop policy if exists job_sub_categories_admin_write on public.job_sub_categories;
drop policy if exists job_roles_admin_write on public.job_roles;
create policy job_industries_admin_write on public.job_industries for all to authenticated using (is_admin()) with check (is_admin());
create policy job_sub_categories_admin_write on public.job_sub_categories for all to authenticated using (is_admin()) with check (is_admin());
create policy job_roles_admin_write on public.job_roles for all to authenticated using (is_admin()) with check (is_admin());

grant select on public.job_industries to anon, authenticated;
grant select on public.job_sub_categories to anon, authenticated;
grant select on public.job_roles to anon, authenticated;
grant usage, select on sequence public.job_roles_id_seq to authenticated;

-- Member job selection (mirrors profession's grants: anon+authenticated S/I/U).
alter table public.users
  add column if not exists job_industry_id smallint references public.job_industries(id),
  add column if not exists job_sub_category_id smallint references public.job_sub_categories(id),
  add column if not exists job_role_id integer references public.job_roles(id),
  add column if not exists job_custom_title text;

grant select (job_industry_id), insert (job_industry_id), update (job_industry_id) on public.users to anon, authenticated;
grant select (job_sub_category_id), insert (job_sub_category_id), update (job_sub_category_id) on public.users to anon, authenticated;
grant select (job_role_id), insert (job_role_id), update (job_role_id) on public.users to anon, authenticated;
grant select (job_custom_title), insert (job_custom_title), update (job_custom_title) on public.users to anon, authenticated;
