-- Weekly security digest: invoke the security-digest edge function every Monday
-- 08:00 UTC. Mirrors the existing scheduler jobs (empty headers; function is
-- verify_jwt=false and uses its own service-role key internally).
select cron.schedule(
  'security-digest-weekly',
  '0 8 * * 1',
  $$select net.http_post(
      url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/security-digest',
      headers := '{}'::jsonb,
      timeout_milliseconds := 10000
  );$$
);
