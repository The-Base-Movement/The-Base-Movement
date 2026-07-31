-- ============================================================================
-- Fix admins table SELECT RLS policy to allow self-lookup for authenticated users
-- ============================================================================
-- Previously, admins_select required `(SELECT public.is_admin())`. When a non-admin
-- authenticated user checked whether they were an admin (via id = auth.uid()),
-- RLS evaluated to false, causing Supabase REST to return HTTP 403 Forbidden.
--
-- By adding `id = (SELECT auth.uid())` to the SELECT policy, non-admin users can
-- query their own record without raising permission errors (returning 0 rows / null).
-- Non-admin users still cannot view any other admin rows.

DROP POLICY IF EXISTS admins_select ON public.admins;

CREATE POLICY admins_select ON public.admins
  FOR SELECT TO authenticated
  USING ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()));
