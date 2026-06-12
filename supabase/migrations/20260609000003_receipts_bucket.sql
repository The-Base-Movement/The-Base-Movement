-- Create public receipts storage bucket.
-- Receipts are addressed by donation UUID (unguessable), so public read is safe.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  524288,  -- 512 KB max per receipt
  ARRAY['text/html']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read (bucket is public but we add explicit policy for clarity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'receipts_public_read'
  ) THEN
    CREATE POLICY "receipts_public_read" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'receipts');
  END IF;
END$$;
