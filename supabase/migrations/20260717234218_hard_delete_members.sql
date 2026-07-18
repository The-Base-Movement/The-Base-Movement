-- Hard delete members from both public.users and auth.users.
-- Keep the same auth guard as the earlier purge function.

CREATE OR REPLACE FUNCTION public.purge_member_completely(p_reg_no TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_caller_role TEXT;
  v_deleted_public INTEGER := 0;
  v_deleted_auth INTEGER := 0;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.admins
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR upper(v_caller_role) NOT IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') THEN
    RAISE EXCEPTION 'Not authorized. Only SUPER_ADMIN, FOUNDER, or IT_MANAGER can delete members.';
  END IF;

  SELECT id INTO v_user_id
  FROM public.users
  WHERE registration_number = p_reg_no;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.users
  WHERE id = v_user_id;
  GET DIAGNOSTICS v_deleted_public = ROW_COUNT;

  DELETE FROM auth.users
  WHERE id = v_user_id;
  GET DIAGNOSTICS v_deleted_auth = ROW_COUNT;

  RETURN v_deleted_public > 0 OR v_deleted_auth > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_member_completely(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_member_completely(TEXT) TO authenticated;
