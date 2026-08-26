-- Strengthens the automated Ghana member verification path. Previously
-- this only checked that the member's typed constituency text matched a
-- real EC constituency name -- trivially satisfiable by anyone (it's
-- public information), not real proof of anything about the member.
--
-- Product decision: manual review doesn't scale to millions of members,
-- so automated verification stays -- but a polling_station_code, when the
-- member has and provides one, is a much stronger signal (40,278 distinct
-- verified EC codes vs ~276 constituency names) and lets us derive/cross-
-- check constituency and district from official data rather than trusting
-- free text. Members who don't know their code (most, today) still get
-- the existing constituency-only path so nobody gets stuck in review.

CREATE OR REPLACE FUNCTION public.approve_on_constituency_set()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_ps_constituency text;
  v_ps_district     text;
BEGIN
  IF lower(coalesce(NEW.platform, '')) = 'ghana' AND OLD.verification_status = 'In Review' THEN

    -- Strong signal: a polling station code was just provided/changed and
    -- resolves to a real EC-verified station. Derive constituency/district
    -- from it (authoritative), overriding whatever free text was typed.
    IF coalesce(TRIM(NEW.polling_station_code), '') <> ''
       AND coalesce(TRIM(NEW.polling_station_code), '') IS DISTINCT FROM coalesce(TRIM(OLD.polling_station_code), '')
    THEN
      SELECT ps.constituency, ps.district INTO v_ps_constituency, v_ps_district
      FROM public.polling_stations ps
      WHERE upper(trim(ps.code)) = upper(trim(NEW.polling_station_code))
      LIMIT 1;

      IF v_ps_constituency IS NOT NULL THEN
        NEW.constituency := coalesce(public.canonical_constituency(v_ps_constituency), v_ps_constituency);
        NEW.district := v_ps_district;
        NEW.verification_status := 'Approved';
        NEW.status := 'Active';
        IF NEW.verified_at IS NULL THEN
          NEW.verified_at := now();
        END IF;
        RETURN NEW;
      END IF;
      -- Unknown/invalid code: fall through to the constituency-text check below
      -- rather than blocking the member outright.
    END IF;

    -- Fallback for members who don't know their polling station code:
    -- constituency text alone, matched against the real EC list.
    IF coalesce(TRIM(NEW.constituency), '') <> ''
       AND coalesce(TRIM(OLD.constituency), '') = ''
       AND public.canonical_constituency(NEW.constituency) IS NOT NULL
    THEN
      NEW.verification_status := 'Approved';
      NEW.status := 'Active';
      IF NEW.verified_at IS NULL THEN
        NEW.verified_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_approve_on_constituency_set ON public.users;
CREATE TRIGGER trg_approve_on_constituency_set
  BEFORE UPDATE OF constituency, polling_station_code ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.approve_on_constituency_set();
