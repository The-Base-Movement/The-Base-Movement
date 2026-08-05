-- Lets a signed-in member read (decrypt) THEIR OWN Ghana Card number for the
-- profile settings page. national_id is encrypted + column-locked, so it can't
-- be read via a normal select. Scoped to auth.uid() only — a member can never
-- read anyone else's. Run in the Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.get_own_national_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_encrypted text;
BEGIN
  SELECT national_id INTO v_encrypted
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_encrypted IS NULL OR v_encrypted = '' THEN
    RETURN NULL;
  END IF;

  RETURN public.decrypt_national_id(v_encrypted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_own_national_id() TO authenticated;
