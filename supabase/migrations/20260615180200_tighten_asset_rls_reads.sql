-- RLS hardening: asset/logistics tables had a permissive `USING (true)` SELECT
-- policy readable by every authenticated member. They are only read by the
-- admin Asset Inventory UI (src/components/admin/AssetInventory/*), so scope
-- reads to is_admin(). Writes/other policies untouched.

drop policy if exists "assets_select" on public.assets;
create policy "assets_select" on public.assets
  for select to authenticated using (is_admin());

drop policy if exists "asset_assignments_select" on public.asset_assignments;
create policy "asset_assignments_select" on public.asset_assignments
  for select to authenticated using (is_admin());

drop policy if exists "asset_requests_select" on public.asset_requests;
create policy "asset_requests_select" on public.asset_requests
  for select to authenticated using (is_admin());

drop policy if exists "asset_categories_select" on public.asset_categories;
create policy "asset_categories_select" on public.asset_categories
  for select to authenticated using (is_admin());

drop policy if exists "asset_maintenance_logs_select" on public.asset_maintenance_logs;
create policy "asset_maintenance_logs_select" on public.asset_maintenance_logs
  for select to authenticated using (is_admin());

drop policy if exists "asset_alerts_select" on public.asset_alerts;
create policy "asset_alerts_select" on public.asset_alerts
  for select to authenticated using (is_admin());

drop policy if exists "Allow authenticated read" on public.logistics_velocity;
create policy "logistics_velocity_admin_select" on public.logistics_velocity
  for select to authenticated using (is_admin());
