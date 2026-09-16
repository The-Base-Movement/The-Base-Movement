-- Run the newsletter scheduler only when a newsletter is actually scheduled.
--
-- The newsletter-scheduler cron job ran every minute, 1,440 times a day, to poll
-- for scheduled newsletters. Six newsletters have ever existed, all sent
-- immediately, so every one of those runs found nothing. On Nano compute each
-- run still cost a pg_cron worker, an HTTP call through pg_net, an edge function
-- invocation and a database query, and the job history had grown to 178k rows.
--
-- Now:
--   * Scheduling a newsletter creates a one-off cron job for that exact minute.
--   * Sending, cancelling or deleting it removes the job.
--   * "Send now" never touched the scheduler and still doesn't.
--   * A backstop runs once an hour and only calls the scheduler when something
--     is overdue. pg_cron does not catch up on a missed minute, so without it a
--     newsletter due while the database was down (as on 2026-09-16) would never
--     go out.
--
-- No edge function or frontend change: newsletter-admin writes the row, the
-- trigger below manages the job.

create or replace function public.sync_newsletter_dispatch_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := 'newsletter-dispatch-' || coalesce(new.id, old.id)::text;
  v_at timestamptz;
  v_call constant text := $call$
    select net.http_post(
      url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/newsletter-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_token')
      ),
      timeout_milliseconds := 60000
    );
  $call$;
begin
  -- Clear any existing job for this newsletter. Guarded by the lookup because
  -- cron.unschedule raises when the job is already gone, and raising here would
  -- roll back the scheduler's own "mark as sent" update -- leaving the row
  -- 'scheduled' for the backstop to send a second time.
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = v_name;

  if tg_op = 'DELETE' or new.status is distinct from 'scheduled' or new.scheduled_at is null then
    return null;
  end if;

  -- Round up to the whole minute. Cron fires at :00 seconds and the scheduler
  -- only sends rows with scheduled_at <= now(), so a job at 09:00:00 for a
  -- newsletter due 09:00:30 would find nothing and never run again.
  v_at := date_trunc('minute', new.scheduled_at);
  if v_at < new.scheduled_at then
    v_at := v_at + interval '1 minute';
  end if;

  -- Already due: call the scheduler now. pg_net sends after this commits, so
  -- the scheduler sees the row.
  if v_at <= now() then
    execute v_call;
    return null;
  end if;

  -- A dated cron expression repeats every year, so the job also removes itself
  -- as soon as it fires, whether or not the send succeeds.
  perform cron.schedule(
    v_name,
    format(
      '%s %s %s %s *',
      extract(minute from v_at at time zone 'UTC')::int,
      extract(hour from v_at at time zone 'UTC')::int,
      extract(day from v_at at time zone 'UTC')::int,
      extract(month from v_at at time zone 'UTC')::int
    ),
    v_call || format(
      ' select cron.unschedule(j.jobid) from cron.job j where j.jobname = %L;',
      v_name
    )
  );

  return null;
end;
$$;

revoke all on function public.sync_newsletter_dispatch_job() from public, anon, authenticated;

drop trigger if exists newsletter_dispatch_job on public.newsletters;
create trigger newsletter_dispatch_job
  after insert or update of status, scheduled_at or delete on public.newsletters
  for each row execute function public.sync_newsletter_dispatch_job();

-- Replace the every-minute poll with the hourly backstop. cron.schedule with an
-- existing name updates that job in place. This job previously existed only in
-- the dashboard; it is now defined here.
select cron.schedule(
  'newsletter-scheduler',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/newsletter-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_token')
    ),
    timeout_milliseconds := 60000
  )
  where exists (
    select 1 from public.newsletters
    where status = 'scheduled' and scheduled_at <= now()
  );
  $$
);

-- Give any newsletter already scheduled its one-off job. Touching scheduled_at
-- fires the trigger above. (None exist today; this keeps the migration safe to
-- apply later.)
update public.newsletters set scheduled_at = scheduled_at where status = 'scheduled';
