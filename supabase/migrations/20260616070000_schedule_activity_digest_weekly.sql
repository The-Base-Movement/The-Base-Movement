-- Weekly "week in review" activity digest → #notifications. Fridays 16:00 UTC
-- (deliberately off Monday, when the security digest runs).
select cron.schedule(
  'activity-digest-weekly',
  '0 16 * * 5',
  $$select net.http_post(
      url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/activity-digest',
      headers := '{}'::jsonb,
      timeout_milliseconds := 10000
  );$$
);
