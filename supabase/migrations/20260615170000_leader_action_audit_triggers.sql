-- Phase 2 of leader activity capture: guarantee that EVERY action a privileged
-- leader performs on a key admin table is recorded, without sprinkling
-- logAction() across ~120 service methods. A single generic AFTER trigger writes
-- to audit_logs, but only when the acting user is a leader role — so member
-- self-service writes and system/service-role writes (auth.uid() is null) are
-- ignored, keeping volume focused and avoiding duplication with the manual
-- non-leader audit logs already produced by adminService/contentService/etc.

create or replace function public.audit_admin_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_role text;
  v_rec  jsonb;
  v_id   text;
begin
  -- No authenticated user (service role / system / edge function) → skip.
  if v_uid is null then
    return coalesce(new, old);
  end if;

  -- Only capture privileged leader roles.
  select a.role into v_role from admins a where a.id = v_uid;
  if v_role is null or not is_leader_role(v_role) then
    return coalesce(new, old);
  end if;

  v_rec := to_jsonb(coalesce(new, old));
  v_id := coalesce(v_rec ->> 'id', v_rec ->> 'user_id', v_rec ->> 'uuid', '');

  insert into audit_logs (action, resource, status, admin_id, metadata)
  values (
    tg_op,
    tg_table_name || case when v_id <> '' then '/' || v_id else '' end,
    'Success',
    v_uid,
    jsonb_build_object('op', tg_op, 'table', tg_table_name, 'via', 'trigger')
  );

  return coalesce(new, old);
end;
$$;

-- Attach the trigger to the curated set of key admin tables. Member-facing and
-- high-churn tables (users, blog_posts, donations, store_*, *_votes, messages,
-- notifications, member_*, etc.) and tables already covered by manual logAction
-- are intentionally excluded. Idempotent: safe to re-run.
do $$
declare
  t text;
  audited_tables text[] := array[
    -- Logistics / assets
    'assets', 'asset_assignments', 'asset_requests', 'asset_maintenance_logs',
    'asset_categories', 'resource_requests', 'gotv_transport_requests',
    -- Polls (admin-managed; member votes excluded)
    'polls', 'poll_options',
    -- Jobs & taxonomy
    'jobs', 'job_applications', 'job_industries', 'job_sub_categories', 'job_roles',
    -- Newsletter (admin sends; subscribers excluded)
    'newsletters',
    -- Roles & permissions
    'admin_roles', 'admin_role_permissions',
    -- Constituency management
    'constituency_activities', 'constituency_announcements', 'constituency_leaders',
    -- Field / tactical / GOTV
    'field_actions', 'field_directives', 'field_events', 'field_reports',
    'field_agent_assignments', 'crisis_incidents', 'rapid_response_directives',
    'polling_stations', 'polling_station_agents',
    -- Intelligence
    'national_sentiment_intelligence', 'predictive_impact_projections',
    'media_counter_narratives', 'canvassing_campaigns',
    -- Messaging (admin broadcasts only; chat excluded)
    'broadcasts',
    -- Finance
    'finance_requests', 'spending_categories', 'donation_campaigns',
    -- KYC (admin verify / upload on behalf)
    'member_kyc',
    -- Redirects
    'redirect_rules',
    -- Chapter sub-tables (base 'chapters' already manually logged)
    'chapter_announcements', 'chapter_meetings', 'chapter_activities',
    'chapter_polls', 'chapter_poll_candidates', 'chapter_applications', 'chapter_requests',
    -- IT department (IT Manager is a leader role)
    'it_projects', 'it_licenses', 'it_security_protocols', 'it_tickets',
    'it_notes', 'it_todos', 'it_hierarchy',
    -- Press / officials / config
    'press_releases', 'party_officials', 'party_tiers', 'movement_milestones'
  ];
begin
  foreach t in array audited_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('drop trigger if exists trg_audit_admin on public.%I', t);
      execute format(
        'create trigger trg_audit_admin after insert or update or delete on public.%I
           for each row execute function public.audit_admin_action()', t);
    end if;
  end loop;
end;
$$;
