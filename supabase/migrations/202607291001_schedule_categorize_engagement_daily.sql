-- Daily engagement categorization cron job (02:15 UTC, after trash purge at 02:00)
-- Calls the categorize-engagement-daily edge function to update member engagement_status
-- based on last_sign_in_at timestamps.

-- Remove stale job if it already exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'categorize-engagement-daily') THEN
    PERFORM cron.unschedule('categorize-engagement-daily');
  END IF;
END;
$$;

-- Schedule: run daily at 02:15 UTC.
-- The Authorization header is required: the edge function gates on
-- requireServiceRoleCall, so an empty headers object returns 401 on every run.
SELECT cron.schedule(
  'categorize-engagement-daily',
  '15 2 * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/categorize-engagement-daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_token')
    ),
    timeout_milliseconds := 10000
  );
  $$
);
