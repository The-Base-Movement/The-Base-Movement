-- Purge rejected members from database upon registration rejection.
-- This function runs with SECURITY DEFINER to permit DML on auth.users schema
-- but validates that the caller is an authenticated admin from public.admins.

CREATE OR REPLACE FUNCTION public.purge_member_completely(p_reg_no TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_caller_role TEXT;
BEGIN
  -- 1. Verify caller is an authenticated admin with required roles
  SELECT role INTO v_caller_role
  FROM public.admins
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR upper(v_caller_role) NOT IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER') THEN
    RAISE EXCEPTION 'Not authorized. Only SUPER_ADMIN, FOUNDER, or IT_MANAGER can purge rejected members.';
  END IF;

  -- 2. Find the target Auth ID matching the registration number
  SELECT id INTO v_user_id
  FROM public.users
  WHERE registration_number = p_reg_no;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Delete from auth.users (which cascades to public.users and associated tables)
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_member_completely(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_member_completely(TEXT) TO authenticated;
