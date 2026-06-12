-- TRASH AUTO-PURGE PROTOCOL
-- This script automates the permanent deletion of soft-deleted records older than 30 days.

-- 1. Create the Purge Function
CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for cleanup
AS $$
DECLARE
    purge_interval INTERVAL := '30 days';
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting automated trash purge...';

    -- Purge Users (Members)
    DELETE FROM public.users
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired members.', deleted_count;
    END IF;

    -- Purge Blog Posts
    DELETE FROM public.blog_posts
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired blog posts.', deleted_count;
    END IF;

    -- Purge Press Releases
    DELETE FROM public.press_releases
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired press releases.', deleted_count;
    END IF;

    -- Purge Authors
    DELETE FROM public.authors
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired authors.', deleted_count;
    END IF;

    -- Purge Media Library
    -- Note: This only removes the database record. 
    -- Actual file deletion from Supabase Storage would require a separate Edge Function trigger.
    DELETE FROM public.media_library
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired media records.', deleted_count;
    END IF;

    -- Purge Store Inventory
    DELETE FROM public.store_inventory
    WHERE deleted_at < NOW() - purge_interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Purged % expired inventory items.', deleted_count;
    END IF;

    -- Log the completion in audit_logs
    INSERT INTO public.audit_logs (action, target_type, status, metadata)
    VALUES (
        'AUTOMATED_PURGE',
        'SYSTEM',
        'Success',
        jsonb_build_object('timestamp', NOW(), 'interval', purge_interval)
    );

    RAISE NOTICE 'Automated trash purge complete.';
END;
$$;

-- 2. Schedule the Purge (Requires pg_cron extension enabled in Supabase)
-- To enable pg_cron: Dashboard -> Database -> Extensions -> Search "pg_cron" -> Enable
-- Then run the following:

/*
SELECT cron.schedule(
    'daily-trash-purge', -- name of the job
    '0 0 * * *',         -- every day at midnight (cron syntax)
    'SELECT public.purge_expired_trash();'
);
*/

-- 3. Alternative: Trigger via Supabase Edge Function (Recommended for Storage Cleanup)
-- If files need to be deleted from storage, an Edge Function is more suitable
-- because it can use the Supabase Admin SDK to interact with the Storage API.
