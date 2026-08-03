-- Self-contained security posture + activity summary for the weekly Discord
-- digest. Computed from system catalogs (config drift) and recent audit data.
-- Service-role only; the security-digest edge function calls it.
create or replace function public.security_posture_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'posture', jsonb_build_object(
      'secdef_fns_anon_executable', (
        select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
          and has_function_privilege('anon', p.oid, 'EXECUTE')),
      'storage_public_listing_policies', (
        select count(*) from pg_policy
        where polrelid = 'storage.objects'::regclass and polcmd = 'r' and 0 = any(polroles)),
      'rls_disabled_tables', (
        select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
      'always_true_policies', (
        select count(*) from pg_policy
        where pg_get_expr(polqual, polrelid) = 'true'
           or pg_get_expr(polwithcheck, polrelid) = 'true'),
      'secdef_fns_mutable_search_path', (
        select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
          and (p.proconfig is null or not exists (
            select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')))
    ),
    'activity_7d', jsonb_build_object(
      'audit_events', (select count(*) from audit_logs where "timestamp" > now() - interval '7 days'),
      'failed_or_denied_events', (select count(*) from audit_logs
        where "timestamp" > now() - interval '7 days'
          and (status ilike 'fail%' or status ilike 'error%' or status ilike 'denied%')),
      'admins_added', (select count(*) from admins where created_at > now() - interval '7 days'),
      'new_admin_devices', (select count(*) from admin_devices where created_at > now() - interval '7 days')
    ),
    'totals', jsonb_build_object(
      'admins', (select count(*) from admins),
      'verified_mfa_factors', (select count(*) from auth.mfa_factors where status = 'verified')
    )
  );
$$;

revoke execute on function public.security_posture_summary() from public;
grant execute on function public.security_posture_summary() to service_role;
