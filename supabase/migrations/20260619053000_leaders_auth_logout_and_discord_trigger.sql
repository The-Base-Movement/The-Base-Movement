-- 1. Drop the old check constraint and recreate it to include 'logout'
ALTER TABLE public.admin_device_activity
  DROP CONSTRAINT IF EXISTS admin_device_activity_action_check;

ALTER TABLE public.admin_device_activity
  ADD CONSTRAINT admin_device_activity_action_check
  CHECK (action IN ('enrolled', 'verified', 'step_up_required', 'step_up_passed', 'slot_reset', 'blocked', 'isp_change', 'logout'));

-- 2. Define the log_admin_device_logout function
CREATE OR REPLACE FUNCTION public.log_admin_device_logout(
  p_admin_id         UUID,
  p_fingerprint_hash TEXT,
  p_ip               TEXT,
  p_location         TEXT,
  p_user_agent       TEXT,
  p_isp              TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_device_id   UUID;
  v_device_type TEXT;
BEGIN
  -- Find the registered device matching this fingerprint and admin
  SELECT id, device_type INTO v_device_id, v_device_type
  FROM public.admin_devices
  WHERE admin_id = p_admin_id AND fingerprint_hash = p_fingerprint_hash
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.admin_device_activity (
      admin_id, device_id, device_type, action,
      ip_address, location, user_agent, isp,
      metadata
    ) VALUES (
      p_admin_id, v_device_id, v_device_type, 'logout',
      p_ip, p_location, p_user_agent, p_isp,
      jsonb_build_object(
        'fingerprint_hash', p_fingerprint_hash,
        'decision',         'logout'
      )
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_device_logout(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_device_logout(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 3. Define the discord_leader_device_activity function to post all admin device events to Discord
CREATE OR REPLACE FUNCTION public.discord_leader_device_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  -- Get the admin's name and role
  SELECT a.role, u.full_name INTO v_role, v_name
  FROM admins a
  JOIN users u ON u.id = a.id
  WHERE a.id = NEW.admin_id;

  IF v_role IS NULL OR NOT is_leader_role(v_role) THEN
    RETURN NEW;
  END IF;

  -- Post to the leaders Discord channel using supabase HTTP proxy net.http_post
  PERFORM net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/discord-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobHlla3l4dXR3Ynhsdmt0bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzczMjIsImV4cCI6MjA5MzM1MzMyMn0.yxmjdocH43opZY_kR2WgrsXVqMSTEhJDyObI1slygiY',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobHlla3l4dXR3Ynhsdmt0bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzczMjIsImV4cCI6MjA5MzM1MzMyMn0.yxmjdocH43opZY_kR2WgrsXVqMSTEhJDyObI1slygiY'
    ),
    body := jsonb_build_object(
      'channel', 'leaders',
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', '📱 Leader Device Event',
        'color', CASE 
          WHEN NEW.action = 'blocked' THEN 13504806 -- Red
          WHEN NEW.action = 'isp_change' THEN 16753920 -- Orange
          WHEN NEW.action = 'step_up_required' THEN 16776960 -- Yellow
          ELSE 3447003 -- Blue
        END,
        'fields', jsonb_build_array(
          jsonb_build_object('name', 'Leader', 'value', coalesce(v_name, 'Unknown'), 'inline', true),
          jsonb_build_object('name', 'Role', 'value', v_role, 'inline', true),
          jsonb_build_object('name', 'Action', 'value', coalesce(NEW.action, '—'), 'inline', true),
          jsonb_build_object('name', 'Device Type', 'value', coalesce(NEW.device_type, '—'), 'inline', true),
          jsonb_build_object('name', 'IP Address', 'value', coalesce(NEW.ip_address, '—'), 'inline', true),
          jsonb_build_object('name', 'ISP', 'value', coalesce(NEW.isp, '—'), 'inline', true),
          jsonb_build_object('name', 'Location', 'value', coalesce(NEW.location, '—'), 'inline', true)
        ),
        'timestamp', coalesce(NEW.created_at, now())
      ))
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let notification failures block device activity registration
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.discord_leader_device_activity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discord_leader_device_activity() TO authenticated, service_role;

-- 4. Create trigger on admin_device_activity
DROP TRIGGER IF EXISTS trg_discord_leader_device_activity ON public.admin_device_activity;
CREATE TRIGGER trg_discord_leader_device_activity
AFTER INSERT ON public.admin_device_activity
FOR EACH ROW EXECUTE FUNCTION public.discord_leader_device_activity();
