-- Migration: Sync Member Constituencies
-- Automatically lookup and assign region name when a user's constituency is updated or created.

CREATE OR REPLACE FUNCTION public.sync_user_region_from_constituency()
RETURNS TRIGGER AS $$
DECLARE
  v_region_name TEXT;
BEGIN
  IF NEW.platform = 'GHANA' AND NEW.constituency IS NOT NULL AND NEW.constituency <> '' AND (NEW.region IS NULL OR NEW.region = '') THEN
    SELECT gr.name INTO v_region_name
    FROM public.ghana_constituencies gc
    JOIN public.ghana_regions gr ON gc.region_id = gr.id
    WHERE LOWER(TRIM(gc.name)) = LOWER(TRIM(NEW.constituency))
    LIMIT 1;

    IF v_region_name IS NOT NULL THEN
      NEW.region := v_region_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on public.users
DROP TRIGGER IF EXISTS trg_sync_user_region_from_constituency ON public.users;
CREATE TRIGGER trg_sync_user_region_from_constituency
  BEFORE INSERT OR UPDATE OF constituency ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_region_from_constituency();

-- One-time Backfill existing records
UPDATE public.users u
SET region = r.region_name
FROM (
  SELECT gc.name AS constituency_name, gr.name AS region_name
  FROM public.ghana_constituencies gc
  JOIN public.ghana_regions gr ON gc.region_id = gr.id
) r
WHERE u.platform = 'GHANA'
  AND u.constituency IS NOT NULL
  AND u.constituency <> ''
  AND (u.region IS NULL OR u.region = '')
  AND LOWER(TRIM(u.constituency)) = LOWER(TRIM(r.constituency_name));
