-- Nightly voice-note purge. Without this the 60-second cap only slows storage
-- growth instead of bounding it, because nothing else ever deletes an expired
-- message or its audio.
--
-- net.http_post (not extensions.http_post) with a real Vault token, matching the
-- other cron→edge jobs in this project. The function is registered in
-- supabase/config.toml with verify_jwt = false, because CRON_TOKEN is a dedicated
-- secret rather than a JWT and the gateway would otherwise reject the call before
-- the handler runs.

select cron.unschedule('purge-expired-voice-notes')
where exists (select 1 from cron.job where jobname = 'purge-expired-voice-notes');

select cron.schedule(
  'purge-expired-voice-notes',
  '30 3 * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/purge-expired-voice-notes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
