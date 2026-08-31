-- These 3 SECURITY INVOKER functions had no explicit search_path, flagged by
-- the Supabase security advisor as function_search_path_mutable. Lower risk
-- than a SECURITY DEFINER function (runs as caller, not owner), but pinning
-- search_path is cheap and standard hardening against object-shadowing.
CREATE OR REPLACE FUNCTION public.age_range_from_birth_year(yr smallint)
RETURNS text LANGUAGE sql STABLE SET search_path TO 'public' AS $function$
  select case
    when yr is null then null
    when (extract(year from now())::int - yr) <= 17 then '14-17'
    when (extract(year from now())::int - yr) <= 25 then '18-25'
    when (extract(year from now())::int - yr) <= 35 then '26-35'
    when (extract(year from now())::int - yr) <= 45 then '36-45'
    when (extract(year from now())::int - yr) <= 60 then '46-60'
    else '60+'
  end
$function$;

CREATE OR REPLACE FUNCTION public.set_age_range_from_birth_year()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
begin
  if new.birth_year is not null then
    new.age_range := public.age_range_from_birth_year(new.birth_year);
  end if;
  return new;
end
$function$;

CREATE OR REPLACE FUNCTION public.approve_on_constituency_set()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE
  v_ps_constituency text;
  v_ps_district     text;
BEGIN
  IF lower(coalesce(NEW.platform, '')) = 'ghana' AND OLD.verification_status = 'In Review' THEN

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
    END IF;

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
$function$;
