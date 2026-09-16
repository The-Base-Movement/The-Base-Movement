-- Stop two cron jobs calling edge functions when there is nothing to do, and
-- add a health check an outside monitor can poll.
--
-- The database is on Nano compute, CPU was pinned near 100% for a week, and it
-- went down for ten hours on 2026-09-16. Both jobs below are real work only a
-- tiny fraction of the time, but every run cost a pg_net HTTP call, an edge
-- function invocation and database queries regardless.

-- activity-feed-discord: every 5 minutes, posts new member activity to Discord.
-- In the week before this change only 13 of 2,016 runs had any activity to post.
-- Still every 5 minutes, so the feed stays near real time, but the edge function
-- is only called when there is activity newer than its cursor. The cursor and the
-- 15-minute default mirror what the function itself does.
select cron.schedule(
  'activity-feed-discord',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/activity-feed',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'activity_feed_cron_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  where exists (
    select 1 from public.user_activity_logs
    where created_at > coalesce(
      (select (value #>> '{}')::timestamptz from public.site_settings where key = 'activity_feed_cursor'),
      now() - interval '15 minutes'
    )
  );
  $$
);

-- member-auth-sync-backstop: created login accounts for members missing one.
-- trg_member_auth_sync on public.users already does this the moment members are
-- inserted, so this is only a backstop for a kick that was throttled or failed.
-- Every run also executed member_sync_report(), several full scans of 15k+
-- members, even though its result is only used when accounts were created.
-- Now hourly, and only calls the function when a member is actually waiting.
select cron.schedule(
  'member-auth-sync-backstop',
  '23 * * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/backfill-auth',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'backfill_job_token' limit 1), '')
    ),
    body := jsonb_build_object('auto', true, 'dryRun', false, 'source', 'cron'),
    timeout_milliseconds := 60000
  )
  where exists (select 1 from public.get_unprovisioned_member_ids(1));
  $$
);

-- Health check for the external monitor (.github/workflows/db-health.yml).
--
-- It has to be polled from outside: when the database is starved, cron jobs
-- inside it time out too, so a check scheduled in here goes silent at exactly
-- the moment it is needed. A monitor that gets no answer at all reports that on
-- its own; this function adds early warning while the database still answers.
--
-- Callable by anon. Returns aggregate numbers only: no query text, no user data.
create or replace function public.db_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_longest int;
  v_conn_pct int;
  v_cron_failed int;
  v_issues text[] := '{}';
begin
  -- Background processes (checkpointer, pg_cron launcher, pg_net worker) have no
  -- state and idle API connections are 'idle', so neither trips this.
  select coalesce(max(extract(epoch from now() - coalesce(a.xact_start, a.query_start))), 0)::int
    into v_longest
  from pg_catalog.pg_stat_activity a
  where a.pid <> pg_catalog.pg_backend_pid()
    and a.state in ('active', 'idle in transaction', 'idle in transaction (aborted)');

  select (count(*) * 100 / current_setting('max_connections')::int)::int
    into v_conn_pct
  from pg_catalog.pg_stat_activity
  where backend_type = 'client backend';

  -- job_run_details is only indexed on runid, so look at recent runids rather
  -- than scanning the whole table by start_time. 200 runs covers many hours.
  select count(*)
    into v_cron_failed
  from cron.job_run_details d
  where d.runid > (select coalesce(max(runid), 0) - 200 from cron.job_run_details)
    and d.status = 'failed'
    and d.start_time > now() - interval '15 minutes';

  if v_longest > 300 then
    v_issues := v_issues || format('A query has been running for %s minutes', v_longest / 60);
  end if;
  if v_conn_pct >= 85 then
    v_issues := v_issues || format('Connections at %s%% of the limit', v_conn_pct);
  end if;
  if v_cron_failed >= 3 then
    v_issues := v_issues || format('%s scheduled jobs failed in the last 15 minutes', v_cron_failed);
  end if;

  return jsonb_build_object(
    'ok', cardinality(v_issues) = 0,
    'issues', to_jsonb(v_issues),
    'longest_query_s', v_longest,
    'connections_pct', v_conn_pct,
    'cron_failed_15m', v_cron_failed,
    'checked_at', now()
  );
end;
$$;

revoke all on function public.db_health() from public;
grant execute on function public.db_health() to anon, authenticated;
