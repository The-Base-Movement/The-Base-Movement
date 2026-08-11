-- Keep public.users.region on the canonical ghana_regions list.
--
-- The June physical-form import wrote region straight from the scanned sheets,
-- so 19 members carried casing variants and " region" suffixes (EASTERN,
-- "Eastern region", GREATER ACCRA...). Counting distinct region strings then
-- returned 25 for a country with 16 regions, skewing admin filters and
-- region-based reporting.
--
-- Normalizing in a trigger rather than in the registration form covers every
-- write path at once: public registration, the admin CSV import, admin edits
-- and any backfill script.
--
-- Only rewrites when the value resolves to a real region; an unrecognized
-- string is left untouched for a human to look at rather than silently
-- reassigned. Diaspora members are covered too — all 1,094 with a region
-- already hold Ghana region names.
CREATE OR REPLACE FUNCTION public.canonicalize_user_region()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
BEGIN
  IF NEW.region IS NOT NULL AND TRIM(NEW.region) <> '' THEN
    SELECT r.name INTO v_name
    FROM ghana_regions r
    WHERE lower(r.name) = lower(regexp_replace(TRIM(NEW.region), '\s+region$', '', 'i'))
    LIMIT 1;

    IF v_name IS NOT NULL THEN
      NEW.region := v_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fires before trg_sync_user_region_from_constituency (triggers run in name
-- order), which derives region from the constituency lookup and so already
-- produces a canonical value.
DROP TRIGGER IF EXISTS trg_canonicalize_user_region ON public.users;
CREATE TRIGGER trg_canonicalize_user_region
BEFORE INSERT OR UPDATE OF region ON public.users
FOR EACH ROW EXECUTE FUNCTION public.canonicalize_user_region();
