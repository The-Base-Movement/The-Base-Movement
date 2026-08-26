-- Three more buckets with the same pattern found in avatars/media (#434):
-- a write policy inconsistent with (or entirely missing, unlike) the
-- matching read/delete restriction, letting any authenticated member
-- write where only admins should.
--
-- job-banners: INSERT/DELETE had no admin check at all. Only legitimate
-- caller is jobService.uploadJobBanner, called from
-- src/pages/admin/jobs/JobFormPage.tsx (admin-only).
--
-- asset-qr-codes: INSERT/UPDATE had no admin check. Only legitimate
-- caller is useAssetInventory.ts under src/components/admin/AssetInventory.
--
-- it-security-protocols: INSERT had no check at all, while its own
-- SELECT/DELETE policies already correctly require is_admin() -- the
-- INSERT policy was the inconsistent odd one out. Only legitimate
-- caller is itService.uploadSecurityProtocol (IT admin only).

DROP POLICY IF EXISTS "Authenticated upload job banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete job banners" ON storage.objects;

CREATE POLICY "Admins can upload job banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-banners' AND is_admin());

CREATE POLICY "Admins can delete job banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-banners' AND is_admin());

DROP POLICY IF EXISTS "asset_qr_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "asset_qr_auth_update" ON storage.objects;

CREATE POLICY "asset_qr_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-qr-codes' AND is_admin());

CREATE POLICY "asset_qr_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-qr-codes' AND is_admin());

DROP POLICY IF EXISTS "it_security_protocols_auth_insert" ON storage.objects;

CREATE POLICY "it_security_protocols_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'it-security-protocols' AND is_admin());
