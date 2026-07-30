-- ============================================================================
-- Security Hardening Migration: Admin Privilege Escalation & RLS Lockdown
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper Function: is_founder_or_super_admin()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_founder_or_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.id = (SELECT auth.uid())
      AND a.role IN ('SUPER_ADMIN', 'FOUNDER')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_founder_or_super_admin() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Lock down public.admins RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admins to update their own record" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update any admin" ON public.admins;
DROP POLICY IF EXISTS "Admins can read admins table" ON public.admins;
DROP POLICY IF EXISTS admins_select ON public.admins;
DROP POLICY IF EXISTS admins_insert ON public.admins;
DROP POLICY IF EXISTS admins_update ON public.admins;
DROP POLICY IF EXISTS admins_delete ON public.admins;

-- Admins can read the admins table if authenticated and marked as admin
CREATE POLICY admins_select ON public.admins
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Only SUPER_ADMIN or FOUNDER can insert new admins
CREATE POLICY admins_insert ON public.admins
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_founder_or_super_admin()));

-- Only SUPER_ADMIN or FOUNDER can update admin records (prevents role self-elevation)
CREATE POLICY admins_update ON public.admins
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_founder_or_super_admin()))
  WITH CHECK ((SELECT public.is_founder_or_super_admin()));

-- Only SUPER_ADMIN or FOUNDER can delete admin records
CREATE POLICY admins_delete ON public.admins
  FOR DELETE TO authenticated
  USING ((SELECT public.is_founder_or_super_admin()));

-- Column-level privilege restriction for authenticated role on public.admins
REVOKE UPDATE ON public.admins FROM authenticated;
GRANT UPDATE (preferences, chapter, assigned_region) ON public.admins TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Lock down public.admin_roles management
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage admin roles (insert)" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage admin roles (update)" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage admin roles (delete)" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage admin roles (select)" ON public.admin_roles;
DROP POLICY IF EXISTS admin_roles_insert ON public.admin_roles;
DROP POLICY IF EXISTS admin_roles_update ON public.admin_roles;
DROP POLICY IF EXISTS admin_roles_delete ON public.admin_roles;
DROP POLICY IF EXISTS admin_roles_select ON public.admin_roles;

CREATE POLICY admin_roles_select ON public.admin_roles
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY admin_roles_insert ON public.admin_roles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_founder_or_super_admin()));

CREATE POLICY admin_roles_update ON public.admin_roles
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_founder_or_super_admin()))
  WITH CHECK ((SELECT public.is_founder_or_super_admin()));

CREATE POLICY admin_roles_delete ON public.admin_roles
  FOR DELETE TO authenticated
  USING ((SELECT public.is_founder_or_super_admin()));

-- ----------------------------------------------------------------------------
-- 4. Lock down public.chapters updates
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can insert chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow public read access to chapters" ON public.chapters;
DROP POLICY IF EXISTS "Chapter Leaders can update their own chapters" ON public.chapters;
DROP POLICY IF EXISTS chapters_update ON public.chapters;

CREATE POLICY chapters_update ON public.chapters
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_admin()) OR (leader_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_admin()) OR (leader_id = (SELECT auth.uid()))
  );

-- Revoke blanket UPDATE on chapters and grant column-level update privileges to authenticated
REVOKE UPDATE ON public.chapters FROM authenticated;
GRANT UPDATE (
  name,
  description,
  meeting_schedule,
  local_focus,
  email,
  phone_number,
  details_url,
  latitude,
  longitude
) ON public.chapters TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Explicit Scoping for Ghana Constituencies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS ghana_constituencies_insert ON public.ghana_constituencies;
DROP POLICY IF EXISTS ghana_constituencies_update ON public.ghana_constituencies;
DROP POLICY IF EXISTS ghana_constituencies_delete ON public.ghana_constituencies;
DROP POLICY IF EXISTS "Admins can manage constituencies" ON public.ghana_constituencies;

CREATE POLICY ghana_constituencies_insert ON public.ghana_constituencies
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY ghana_constituencies_update ON public.ghana_constituencies
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY ghana_constituencies_delete ON public.ghana_constituencies
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));
