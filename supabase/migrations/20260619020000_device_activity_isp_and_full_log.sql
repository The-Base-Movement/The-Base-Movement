-- 20260619020000_device_activity_isp_and_full_log.sql
--
-- Two improvements to the admin device activity log:
--
-- 1. Add an `isp` column to admin_device_activity so ISP is a first-class
--    queryable field (not only buried in metadata JSONB).
--
-- 2. Introduce the 'isp_change' action so that a same-device login on a
--    different network is distinguishable from a genuine step-up-required
--    (fingerprint mismatch) event.  The 'isp_change' action is also counted
--    as an alert in the KPI stats.
--
-- All activity is already logged on every single login — this migration does
-- not change that guarantee; it only enriches and clarifies the log rows.

-- Step 1: Schema changes (safe to re-run)
ALTER TABLE public.admin_device_activity
  ADD COLUMN IF NOT EXISTS isp TEXT;

ALTER TABLE public.admin_device_activity
  DROP CONSTRAINT IF EXISTS admin_device_activity_action_check;

ALTER TABLE public.admin_device_activity
  ADD CONSTRAINT admin_device_activity_action_check
  CHECK (action IN (
    'enrolled','verified','step_up_required',
    'step_up_passed','slot_reset','blocked','isp_change'
  ));

-- Step 2: Restore get_admin_device_activity_rows (with isp + ambiguity fix)
DROP FUNCTION IF EXISTS public.get_admin_device_activity_rows(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_device_activity_rows(
  p_admin_id uuid DEFAULT null,
  p_action   text DEFAULT null,
  p_limit    integer DEFAULT 25,
  p_offset   integer DEFAULT 0
)
RETURNS TABLE (
  id          uuid,
  admin_id    uuid,
  admin_name  text,
  device_type text,
  action      text,
  ip_address  text,
  location    text,
  isp         text,
  user_agent  text,
  metadata    jsonb,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
BEGIN
  IF coalesce((SELECT role FROM public.admins WHERE admins.id = auth.uid()), '')
     NOT IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') THEN
    RAISE EXCEPTION 'insufficient_privilege' USING errcode = '42501';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.admin_id,
    CASE
      WHEN a.admin_id IS NULL THEN 'System'::text
      ELSE coalesce(u.full_name::text, 'Unknown admin')
    END AS admin_name,
    a.device_type::text,
    a.action::text,
    a.ip_address::text,
    a.location::text,
    a.isp::text,
    a.user_agent::text,
    a.metadata,
    a.created_at
  FROM public.admin_device_activity a
  LEFT JOIN public.users u ON u.id = a.admin_id
  WHERE (p_admin_id IS NULL OR a.admin_id = p_admin_id)
    AND (p_action   IS NULL OR a.action   = p_action)
  ORDER BY a.created_at DESC
  LIMIT  greatest(1, least(coalesce(p_limit,  25), 1000))
  OFFSET greatest(0,     coalesce(p_offset,    0));
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_device_activity_rows(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_device_activity_rows(uuid, text, integer, integer)
  TO authenticated, service_role;

-- Step 3: Update get_admin_device_activity_stats to count isp_change as alert
CREATE OR REPLACE FUNCTION public.get_admin_device_activity_stats()
RETURNS TABLE (
  logins_today bigint,
  alerts       bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
BEGIN
  IF coalesce((SELECT role FROM public.admins WHERE admins.id = auth.uid()), '')
     NOT IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') THEN
    RAISE EXCEPTION 'insufficient_privilege' USING errcode = '42501';
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (
      WHERE a.action IN ('verified', 'enrolled')
        AND a.created_at >= date_trunc('day', now())
    )::bigint AS logins_today,
    count(*) FILTER (
      WHERE a.action IN ('step_up_required', 'blocked', 'isp_change')
    )::bigint AS alerts
  FROM public.admin_device_activity a;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_device_activity_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_device_activity_stats() TO authenticated, service_role;

-- Step 4: Update evaluate_admin_device (adds isp_change logging + isp column in activity)
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

  ELSIF v_device.fingerprint_hash = p_fingerprint_hash THEN
    v_isp_changed := COALESCE(v_device.isp, '') <> COALESCE(p_isp, '');

    IF v_isp_changed AND v_device.webauthn_enrolled THEN
      v_decision   := 'step_up_required';
      v_log_action := 'isp_change';
    ELSE
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
    END IF;

  ELSE
    v_decision   := 'blocked';
    v_log_action := 'blocked';
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
      'decision',         v_decision
    )
  );

  RETURN jsonb_build_object(
    'decision',         v_decision,
    'device_id',        v_device.id,
    'webauthn_required',
      CASE WHEN v_decision = 'enrolled'          THEN true
           WHEN v_decision = 'verified'          THEN NOT v_device.webauthn_enrolled
           WHEN v_decision = 'step_up_required'  THEN true
           ELSE false END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_admin_device(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

-- Step 5: Update get_leader_activity (adds isp, fixes SELECT *, qualifies id refs)
DROP FUNCTION IF EXISTS public.get_leader_activity(uuid, text, text, int, int);

CREATE OR REPLACE FUNCTION public.get_leader_activity(
  p_admin    uuid    DEFAULT null,
  p_category text    DEFAULT null,
  p_action   text    DEFAULT null,
  p_limit    int     DEFAULT 25,
  p_offset   int     DEFAULT 0
)
RETURNS TABLE (
  id          uuid,
  source      text,
  admin_id    uuid,
  admin_name  text,
  role        text,
  action      text,
  resource    text,
  status      text,
  device_type text,
  ip_address  text,
  location    text,
  isp         text,
  user_agent  text,
  metadata    jsonb,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH leaders AS (
    SELECT a.id AS leader_id, a.role::text AS leader_role, u.full_name::text AS full_name
    FROM admins a
    JOIN users u ON u.id = a.id
    WHERE is_leader_role(a.role)
  ),
  unified AS (
    SELECT
      al.id                                      AS row_id,
      'action'::text                             AS source,
      al.admin_id                                AS row_admin_id,
      l.full_name                                AS admin_name,
      l.leader_role                              AS role,
      al.action::text                            AS action,
      al.resource::text                          AS resource,
      al.status::text                            AS status,
      null::text                                 AS device_type,
      (al.metadata->>'ip_address')::text         AS ip_address,
      (al.metadata->>'location')::text           AS location,
      null::text                                 AS isp,
      (al.metadata->>'user_agent')::text         AS user_agent,
      al.metadata                                AS metadata,
      al."timestamp"                             AS created_at
    FROM audit_logs al
    JOIN leaders l ON l.leader_id = al.admin_id

    UNION ALL

    SELECT
      d.id                                       AS row_id,
      'device'::text                             AS source,
      d.admin_id                                 AS row_admin_id,
      l.full_name                                AS admin_name,
      l.leader_role                              AS role,
      d.action::text                             AS action,
      null::text                                 AS resource,
      null::text                                 AS status,
      d.device_type::text                        AS device_type,
      d.ip_address::text                         AS ip_address,
      d.location::text                           AS location,
      d.isp::text                                AS isp,
      d.user_agent::text                         AS user_agent,
      d.metadata                                 AS metadata,
      d.created_at                               AS created_at
    FROM admin_device_activity d
    JOIN leaders l ON l.leader_id = d.admin_id
  )
  SELECT
    u.row_id,
    u.source,
    u.row_admin_id,
    u.admin_name,
    u.role,
    u.action,
    u.resource,
    u.status,
    u.device_type,
    u.ip_address,
    u.location,
    u.isp,
    u.user_agent,
    u.metadata,
    u.created_at
  FROM unified u
  WHERE (p_admin    IS NULL OR u.row_admin_id = p_admin)
    AND (p_category IS NULL OR u.source       = p_category)
    AND (p_action   IS NULL OR u.action       = p_action)
  ORDER BY u.created_at DESC
  LIMIT  greatest(p_limit,  0)
  OFFSET greatest(p_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_leader_activity(uuid, text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leader_activity(uuid, text, text, int, int)
  TO authenticated, service_role;

-- Step 6: Update get_admin_device_rows to expose isp column
DROP FUNCTION IF EXISTS public.get_admin_device_rows();

CREATE OR REPLACE FUNCTION public.get_admin_device_rows()
 RETURNS TABLE(
  id uuid,
  admin_id uuid,
  admin_name text,
  role text,
  device_type text,
  device_name text,
  os_type text,
  browser text,
  ip_address text,
  isp text,
  location text,
  status text,
  webauthn_enrolled boolean,
  created_at timestamp with time zone,
  last_seen timestamp with time zone
)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select
    d.id::uuid as id,
    d.admin_id::uuid as admin_id,
    coalesce(u.full_name, 'Unknown admin')::text as admin_name,
    d.role::text as role,
    d.device_type::text as device_type,
    d.device_name::text as device_name,
    d.os_type::text as os_type,
    d.browser::text as browser,
    d.ip_address::text as ip_address,
    d.isp::text as isp,
    d.location::text as location,
    d.status::text as status,
    d.webauthn_enrolled::boolean as webauthn_enrolled,
    d.created_at::timestamptz as created_at,
    d.last_seen::timestamptz as last_seen
  from public.admin_devices d
  left join public.users u on u.id = d.admin_id
  where exists (
    select 1
    from public.admins adm
    where adm.id = auth.uid()
      and adm.role in ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER')
  )
  order by d.last_seen desc;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_device_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_device_rows() TO authenticated, service_role;

