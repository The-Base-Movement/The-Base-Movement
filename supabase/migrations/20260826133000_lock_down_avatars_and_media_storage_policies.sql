-- Found live and confirmed exploitable: any unauthenticated visitor could
-- upload or overwrite ANY file in the public 'avatars' bucket (leftover
-- broad policies "Allow anonymous uploads"/"Allow anonymous updates" and
-- an unscoped "Allow authenticated uploads", alongside the correctly
-- per-user-folder-scoped policies -- since RLS policies are OR'd, the
-- broad ones made the scoped ones meaningless). Confirmed via a real
-- anonymous curl upload (200 OK), cleaned up.
--
-- 'media' bucket was worse: INSERT/DELETE granted to role `public`
-- (despite being named "Authenticated Upload"/"Authenticated Delete")
-- with zero ownership check -- any anonymous visitor could upload
-- arbitrary files or delete ANY existing file in the CMS media library.
-- Confirmed via a real anonymous upload + delete (both 200 OK), cleaned
-- up. Every legitimate caller (contentService.uploadImage/deleteMediaFile/
-- replaceMediaFile) is only ever invoked from src/pages/admin/* -- no
-- legitimate non-admin write path exists.

DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND is_admin());
