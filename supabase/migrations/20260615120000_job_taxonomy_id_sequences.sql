-- Give job_industries.id and job_sub_categories.id auto-incrementing defaults
-- (job_roles.id already has one). Lets the admin Job Taxonomy manager INSERT new
-- rows without computing ids client-side (race-safe).

create sequence if not exists job_industries_id_seq as smallint;
create sequence if not exists job_sub_categories_id_seq as smallint;

-- Point sequences past the current max so seeded rows are never reused.
select setval('job_industries_id_seq', coalesce((select max(id) from public.job_industries), 0));
select setval('job_sub_categories_id_seq', coalesce((select max(id) from public.job_sub_categories), 0));

alter table public.job_industries alter column id set default nextval('job_industries_id_seq');
alter table public.job_sub_categories alter column id set default nextval('job_sub_categories_id_seq');

alter sequence job_industries_id_seq owned by public.job_industries.id;
alter sequence job_sub_categories_id_seq owned by public.job_sub_categories.id;
