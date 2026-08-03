-- Individual leader webhook messages identify the actor by full name.
-- Roles remain available internally for authorization but are not sent.

CREATE OR REPLACE FUNCTION public.discord_leader_device_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_description text;
BEGIN
  SELECT a.role, u.full_name INTO v_role, v_name
  FROM admins a
  JOIN users u ON u.id = a.id
  WHERE a.id = NEW.admin_id;

  IF v_role IS NULL OR NOT is_leader_role(v_role) THEN
    RETURN NEW;
  END IF;

  v_description := CASE
    WHEN NEW.action = 'enrolled' THEN 'A new device has been registered and is pending biometric enrollment.'
    WHEN NEW.action = 'verified' THEN 'Device verified successfully.'
    WHEN NEW.action = 'step_up_required' THEN 'Biometric step-up verification required.'
    WHEN NEW.action = 'step_up_passed' THEN 'Passed biometric step-up verification.'
    WHEN NEW.action = 'slot_reset' THEN 'Device slot cleared by administrator.'
    WHEN NEW.action = 'blocked' THEN
      CASE
        WHEN NEW.metadata->>'block_reason' = 'slot_blocked' THEN '🔴 Device blocked: This device slot is manually or automatically locked/blocked.'
        WHEN NEW.metadata->>'block_reason' = 'fingerprint_mismatch' THEN '🔴 Device blocked: A different device (fingerprint mismatch) attempted to access this occupied slot.'
        WHEN NEW.metadata->>'block_reason' = 'non_brave_browser' THEN '🔴 Device blocked: Access attempted using an unauthorized browser. Only Brave is allowed.'
        ELSE '🔴 Device blocked: Fingerprint mismatch or slot locked.'
      END
    WHEN NEW.action = 'isp_change' THEN 'A network / ISP change was detected on the registered device.'
    WHEN NEW.action = 'logout' THEN 'Signed out of device.'
    ELSE 'Leader device activity event.'
  END;

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
        'description', v_description,
        'color', CASE
          WHEN NEW.action = 'blocked' THEN 13504806
          WHEN NEW.action = 'isp_change' THEN 16753920
          WHEN NEW.action = 'step_up_required' THEN 16776960
          ELSE 3447003
        END,
        'fields', jsonb_build_array(
          jsonb_build_object('name', 'Leader', 'value', coalesce(v_name, 'Unknown leader'), 'inline', true),
          jsonb_build_object('name', 'Action', 'value', coalesce(NEW.action, '—'), 'inline', true),
          jsonb_build_object('name', 'Device Type', 'value', coalesce(NEW.device_type, '—'), 'inline', true),
          jsonb_build_object('name', 'IP Address', 'value', coalesce(NEW.ip_address, '—'), 'inline', true),
          jsonb_build_object(
            'name', 'Browser / OS',
            'value', CASE
              WHEN NEW.metadata->>'browser' IS NOT NULL OR NEW.metadata->>'os_type' IS NOT NULL
              THEN coalesce(NEW.metadata->>'browser', '—') || ' on ' || coalesce(NEW.metadata->>'os_type', '—')
              ELSE '—'
            END,
            'inline', true
          ),
          jsonb_build_object('name', 'ISP', 'value', coalesce(NEW.isp, '—'), 'inline', true),
          jsonb_build_object('name', 'Location', 'value', coalesce(NEW.location, '—'), 'inline', true)
        ),
        'timestamp', coalesce(NEW.created_at, now())
      ))
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.discord_leader_device_activity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discord_leader_device_activity() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.discord_leader_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_description text;
BEGIN
  SELECT a.role, u.full_name INTO v_role, v_name
  FROM admins a
  JOIN users u ON u.id = a.id
  WHERE a.id = NEW.admin_id;

  IF v_role IS NULL OR NOT is_leader_role(v_role) THEN
    RETURN NEW;
  END IF;

  v_description := COALESCE(v_name, 'Unknown leader') || ' performed action ' ||
    COALESCE(NEW.action, '—') || ' on ' || COALESCE(NEW.resource, '—') || '.';

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
        'title', '🛡️ Leader Action',
        'color', 3447003,
        'description', v_description,
        'fields', jsonb_build_array(
          jsonb_build_object('name', 'Leader', 'value', coalesce(v_name, 'Unknown leader'), 'inline', true),
          jsonb_build_object('name', 'Action', 'value', coalesce(NEW.action, '—'), 'inline', true),
          jsonb_build_object('name', 'Resource', 'value', coalesce(NEW.resource, '—'), 'inline', true),
          jsonb_build_object('name', 'Status', 'value', coalesce(NEW.status, '—'), 'inline', true)
        ),
        'timestamp', coalesce(NEW.timestamp, now())
      ))
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.discord_leader_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discord_leader_audit() TO authenticated, service_role;
