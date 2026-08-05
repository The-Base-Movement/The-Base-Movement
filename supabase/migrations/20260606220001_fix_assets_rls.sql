-- Drop existing RLS policies on asset tables
DROP POLICY IF EXISTS "asset_categories_select" ON public.asset_categories;
DROP POLICY IF EXISTS "asset_categories_insert" ON public.asset_categories;
DROP POLICY IF EXISTS "asset_categories_update" ON public.asset_categories;
DROP POLICY IF EXISTS "asset_categories_delete" ON public.asset_categories;

DROP POLICY IF EXISTS "assets_select" ON public.assets;
DROP POLICY IF EXISTS "assets_insert" ON public.assets;
DROP POLICY IF EXISTS "assets_update" ON public.assets;
DROP POLICY IF EXISTS "assets_delete" ON public.assets;

DROP POLICY IF EXISTS "asset_assignments_select" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_assignments_insert" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_assignments_update" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_assignments_delete" ON public.asset_assignments;

DROP POLICY IF EXISTS "asset_maintenance_logs_select" ON public.asset_maintenance_logs;
DROP POLICY IF EXISTS "asset_maintenance_logs_insert" ON public.asset_maintenance_logs;
DROP POLICY IF EXISTS "asset_maintenance_logs_update" ON public.asset_maintenance_logs;
DROP POLICY IF EXISTS "asset_maintenance_logs_delete" ON public.asset_maintenance_logs;

DROP POLICY IF EXISTS "asset_requests_select" ON public.asset_requests;
DROP POLICY IF EXISTS "asset_requests_insert" ON public.asset_requests;
DROP POLICY IF EXISTS "asset_requests_update" ON public.asset_requests;

DROP POLICY IF EXISTS "asset_alerts_select" ON public.asset_alerts;
DROP POLICY IF EXISTS "asset_alerts_insert" ON public.asset_alerts;
DROP POLICY IF EXISTS "asset_alerts_update" ON public.asset_alerts;

-- Recreate RLS policies using public.admins role mapping
-- 1. asset_categories
CREATE POLICY "asset_categories_select" ON public.asset_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asset_categories_insert" ON public.asset_categories
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_categories_update" ON public.asset_categories
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_categories_delete" ON public.asset_categories
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

-- 2. assets
CREATE POLICY "assets_select" ON public.assets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assets_insert" ON public.assets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "assets_update" ON public.assets
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "assets_delete" ON public.assets
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

-- 3. asset_assignments
CREATE POLICY "asset_assignments_select" ON public.asset_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asset_assignments_insert" ON public.asset_assignments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_assignments_update" ON public.asset_assignments
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_assignments_delete" ON public.asset_assignments
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

-- 4. asset_maintenance_logs
CREATE POLICY "asset_maintenance_logs_select" ON public.asset_maintenance_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asset_maintenance_logs_insert" ON public.asset_maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_maintenance_logs_update" ON public.asset_maintenance_logs
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_maintenance_logs_delete" ON public.asset_maintenance_logs
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

-- 5. asset_requests
CREATE POLICY "asset_requests_select" ON public.asset_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asset_requests_insert" ON public.asset_requests
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "asset_requests_update" ON public.asset_requests
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

-- 6. asset_alerts
CREATE POLICY "asset_alerts_select" ON public.asset_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asset_alerts_insert" ON public.asset_alerts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));

CREATE POLICY "asset_alerts_update" ON public.asset_alerts
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER', 'SuperAdmin', 'it_manager', 'Founder'));
