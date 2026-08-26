-- "Members can upload resumes" only checked auth.uid() IS NOT NULL, no
-- folder scoping -- any authenticated member could write to any path in
-- job-resumes. Lower severity than avatars/media (private, admin-read-only
-- bucket, randomized non-guessable filenames), but jobService.uploadResume
-- now prefixes uploads with the member's own auth.uid() folder, matching
-- the avatars pattern, so scope the policy to match.

DROP POLICY IF EXISTS "Members can upload resumes" ON storage.objects;

CREATE POLICY "Members can upload their own resume"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
