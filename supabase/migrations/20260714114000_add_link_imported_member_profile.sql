-- Migration: Add link_imported_member_profile RPC
-- Resolves session timeout issue for imported members by auto-linking their public.users profile to their auth.users ID on login.

CREATE OR REPLACE FUNCTION public.link_imported_member_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id uuid;
  v_email text;
  v_phone text;
  v_reg_no text;
  v_full_name text;
  v_platform text;
BEGIN
  -- Get the current authenticated user's ID from auth context
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Get email and phone from auth.users
  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = v_auth_id;

  -- 1. Try to find a matched user in public.users by email or phone where the id doesn't match
  UPDATE public.users
  SET id = v_auth_id
  WHERE id <> v_auth_id
    AND (
      (v_email IS NOT NULL AND v_email <> '' AND email IS NOT NULL AND email <> '' AND LOWER(email) = LOWER(v_email))
      OR
      (v_phone IS NOT NULL AND v_phone <> '' AND phone_number IS NOT NULL AND phone_number <> '' AND phone_number = v_phone)
    )
  RETURNING registration_number, full_name, platform INTO v_reg_no, v_full_name, v_platform;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true, 
      'updated', true,
      'registration_number', v_reg_no,
      'full_name', v_full_name,
      'platform', v_platform
    );
  END IF;

  -- 2. Fetch the existing linked user if already linked
  SELECT registration_number, full_name, platform INTO v_reg_no, v_full_name, v_platform
  FROM public.users
  WHERE id = v_auth_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true, 
      'updated', false,
      'registration_number', v_reg_no,
      'full_name', v_full_name,
      'platform', v_platform
    );
  END IF;

  RETURN json_build_object('success', false, 'message', 'No profile found to link');
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_imported_member_profile() TO authenticated;
