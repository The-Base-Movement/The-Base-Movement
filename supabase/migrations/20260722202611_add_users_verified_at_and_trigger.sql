-- Track when a member became verified (verification_status -> 'Approved').
-- Powers the member dashboard "Movement live feed" verification events.
-- Only future verifications are stamped; historical rows stay NULL.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- users uses column-level SELECT grants (no table-level grant): grant explicitly.
GRANT SELECT (verified_at) ON TABLE public.users TO authenticated;
GRANT SELECT (verified_at) ON TABLE public.users TO anon;

CREATE OR REPLACE FUNCTION public.stamp_verified_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.verification_status = 'Approved'
     AND NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verified_at IS NULL THEN
    NEW.verified_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_verified_at ON public.users;
CREATE TRIGGER trg_stamp_verified_at
  BEFORE UPDATE OF verification_status ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_verified_at();
