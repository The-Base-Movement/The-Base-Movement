-- Switch provision_administrator to upsert so re-provisioning an existing
-- admin (e.g. after revoke or role change) updates rather than 409s.
CREATE OR REPLACE FUNCTION public.provision_administrator(target_id uuid, admin_role text, permissions jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_uid  uuid;
  caller_role text;
BEGIN
  caller_uid := auth.uid();

  IF caller_uid IS NULL THEN
    RAISE EXCEPTION 'auth_null: auth.uid() returned NULL — user may not be authenticated';
  END IF;

  SELECT role INTO caller_role FROM admins WHERE id = caller_uid;

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'not_in_admins: caller % has no row in admins table', caller_uid;
  END IF;

  IF caller_role NOT IN ('SUPER_ADMIN', 'FOUNDER') THEN
    RAISE EXCEPTION 'permission_denied: caller role "%" cannot provision administrators — requires SUPER_ADMIN or FOUNDER', caller_role;
  END IF;

  INSERT INTO admins (id, role, permissions)
  VALUES (target_id, admin_role, permissions)
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        permissions = EXCLUDED.permissions;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;
