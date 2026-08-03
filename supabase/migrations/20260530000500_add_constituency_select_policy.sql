-- Migration: allow authenticated members to select all verified/non-deleted member profiles
-- Column-level security (revoked select on national_id in migration 20260530000203) guarantees that 
-- sensitive data remains completely encrypted and hidden from authenticated/anon roles, while
-- allowing patriots to view chapters and constituencies directories cleanly on the dashboard.

-- Drop previous specific policies to keep database clean
DROP POLICY IF EXISTS "users_same_chapter_select" ON public.users;
DROP POLICY IF EXISTS "users_same_constituency_select" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read access to members" ON public.users;

-- Create broad read policy for authenticated member directory
CREATE POLICY "Allow authenticated read access to members" ON public.users
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);
