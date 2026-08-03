-- Add engagement_status column to track member activity engagement level.
-- Values: 'Active' (last login ≤ 30 days), 'Dormant' (> 30 days), 'Never' (never logged in).
-- Applies only to members with status = 'Active' or 'Approved'.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS engagement_status text;

-- Create index for fast filtering by engagement status
CREATE INDEX IF NOT EXISTS idx_users_engagement_status ON public.users (engagement_status);

-- Grant SELECT on engagement_status to authenticated and anon roles
-- (users table uses column-level SELECT grants).
GRANT SELECT (engagement_status) ON TABLE public.users TO authenticated;
GRANT SELECT (engagement_status) ON TABLE public.users TO anon;

-- SQL function to categorize member engagement and return updated count.
-- Logic:
--   - 'Never': member has never signed in (last_sign_in_at IS NULL)
--   - 'Active': last_sign_in_at <= 30 days ago
--   - 'Dormant': last_sign_in_at > 30 days ago
-- Only processes members with status = 'Active' or 'Approved'.
-- Sign-in timestamps live in auth.users, not public.users.
-- public.users.id === auth.users.id; members with no auth account are 'Never'.
CREATE OR REPLACE FUNCTION public.categorize_member_engagement()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated_count bigint := 0;
BEGIN
  UPDATE public.users u
  SET engagement_status = COALESCE(
    (
      SELECT CASE
        WHEN a.last_sign_in_at IS NULL THEN 'Never'
        WHEN (now() - a.last_sign_in_at) <= interval '30 days' THEN 'Active'
        ELSE 'Dormant'
      END
      FROM auth.users a
      WHERE a.id = u.id
    ),
    'Never'
  )
  WHERE u.status = 'Active' OR u.status = 'Approved';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;
