-- supabase/migrations/20260613230825_admin_device_tracking.sql
--
-- Leaders Auth: device binding for privileged admin roles.
--
-- Layered / defense-in-depth model:
--   * Each tracked admin gets up to 3 device slots, one per type (desktop/tablet/mobile).
--   * Fingerprint ENROLS + IDENTIFIES + LOGS; it is NOT a standalone hard gate.
--   * The real gate stays the existing Supabase TOTP 2FA (+ WebAuthn biometric).
--   * On a known slot whose fingerprint no longer matches -> step-up (biometric + 2FA),
--     not an automatic reject. Only IT can reset a slot.
--
-- Writes happen through SECURITY DEFINER RPCs (called by the capture edge function)
-- so the client can never forge device/activity rows. RLS only grants IT staff READ.

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_devices (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id           UUID        NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  role               TEXT        NOT NULL,                       -- role snapshot at enrolment
  device_type        TEXT        NOT NULL CHECK (device_type IN ('desktop','tablet','mobile')),
  device_name        TEXT,
  os_type            TEXT,
  browser            TEXT,
  fingerprint_hash   TEXT        NOT NULL,
  ip_address         TEXT,
  location           TEXT,
  user_agent         TEXT,
  status             TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active','blocked')),
  webauthn_enrolled  BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),   -- when the slot was first enrolled (first seen)
  last_seen          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- one device slot per type, per admin
  UNIQUE (admin_id, device_type)
);

CREATE INDEX IF NOT EXISTS admin_devices_admin_idx ON public.admin_devices (admin_id);

CREATE TABLE IF NOT EXISTS public.admin_device_activity (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID        REFERENCES public.admins(id) ON DELETE SET NULL,
  device_id    UUID        REFERENCES public.admin_devices(id) ON DELETE SET NULL,
  device_type  TEXT,
  action       TEXT        NOT NULL
                           CHECK (action IN (
                             'enrolled','verified','step_up_required',
                             'step_up_passed','slot_reset','blocked'
                           )),
  ip_address   TEXT,
  location     TEXT,
  user_agent   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_device_activity_admin_idx
  ON public.admin_device_activity (admin_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_webauthn_credentials (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       UUID        NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  device_id      UUID        REFERENCES public.admin_devices(id) ON DELETE CASCADE,
  credential_id  TEXT        NOT NULL UNIQUE,
  public_key     TEXT        NOT NULL,
  counter        BIGINT      NOT NULL DEFAULT 0,
  transports     TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_webauthn_admin_idx
  ON public.admin_webauthn_credentials (admin_id);

-- ── RLS (IT staff READ only; all writes via SECURITY DEFINER RPCs) ─────────────

ALTER TABLE public.admin_devices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_device_activity      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- IT staff = the same roles that gate the IT Department layout.
DROP POLICY IF EXISTS "admin_devices_it_select" ON public.admin_devices;
CREATE POLICY "admin_devices_it_select"
  ON public.admin_devices FOR SELECT TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid())
         IN ('SUPER_ADMIN','FOUNDER','IT_MANAGER'));

DROP POLICY IF EXISTS "admin_device_activity_it_select" ON public.admin_device_activity;
CREATE POLICY "admin_device_activity_it_select"
  ON public.admin_device_activity FOR SELECT TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid())
         IN ('SUPER_ADMIN','FOUNDER','IT_MANAGER'));

DROP POLICY IF EXISTS "admin_webauthn_it_select" ON public.admin_webauthn_credentials;
CREATE POLICY "admin_webauthn_it_select"
  ON public.admin_webauthn_credentials FOR SELECT TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid())
         IN ('SUPER_ADMIN','FOUNDER','IT_MANAGER'));

-- No INSERT/UPDATE/DELETE policies: rows are written only by the RPCs below
-- (SECURITY DEFINER) and by the capture edge function (service role). The
-- activity log is otherwise immutable.

-- ── RPC: evaluate_admin_device ────────────────────────────────────────────────
-- Called by the `capture-admin-device` edge function, which supplies the TRUE
-- client IP from request headers. Enrols an empty slot, or validates a filled
-- one. Returns the decision the client flow should act on.

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

  -- Slot empty -> enrol this device.
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

  -- Blocked slot -> deny until IT resets.
  ELSIF v_device.status = 'blocked' THEN
    v_decision := 'blocked';

  -- Fingerprint matches -> verified.
  ELSIF v_device.fingerprint_hash = p_fingerprint_hash THEN
    UPDATE public.admin_devices
    SET last_seen = now(), ip_address = p_ip, location = p_location
    WHERE id = v_device.id
    RETURNING * INTO v_device;

    v_decision := 'verified';

  -- Known slot, different fingerprint -> step up (biometric + 2FA), do NOT reject.
  ELSE
    v_decision := 'step_up_required';
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
      CASE WHEN v_decision IN ('enrolled','step_up_required') THEN true
           WHEN v_decision = 'verified' THEN NOT v_device.webauthn_enrolled
           ELSE false END
  );
END;
$$;

-- Server-only: called by the capture edge function (service_role). Lock out
-- PUBLIC/anon/authenticated so the client can't forge device rows or pass a fake IP.
REVOKE EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

-- ── RPC: confirm_admin_device_step_up ─────────────────────────────────────────
-- After a step-up (biometric + 2FA) passes for a known slot, overwrite the
-- stored fingerprint with the new device's and mark it verified.

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
  SET fingerprint_hash = p_fingerprint_hash,
      ip_address       = p_ip,
      location         = p_location,
      user_agent       = p_user_agent,
      last_seen        = now()
  WHERE id = p_device_id
  RETURNING * INTO v_device;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device not found: %', p_device_id;
  END IF;

  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action, ip_address, location, user_agent
  ) VALUES (
    v_device.admin_id, v_device.id, v_device.device_type, 'step_up_passed',
    p_ip, p_location, p_user_agent
  );

  RETURN jsonb_build_object('decision', 'verified', 'device_id', v_device.id);
END;
$$;

-- Server-only: called by the webauthn/step-up edge function (service_role).
REVOKE EXECUTE ON FUNCTION public.confirm_admin_device_step_up(
  UUID, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_admin_device_step_up(
  UUID, TEXT, TEXT, TEXT, TEXT
) TO service_role;

-- ── RPC: reset_admin_device_slot ──────────────────────────────────────────────
-- IT-only recovery path: clears a device slot (and its WebAuthn credentials via
-- cascade) so the user can re-enrol from a new device/browser.

CREATE OR REPLACE FUNCTION public.reset_admin_device_slot(p_device_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device public.admin_devices%ROWTYPE;
BEGIN
  IF (SELECT role FROM public.admins WHERE id = auth.uid())
     NOT IN ('SUPER_ADMIN','FOUNDER','IT_MANAGER') THEN
    RAISE EXCEPTION 'not authorised to reset device slots';
  END IF;

  SELECT * INTO v_device FROM public.admin_devices WHERE id = p_device_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'device not found: %', p_device_id;
  END IF;

  -- Log before delete so the audit trail survives (device_id -> NULL on delete).
  INSERT INTO public.admin_device_activity (
    admin_id, device_id, device_type, action, metadata
  ) VALUES (
    v_device.admin_id, v_device.id, v_device.device_type, 'slot_reset',
    jsonb_build_object('reset_by', auth.uid())
  );

  DELETE FROM public.admin_devices WHERE id = p_device_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Called from the Leaders Auth page by an IT admin; body re-checks the caller's
-- role, so authenticated is correct here. Just lock out anon.
REVOKE EXECUTE ON FUNCTION public.reset_admin_device_slot(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_admin_device_slot(UUID) TO authenticated, service_role;
