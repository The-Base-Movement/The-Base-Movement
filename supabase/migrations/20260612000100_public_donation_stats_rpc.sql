-- The donate page's "Donors" badge showed the total registered-user count
-- because donations RLS only lets members read their own rows, so there was
-- no way to count distinct donors client-side. Expose aggregate stats only
-- (no row data, no PII) through a SECURITY DEFINER RPC; this also makes
-- "Total raised" correct for non-admin members, who previously summed only
-- their own donations.
CREATE OR REPLACE FUNCTION public.get_public_donation_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'total_raised', coalesce(sum(amount), 0),
    'donor_count', count(DISTINCT coalesce(member_id::text, lower(trim(full_name))))
  )
  FROM donations
  WHERE status = 'Verified';
$$;

REVOKE ALL ON FUNCTION public.get_public_donation_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_donation_stats() TO anon, authenticated;
