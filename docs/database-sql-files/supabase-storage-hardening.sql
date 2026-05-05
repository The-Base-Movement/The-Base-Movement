-- Description: Hardening Supabase Storage policies to prevent broad file listing and restrict access to own folders.
-- Path: docs/database-sql-files/supabase-storage-hardening.sql

-- Drop existing broad policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- 1. SELECT Policy: Restrict listing to own folder for authenticated users
-- Note: Public access via URL is handled by the bucket's public status, 
-- so we don't need a broad SELECT policy here.
CREATE POLICY "Users can select their own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. INSERT Policy: Only authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. UPDATE Policy: Only authenticated users can update their own folder
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. DELETE Policy: Only authenticated users can delete from their own folder
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
