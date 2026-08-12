-- Adopt the EC punctuation-insensitive constituency matcher everywhere.
--
-- Background: 20260802153000 reconciled ghana_constituencies to the official
-- EC 2024 polling-station spellings. EC formatting is inconsistent by nature --
-- 'Anyaa/Sowutuom', 'Daboya / Mankarigu', 'Yagaba/ Kubori', 'Nsuta/Kwamang/
-- Beposo' -- so that migration also taught enforce_user_network_assignment to
-- compare names with all non-alphanumerics stripped:
--
--     regexp_replace(lower(trim(name)), '[^a-z0-9]', '', 'g')
--
-- That is the right pattern, but it only ever landed in that one function --
-- which, per supabase/scripts/network_assignment_trigger_status_20260805.sql,
-- has no trigger attached. Both triggers that DO fire on every write still use
-- exact lower(trim()) equality, so 'Anyaa-Sowutuom' does not match the stored
-- 'Anyaa/Sowutuom' and the member silently gets no region and no approval.
--
-- This centralises the matcher in one function and points both live triggers
-- at it. Reuse canonical_constituency() for the group-file import rather than
-- writing another comparison by hand.
CREATE OR REPLACE FUNCTION public.canonical_constituency(p_value text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT gc.name
  FROM public.ghana_constituencies gc
  WHERE regexp_replace(lower(trim(gc.name)), '[^a-z0-9]', '', 'g')
      = regexp_replace(lower(trim(coalesce(p_value, ''))), '[^a-z0-9]', '', 'g')
    AND coalesce(trim(p_value), '') <> ''
  LIMIT 1;
$function$;

-- Region sync: same behaviour, but now tolerant of punctuation, and it stores
-- the EC spelling rather than whatever punctuation the caller happened to use.
CREATE OR REPLACE FUNCTION public.sync_user_region_from_constituency()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name   text;
  v_region text;
BEGIN
  IF coalesce(TRIM(NEW.constituency), '') <> '' THEN
    v_name := public.canonical_constituency(NEW.constituency);

    IF v_name IS NOT NULL THEN
      -- Normalize to the EC spelling so downstream exact matches keep working.
      NEW.constituency := v_name;

      -- Derive region from the constituency unconditionally, as
      -- enforce_user_network_assignment does. The previous version only filled
      -- an empty region, which let the two disagree -- production has members
      -- carrying 'Upper Denkyira' (Central) with region 'Greater Accra'. A
      -- resolved constituency is the authoritative signal; region follows it.
      SELECT gr.name INTO v_region
      FROM public.ghana_constituencies gc
      JOIN public.ghana_regions gr ON gr.id = gc.region_id
      WHERE gc.name = v_name
      LIMIT 1;

      IF v_region IS NOT NULL THEN
        NEW.region := v_region;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Auto-approval: same matcher, so a member who supplies a punctuation variant
-- is approved like anyone else instead of being silently left In Review.
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
     AND public.canonical_constituency(NEW.constituency) IS NOT NULL
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

REVOKE ALL ON FUNCTION public.canonical_constituency(text) FROM public;
GRANT EXECUTE ON FUNCTION public.canonical_constituency(text) TO authenticated, anon, service_role;
