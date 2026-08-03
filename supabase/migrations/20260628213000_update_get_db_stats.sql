-- Migration: Update public.get_db_stats() to return public table/index sizes, storage bucket sizes, and actual cache hit ratio.
CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'db_size_bytes',           pg_database_size(current_database()),
    'public_table_size_bytes', (SELECT coalesce(sum(pg_table_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'),
    'public_index_size_bytes', (SELECT coalesce(sum(pg_indexes_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'),
    'storage_size_bytes',      (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects),
    'cache_hit_ratio',         coalesce((SELECT round(100 * sum(heap_blks_hit) / nullif(sum(heap_blks_read) + sum(heap_blks_hit), 0), 1) FROM pg_statio_user_tables), 100.0),
    'active_connections',      (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_db_stats() TO authenticated;
