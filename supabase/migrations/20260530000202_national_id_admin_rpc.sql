-- Admin-only RPC: returns the decrypted national_id for a given registration_number.
-- Callers must be in the public.admins table; all others receive an exception.
CREATE OR REPLACE FUNCTION public.admin_get_national_id(p_reg_no text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted text;
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT national_id INTO v_encrypted
  FROM public.users
  WHERE registration_number = p_reg_no
  LIMIT 1;

  IF v_encrypted IS NULL OR v_encrypted = '' THEN
    RETURN NULL;
  END IF;

  RETURN public.decrypt_national_id(v_encrypted);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_national_id(text) FROM anon;
-- Grant to authenticated — the SECURITY DEFINER body enforces admin check
GRANT EXECUTE ON FUNCTION public.admin_get_national_id(text) TO authenticated;
