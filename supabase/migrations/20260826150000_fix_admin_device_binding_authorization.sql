-- CRITICAL: evaluate_admin_device and confirm_admin_device_step_up (the
-- core of the 3-factor admin device-binding system for privileged roles)
-- had NO caller-authorization check at all. Both are SECURITY DEFINER,
-- GRANTed to authenticated directly, and callable via a raw
-- supabase.rpc() call bypassing the edge functions (capture-admin-device,
-- webauthn) that correctly derive identity from a verified JWT before
-- calling them.
--
-- Confirmed exploitable live against a real admin's device row (restored
-- immediately after, no trace left): any authenticated non-admin member
-- could call confirm_admin_device_step_up directly with an arbitrary
-- p_device_id and attacker-chosen fingerprint_hash, with ZERO WebAuthn
-- verification, and rebind ANY privileged admin's (FOUNDER, SUPER_ADMIN,
-- BOARD_CHAIR, etc.) device fingerprint to a value the attacker controls
-- -- a full bypass of the device-binding security model, enabling
-- potential admin account/session hijacking.

CREATE OR REPLACE FUNCTION public.evaluate_admin_device(
  p_admin_id uuid,
  p_role text,
  p_device_type text,
  p_fingerprint_hash text,
  p_device_name text,
  p_os_type text,
  p_browser text,
  p_ip text,
  p_location text,
  p_user_agent text,
  p_isp text
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
  IF auth.uid() IS NULL OR auth.uid() != p_admin_id THEN
    RAISE EXCEPTION 'not_authorized: caller does not match p_admin_id';
  END IF;

  IF p_device_type NOT IN ('desktop', 'tablet', 'mobile') THEN
    RAISE EXCEPTION 'invalid device_type: %', p_device_type;
  END IF;

  SELECT * INTO v_device
  FROM public.admin_devices
  WHERE admin_id = p_admin_id AND device_type = p_device_type;

  -- Self-heal: If the device slot is found but not marked enrolled, check if
  -- credentials actually exist. Checking admin_id instead of device_id allows
  -- cross-device step-ups (e.g. using a desktop passkey to recover a mobile slot).
  IF FOUND AND NOT v_device.webauthn_enrolled THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_webauthn_credentials
      WHERE admin_id = p_admin_id
    ) INTO v_device.webauthn_enrolled;

    IF v_device.webauthn_enrolled THEN
      UPDATE public.admin_devices
      SET webauthn_enrolled = true
      WHERE id = v_device.id;
    END IF;
  END IF;

  -- 1. Brave is the only accepted browser.
  IF COALESCE(p_browser, '') <> 'Brave' THEN
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'non_brave_browser';

  -- 2. No slot yet -> enrol.
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

  -- 3. Slot manually blocked.
  ELSIF v_device.status = 'blocked' THEN
    v_decision     := 'blocked';
    v_log_action   := 'blocked';
    v_block_reason := 'slot_blocked';

  -- 4. Fingerprint matches -> always verified.
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

  -- 5. Fingerprint mismatch with WebAuthn enrolled -> step-up to rebind.
  ELSIF v_device.webauthn_enrolled THEN
    v_decision     := 'step_up_required';
    v_log_action   := 'step_up_required';
    v_block_reason := 'fingerprint_reverification_required';

  -- 6. Fingerprint mismatch, no WebAuthn -> hard block (different device).
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
      'isp',              p_isp,
      'isp_changed',      v_isp_changed,
      'decision',         v_decision,
      'block_reason',     v_block_reason,
      'browser',          p_browser,
      'os_type',          p_os_type
    )
  );

  RETURN jsonb_build_object(
    'decision',          v_decision,
    'device_id',         v_device.id,
    'webauthn_required',
      CASE
        WHEN v_decision = 'enrolled'         THEN true
        WHEN v_decision = 'verified'         THEN NOT v_device.webauthn_enrolled
        WHEN v_decision = 'step_up_required' THEN true
        ELSE false
      END,
    'reason', v_block_reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_admin_device_step_up(
  p_device_id uuid,
  p_fingerprint_hash text,
  p_ip text,
  p_location text,
  p_user_agent text,
  p_isp text
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

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authorized: no authenticated user';
  END IF;

  UPDATE public.admin_devices
  SET fingerprint_hash = p_fingerprint_hash,
      browser           = 'Brave',
      ip_address        = p_ip,
      location          = p_location,
      user_agent        = p_user_agent,
      isp               = p_isp,
      last_seen         = now()
  WHERE id = p_device_id AND status = 'active' AND admin_id = auth.uid()
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
