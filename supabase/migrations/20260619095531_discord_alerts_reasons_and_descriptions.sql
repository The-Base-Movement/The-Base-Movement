-- 1. Update evaluate_admin_device to track and return block reasons
CREATE OR REPLACE FUNCTION public.evaluate_admin_device(
  p_admin_id         UUID,
  p_role             TEXT,
  p_device_type      TEXT,
  p_fingerprint_hash TEXT,
  p_device_name      TEXT,
  p_os_type          TEXT,
  p_browser          TEXT,
  p_ip               TEXT,
  p_location         TEXT,
  p_user_agent       TEXT,
  p_isp              TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device      public.admin_devices%ROWTYPE;
  v_decision    TEXT;
  v_log_action  TEXT;
  v_isp_changed BOOLEAN;
  v_block_reason TEXT := NULL;
BEGIN
  IF p_device_type NOT IN ('desktop','tablet','mobile') THEN
    RAISE EXCEPTION 'invalid device_type: %', p_device_type;
  END IF;

  SELECT * INTO v_device
  FROM public.admin_devices
  WHERE admin_id = p_admin_id AND device_type = p_device_type;

  IF NOT FOUND THEN
    INSERT INTO public.admin_devices (
      admin_id, role, device_type, device_name, os_type, browser,
      fingerprint_hash, ip_address, location, user_agent, isp
    ) VALUES (
      p_admin_id, p_role, p_device_type, p_device_name, p_os_type, p_browser,
      p_fingerprint_hash, p_ip, p_location, p_user_agent, p_isp
    )
    RETURNING * INTO v_device;
    v_decision   := 'enrolled';
    v_log_action := 'enrolled';

  ELSIF v_device.status = 'blocked' THEN
    v_decision   := 'blocked';
    v_log_action := 'blocked';
    v_block_reason := 'slot_blocked';

  ELSIF v_device.fingerprint_hash = p_fingerprint_hash THEN
    v_isp_changed := COALESCE(v_device.isp, '') <> COALESCE(p_isp, '');

    UPDATE public.admin_devices
    SET last_seen  = now(),
        ip_address = p_ip,
        location   = p_location,
        user_agent = p_user_agent,
        isp        = p_isp
    WHERE admin_devices.id = v_device.id
    RETURNING * INTO v_device;
    v_decision   := 'verified';
    v_log_action := CASE WHEN v_isp_changed THEN 'isp_change' ELSE 'verified' END;

  ELSE
    v_decision   := 'blocked';
    v_log_action := 'blocked';
    v_block_reason := 'fingerprint_mismatch';
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action,
    ip_address, location, user_agent, isp,
    metadata
  ) VALUES (
    p_admin_id, v_device.id, p_device_type, v_log_action,
    p_ip, p_location, p_user_agent, p_isp,
    jsonb_build_object(
      'fingerprint_hash', p_fingerprint_hash,
      'isp',              p_isp,
      'isp_changed',      COALESCE(v_isp_changed, false),
      'decision',         v_decision,
      'block_reason',     v_block_reason
    )
  );

  RETURN jsonb_build_object(
    'decision',         v_decision,
    'device_id',        v_device.id,
    'webauthn_required',
      CASE WHEN v_decision = 'enrolled'          THEN true
           WHEN v_decision = 'verified'          THEN NOT v_device.webauthn_enrolled
           WHEN v_decision = 'step_up_required'  THEN true
           ELSE false END,
    'reason',           v_block_reason
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;


-- 2. Update discord_leader_device_activity to build and include a dynamic, descriptive reason/description
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
  -- Get the admin's name and role
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
    WHEN NEW.action = 'step_up_required' THEN 'Biometric step-up verification required (due to ISP or network change).'
    WHEN NEW.action = 'step_up_passed' THEN 'Passed biometric step-up verification.'
    WHEN NEW.action = 'slot_reset' THEN 'Device slot cleared by administrator.'
    WHEN NEW.action = 'blocked' THEN 
      CASE 
        WHEN NEW.metadata->>'block_reason' = 'slot_blocked' THEN '🔴 Device blocked: This device slot is manually or automatically locked/blocked.'
        WHEN NEW.metadata->>'block_reason' = 'fingerprint_mismatch' THEN '🔴 Device blocked: A different device (fingerprint mismatch) attempted to access this occupied slot.'
        ELSE '🔴 Device blocked: Fingerprint mismatch or slot locked.'
      END
    WHEN NEW.action = 'isp_change' THEN 'A network / ISP change was detected on the registered device.'
    WHEN NEW.action = 'logout' THEN 'Signed out of device.'
    ELSE 'Leader device activity event.'
  END;

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
        'description', v_description,
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


-- 3. Update discord_leader_audit trigger function to include a description describing what was done
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

  v_description := COALESCE(v_name, 'Unknown') || ' (' || COALESCE(v_role, 'Unknown') || ') performed action ' || COALESCE(NEW.action, '—') || ' on ' || COALESCE(NEW.resource, '—') || '.';

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
          jsonb_build_object('name', 'Role', 'value', v_role, 'inline', true),
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
  -- Never let notification failure block the audit insert.
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.discord_leader_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discord_leader_audit() TO authenticated, service_role;
