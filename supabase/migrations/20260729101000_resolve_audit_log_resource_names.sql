-- Audit rows store resources as TYPE/ID, e.g. MEMBERS/TBM-GH-252631 or
-- DONATIONS/51aeb30f-…. A raw UUID tells a reviewer nothing, which defeats the
-- point of an audit trail. Resolve the identifier to the record's actual name.
--
-- Every column referenced here was verified against information_schema first.
-- Returns NULL when the type is unknown or the record is gone (deleted records
-- are exactly what an audit log must still show), and the UI falls back to the
-- raw resource string.
CREATE OR REPLACE FUNCTION public.resolve_audit_resource_name(p_resource text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_type text := split_part(p_resource, '/', 1);
  v_id   text := split_part(p_resource, '/', 2);
  v_name text;
BEGIN
  IF v_id IS NULL OR v_id = '' THEN
    RETURN NULL;
  END IF;

  CASE upper(v_type)
    WHEN 'MEMBERS' THEN
      SELECT full_name INTO v_name FROM public.users WHERE registration_number = v_id;
    WHEN 'ADMINS' THEN
      -- admins has no name column; the display name lives on the linked user.
      SELECT u.full_name INTO v_name
      FROM public.admins a JOIN public.users u ON u.id = a.id
      WHERE a.id::text = v_id;
    WHEN 'DONATIONS' THEN
      -- Group donations are DONATIONS/GROUP/<id>, so the id is one segment later.
      IF upper(v_id) = 'GROUP' THEN
        SELECT full_name INTO v_name
        FROM public.donations WHERE id::text = split_part(p_resource, '/', 3);
      ELSE
        SELECT full_name INTO v_name FROM public.donations WHERE id::text = v_id;
      END IF;
    WHEN 'MONTHLY_DUES' THEN
      SELECT u.full_name || ' · ' || to_char(p.dues_month, 'Mon YYYY') INTO v_name
      FROM public.monthly_dues_payments p
      LEFT JOIN public.users u ON u.id = p.member_id
      WHERE p.id::text = v_id;
    WHEN 'BLOGS' THEN
      SELECT title INTO v_name FROM public.blog_posts WHERE id::text = v_id OR slug = v_id;
    WHEN 'AUTHORS' THEN
      SELECT name INTO v_name FROM public.authors WHERE id::text = v_id;
    WHEN 'CAMPAIGNS', 'DONATION_CAMPAIGNS' THEN
      SELECT title INTO v_name FROM public.donation_campaigns WHERE id::text = v_id;
    WHEN 'CHAPTERS' THEN
      SELECT name INTO v_name FROM public.chapters WHERE id::text = v_id;
    WHEN 'PARTY_OFFICIALS' THEN
      SELECT name INTO v_name FROM public.party_officials WHERE id::text = v_id;
    WHEN 'ADMIN_ROLES' THEN
      SELECT name INTO v_name FROM public.admin_roles WHERE id::text = v_id;
    WHEN 'ADMIN_ROLE_PERMISSIONS' THEN
      SELECT r.name || ' · ' || p.action || ' on ' || p.resource INTO v_name
      FROM public.admin_role_permissions p
      LEFT JOIN public.admin_roles r ON r.id = p.role_id
      WHERE p.id::text = v_id;
    WHEN 'JOB_ROLES' THEN
      SELECT name INTO v_name FROM public.job_roles WHERE id::text = v_id;
    WHEN 'IT_NOTES' THEN
      SELECT title INTO v_name FROM public.it_notes WHERE id::text = v_id;
    WHEN 'IT_TICKETS' THEN
      SELECT title INTO v_name FROM public.it_tickets WHERE id::text = v_id;
    WHEN 'IT_PROJECTS' THEN
      SELECT title INTO v_name FROM public.it_projects WHERE id::text = v_id;
    WHEN 'IT_TODOS' THEN
      SELECT task INTO v_name FROM public.it_todos WHERE id::text = v_id;
    WHEN 'ORDERS' THEN
      SELECT full_name INTO v_name FROM public.store_orders WHERE id::text = v_id;
    ELSE
      v_name := NULL;
  END CASE;

  RETURN nullif(btrim(coalesce(v_name, '')), '');
EXCEPTION
  -- A bad UUID cast must never take down the audit view.
  WHEN others THEN RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_audit_resource_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_audit_resource_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_audit_resource_name(text) TO service_role;

-- Audit-log reader that returns the resolved name alongside the raw resource.
CREATE OR REPLACE FUNCTION public.get_system_audit_logs_named(p_limit int DEFAULT 500)
RETURNS TABLE (
  id uuid,
  "timestamp" timestamptz,
  admin_id uuid,
  admin_name text,
  action text,
  resource text,
  resource_name text,
  status text,
  ip_address text,
  metadata jsonb,
  target_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT v.id, v."timestamp", v.admin_id, v.admin_name, v.action, v.resource,
         public.resolve_audit_resource_name(v.resource),
         v.status, v.ip_address::text, v.metadata, v.target_name
  FROM public.system_audit_logs_view v
  ORDER BY v."timestamp" DESC
  LIMIT least(coalesce(p_limit, 500), 2000);
END;
$$;

REVOKE ALL ON FUNCTION public.get_system_audit_logs_named(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_system_audit_logs_named(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_audit_logs_named(int) TO service_role;
