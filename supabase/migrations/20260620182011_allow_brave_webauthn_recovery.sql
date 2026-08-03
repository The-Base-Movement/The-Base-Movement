-- Brave is the only browser accepted for privileged device verification.
-- A changed browser fingerprint is recoverable only when the occupied slot
-- already has WebAuthn enrolled. The fingerprint is rebound only after a
-- successful WebAuthn assertion calls confirm_admin_device_step_up.

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
  v_device       public.admin_devices%ROWTYPE;
  v_decision     TEXT;
  v_log_action   TEXT;
  v_isp_changed  BOOLEAN := false;
  v_block_reason TEXT := NULL;
BEGIN
  IF p_device_type NOT IN ('desktop', 'tablet', 'mobile') THEN
    RAISE EXCEPTION 'invalid device_type: %', p_device_type;
  END IF;

  SELECT * INTO v_device
  FROM public.admin_devices
  WHERE admin_id = p_admin_id AND device_type = p_device_type;

  IF COALESCE(p_browser, '') <> 'Brave' THEN
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'non_brave_browser';

  ELSIF NOT FOUND THEN
    INSERT INTO public.admin_devices (
      admin_id, role, device_type, device_name, os_type, browser,
      fingerprint_hash, ip_address, location, user_agent, isp
    ) VALUES (
      p_admin_id, p_role, p_device_type, p_device_name, p_os_type, 'Brave',
      p_fingerprint_hash, p_ip, p_location, p_user_agent, p_isp
    )
    RETURNING * INTO v_device;
    v_decision   := 'enrolled';
    v_log_action := 'enrolled';

  ELSIF v_device.status = 'blocked' THEN
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'slot_blocked';

  ELSIF v_device.fingerprint_hash = p_fingerprint_hash THEN
    v_isp_changed := COALESCE(v_device.isp, '') <> COALESCE(p_isp, '');

    UPDATE public.admin_devices
    SET last_seen  = now(),
        browser    = 'Brave',
        ip_address = p_ip,
        location   = p_location,
        user_agent = p_user_agent,
        isp        = p_isp
    WHERE admin_devices.id = v_device.id
    RETURNING * INTO v_device;

    v_decision   := 'verified';
    v_log_action := CASE WHEN v_isp_changed THEN 'isp_change' ELSE 'verified' END;

  ELSIF v_device.webauthn_enrolled THEN
    v_decision     := 'step_up_required';
    v_log_action   := 'step_up_required';
    v_block_reason := 'fingerprint_reverification_required';

  ELSE
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'fingerprint_mismatch';
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action,
    ip_address, location, user_agent, isp, metadata
  ) VALUES (
    p_admin_id, v_device.id, p_device_type, v_log_action,
    p_ip, p_location, p_user_agent, p_isp,
    jsonb_build_object(
      'fingerprint_hash', p_fingerprint_hash,
      'isp', p_isp,
      'isp_changed', v_isp_changed,
      'decision', v_decision,
      'block_reason', v_block_reason,
      'browser', p_browser,
      'os_type', p_os_type
    )
  );

  RETURN jsonb_build_object(
    'decision', v_decision,
    'device_id', v_device.id,
    'webauthn_required',
      CASE
        WHEN v_decision = 'enrolled' THEN true
        WHEN v_decision = 'verified' THEN NOT v_device.webauthn_enrolled
        WHEN v_decision = 'step_up_required' THEN true
        ELSE false
      END,
    'reason', v_block_reason
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.confirm_admin_device_step_up(
  p_device_id        UUID,
  p_fingerprint_hash TEXT,
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
  v_device public.admin_devices%ROWTYPE;
BEGIN
  IF NULLIF(BTRIM(p_fingerprint_hash), '') IS NULL THEN
    RAISE EXCEPTION 'fingerprint_hash is required';
  END IF;

  UPDATE public.admin_devices
  SET fingerprint_hash = p_fingerprint_hash,
      browser           = 'Brave',
      ip_address        = p_ip,
      location          = p_location,
      user_agent        = p_user_agent,
      isp               = p_isp,
      last_seen         = now()
  WHERE id = p_device_id AND status = 'active'
  RETURNING * INTO v_device;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active device not found: %', p_device_id;
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action,
    ip_address, location, user_agent, isp, metadata
  ) VALUES (
    v_device.admin_id, v_device.id, v_device.device_type, 'step_up_passed',
    p_ip, p_location, p_user_agent, p_isp,
    jsonb_build_object(
      'fingerprint_hash', p_fingerprint_hash,
      'isp', p_isp,
      'browser', 'Brave',
      'rebound_after_webauthn', true
    )
  );

  RETURN jsonb_build_object('decision', 'verified', 'device_id', v_device.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_admin_device_step_up(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_admin_device_step_up(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;
