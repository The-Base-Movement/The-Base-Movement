-- SECURITY FIX: Remove user-agent fallback from evaluate_admin_device
--
-- The previous migration added a fallback: if a fingerprint mismatches but the
-- user-agent string matches, the login is allowed and the fingerprint is updated.
-- This is insecure because user-agent strings (e.g. Chrome on Windows 10) are
-- completely generic and identical across many different machines. A different
-- physical workstation on the same network with the same browser/OS passes the
-- check, defeating the whole purpose of device binding.
--
-- CORRECT BEHAVIOUR: A fingerprint mismatch is ALWAYS a block, regardless of
-- user-agent. If a leader changes workstations, an IT admin resets the slot.

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

  -- ── No slot yet: enrol this device ──────────────────────────────────────────
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

  -- ── Slot is manually/administratively blocked ────────────────────────────────
  ELSIF v_device.status = 'blocked' THEN
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'slot_blocked';

  -- ── Fingerprint matches: verified login ──────────────────────────────────────
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

  -- ── Fingerprint mismatch: ALWAYS block — different device or tampered hash ───
  -- User-agent is NOT a reliable device identifier (same string across machines).
  -- A slot reset by IT is required to register a new workstation.
  ELSE
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
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
