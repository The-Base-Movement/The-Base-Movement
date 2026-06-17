-- Enforce single-device occupancy per admin/device-type slot.
-- A fingerprint mismatch on an occupied slot is denied and logged, but does
-- not overwrite or block the enrolled slot itself.

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
  p_user_agent       TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device   public.admin_devices%ROWTYPE;
  v_decision TEXT;
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
      fingerprint_hash, ip_address, location, user_agent
    ) VALUES (
      p_admin_id, p_role, p_device_type, p_device_name, p_os_type, p_browser,
      p_fingerprint_hash, p_ip, p_location, p_user_agent
    )
    RETURNING * INTO v_device;

    v_decision := 'enrolled';
  ELSIF v_device.status = 'blocked' THEN
    v_decision := 'blocked';
  ELSIF v_device.fingerprint_hash = p_fingerprint_hash THEN
    UPDATE public.admin_devices
    SET last_seen = now(), ip_address = p_ip, location = p_location
    WHERE id = v_device.id
    RETURNING * INTO v_device;

    v_decision := 'verified';
  ELSE
    v_decision := 'blocked';
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action, ip_address, location, user_agent, metadata
  ) VALUES (
    p_admin_id, v_device.id, p_device_type, v_decision, p_ip, p_location, p_user_agent,
    jsonb_build_object('fingerprint_hash', p_fingerprint_hash)
  );

  RETURN jsonb_build_object(
    'decision',         v_decision,
    'device_id',        v_device.id,
    'webauthn_required',
      CASE WHEN v_decision = 'enrolled' THEN true
           WHEN v_decision = 'verified' THEN NOT v_device.webauthn_enrolled
           ELSE false END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_admin_device_step_up(
  p_device_id        UUID,
  p_fingerprint_hash TEXT,
  p_ip               TEXT,
  p_location         TEXT,
  p_user_agent       TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device public.admin_devices%ROWTYPE;
BEGIN
  UPDATE public.admin_devices
  SET ip_address = p_ip,
      location   = p_location,
      user_agent = p_user_agent,
      last_seen  = now()
  WHERE id = p_device_id
  RETURNING * INTO v_device;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device not found: %', p_device_id;
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action, ip_address, location, user_agent, metadata
  ) VALUES (
    v_device.admin_id, v_device.id, v_device.device_type, 'step_up_passed',
    p_ip, p_location, p_user_agent,
    jsonb_build_object('fingerprint_hash', p_fingerprint_hash)
  );

  RETURN jsonb_build_object('decision', 'verified', 'device_id', v_device.id);
END;
$$;
