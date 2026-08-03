-- Auto-provision admin roles when chapter/constituency leads are appointed,
-- so leads can access the leader inbox at /admin/messages.
-- Never downgrades an existing higher admin role; removes the auto role on unassign
-- only if the person leads nothing else.

CREATE OR REPLACE FUNCTION public.sync_chapter_lead_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.leader_id IS NOT NULL AND NEW.leader_id IS DISTINCT FROM OLD.leader_id THEN
    INSERT INTO public.admins (id, role, chapter)
    VALUES (NEW.leader_id, 'CHAPTER_LEAD', NEW.name)
    ON CONFLICT (id) DO UPDATE
      SET chapter = EXCLUDED.chapter
      WHERE admins.role = 'CHAPTER_LEAD';
  END IF;

  IF OLD.leader_id IS NOT NULL AND OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
    DELETE FROM public.admins a
    WHERE a.id = OLD.leader_id
      AND a.role = 'CHAPTER_LEAD'
      AND NOT EXISTS (
        SELECT 1 FROM public.chapters c
        WHERE c.leader_id = OLD.leader_id AND c.id <> NEW.id
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_constituency_lead_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region text;
BEGIN
  IF NEW.leader_id IS NOT NULL AND NEW.leader_id IS DISTINCT FROM OLD.leader_id THEN
    SELECT r.name INTO v_region FROM public.ghana_regions r WHERE r.id = NEW.region_id;

    INSERT INTO public.admins (id, role, assigned_region)
    VALUES (NEW.leader_id, 'CONSTITUENCY_LEAD', v_region)
    ON CONFLICT (id) DO UPDATE
      SET assigned_region = EXCLUDED.assigned_region
      WHERE admins.role = 'CONSTITUENCY_LEAD';
  END IF;

  IF OLD.leader_id IS NOT NULL AND OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
    DELETE FROM public.admins a
    WHERE a.id = OLD.leader_id
      AND a.role = 'CONSTITUENCY_LEAD'
      AND NOT EXISTS (
        SELECT 1 FROM public.ghana_constituencies gc
        WHERE gc.leader_id = OLD.leader_id AND gc.id <> NEW.id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_chapter_lead_admin ON public.chapters;
CREATE TRIGGER trg_sync_chapter_lead_admin
  AFTER UPDATE OF leader_id ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.sync_chapter_lead_admin();

DROP TRIGGER IF EXISTS trg_sync_constituency_lead_admin ON public.ghana_constituencies;
CREATE TRIGGER trg_sync_constituency_lead_admin
  AFTER UPDATE OF leader_id ON public.ghana_constituencies
  FOR EACH ROW EXECUTE FUNCTION public.sync_constituency_lead_admin();

-- Backfill: provision current leads who have no admins row yet
INSERT INTO public.admins (id, role, chapter)
SELECT c.leader_id, 'CHAPTER_LEAD', c.name
FROM public.chapters c
WHERE c.leader_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admins (id, role, assigned_region)
SELECT gc.leader_id, 'CONSTITUENCY_LEAD', r.name
FROM public.ghana_constituencies gc
LEFT JOIN public.ghana_regions r ON r.id = gc.region_id
WHERE gc.leader_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
