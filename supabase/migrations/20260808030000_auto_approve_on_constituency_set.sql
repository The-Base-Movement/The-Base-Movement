-- Promote a Ghana member to Approved once their constituency is filled in.
--
-- registrationService.submit() auto-approves a Ghana registration when a
-- constituency is supplied (ghanaReady = platform === 'GHANA' && constituency),
-- but that rule only ever ran at registration. A member who supplies their
-- constituency afterwards -- in Settings, or via an admin edit or backfill --
-- stayed 'In Review' forever, because nothing re-evaluates it.
--
-- That is why 2,841 of the 2,846 'In Review' members have no constituency:
-- they came from the June physical-form import, which never captured one.
--
-- This applies the same rule continuously rather than only at signup. It is
-- deliberately narrow:
--   * UPDATE only -- inserts are already handled by the registration path.
--   * 'In Review' only -- 'Flagged', 'Rejected' and 'Pending' are untouched,
--     so a flagged member can never be auto-cleared by editing a field.
--   * the constituency must match ghana_constituencies, so OCR noise from a
--     scanned form cannot approve anyone.
--
-- verified_at is stamped here because trg_stamp_verified_at only fires on
-- UPDATE OF verification_status; an update that touches only constituency
-- would otherwise leave it null.
CREATE OR REPLACE FUNCTION public.approve_on_constituency_set()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(coalesce(NEW.platform, '')) = 'ghana'
     AND OLD.verification_status = 'In Review'
     AND coalesce(TRIM(NEW.constituency), '') <> ''
     AND coalesce(TRIM(OLD.constituency), '') = ''
     AND EXISTS (
       SELECT 1 FROM ghana_constituencies gc
       WHERE lower(TRIM(gc.name)) = lower(TRIM(NEW.constituency))
     )
  THEN
    NEW.verification_status := 'Approved';
    NEW.status := 'Active';
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_approve_on_constituency_set ON public.users;
CREATE TRIGGER trg_approve_on_constituency_set
BEFORE UPDATE OF constituency ON public.users
FOR EACH ROW EXECUTE FUNCTION public.approve_on_constituency_set();
