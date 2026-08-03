-- Real-time #leaders-audit feed: when an audit_logs row is written for one of
-- the privileged leader roles, async-POST it to discord-notify (channel
-- 'leaders') via pg_net. Mirrors the Leaders Auth · All Activity page filter.
-- Uses the public anon key (safe to embed) as the verify_jwt bearer.
create or replace function public.discord_leader_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from admins where id = new.admin_id;
  if v_role is null or not is_leader_role(v_role) then
    return new;
  end if;

  perform net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/discord-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobHlla3l4dXR3Ynhsdmt0bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzczMjIsImV4cCI6MjA5MzM1MzMyMn0.yxmjdocH43opZY_kR2WgrsXVqMSTEhJDyObI1slygiY',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobHlla3l4dXR3Ynhsdmt0bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzczMjIsImV4cCI6MjA5MzM1MzMyMn0.yxmjdocH43opZY_kR2WgrsXVqMSTEhJDyObI1slygiY'
    ),
    body := jsonb_build_object(
      'channel', 'leaders',
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', '🛡️ Leader Action',
        'color', 3447003,
        'fields', jsonb_build_array(
          jsonb_build_object('name', 'Role', 'value', v_role, 'inline', true),
          jsonb_build_object('name', 'Action', 'value', coalesce(new.action, '—'), 'inline', true),
          jsonb_build_object('name', 'Resource', 'value', coalesce(new.resource, '—'), 'inline', true),
          jsonb_build_object('name', 'Status', 'value', coalesce(new.status, '—'), 'inline', true)
        ),
        'timestamp', coalesce(new.timestamp, now())
      ))
    )
  );
  return new;
exception when others then
  -- Never let notification failure block the audit insert.
  return new;
end;
$$;

drop trigger if exists trg_discord_leader_audit on public.audit_logs;
create trigger trg_discord_leader_audit
after insert on public.audit_logs
for each row execute function public.discord_leader_audit();
