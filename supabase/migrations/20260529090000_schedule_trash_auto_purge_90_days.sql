-- ── Trash auto-purge: permanently delete soft-deleted rows older than 90 days ──

-- 1. Purge function (runs as superuser via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Blog posts
  DELETE FROM public.blog_posts
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '90 days';

  -- Store inventory / products
  DELETE FROM public.store_inventory
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '90 days';

  -- Media library
  DELETE FROM public.media_library
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '90 days';

  -- Authors
  DELETE FROM public.authors
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '90 days';
  -- NOTE: users/members are intentionally excluded from auto-purge
  -- to avoid FK violations; member records must be deleted manually.
END;
$$;

-- 2. Remove stale job if it already exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-trash') THEN
    PERFORM cron.unschedule('purge-expired-trash');
  END IF;
END;
$$;

-- 3. Schedule: run daily at 02:00 UTC
SELECT cron.schedule(
  'purge-expired-trash',
  '0 2 * * *',
  $$SELECT public.purge_expired_trash()$$
);
