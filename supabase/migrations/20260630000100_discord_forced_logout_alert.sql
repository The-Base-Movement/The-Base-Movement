-- Real-time #alerts feed: post a Discord embed whenever a forced_logout row is
-- written to user_activity_logs (concurrent login detected on another device/tab).
-- Uses pg_net async HTTP POST — never blocks the insert on Discord latency.

create or replace function public.discord_forced_logout_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_reg  text;
begin
  if new.action_type <> 'forced_logout' then
    return new;
  end if;

  select name, id into v_name, v_reg
  from public.users
  where id = new.user_id
  limit 1;

  perform net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/discord-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', COALESCE((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key' LIMIT 1), (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1), ''),
      'Authorization', 'Bearer ' || COALESCE((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key' LIMIT 1), (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1), '')
    ),
    body := jsonb_build_object(
      'channel', 'alerts',
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', '⚠️ Concurrent Login — Session Forced Out',
        'color', 16744272,
        'fields', jsonb_build_array(
          jsonb_build_object('name', 'Member', 'value', coalesce(v_name, 'Unknown'), 'inline', true),
          jsonb_build_object('name', 'Reg No', 'value', coalesce(v_reg, '—'), 'inline', true),
          jsonb_build_object('name', 'Reason', 'value', 'New login on another device or tab', 'inline', false)
        ),
        'timestamp', new.created_at
      ))
    )
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_discord_forced_logout_alert on public.user_activity_logs;
create trigger trg_discord_forced_logout_alert
after insert on public.user_activity_logs
for each row execute function public.discord_forced_logout_alert();
