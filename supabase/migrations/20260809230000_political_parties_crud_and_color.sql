-- Migration: Add color and logo_url columns and write access policies to political_parties table
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS logo_url text;

-- Drop existing policies to ensure clean idempotent application
DROP POLICY IF EXISTS "Allow authenticated manage political_parties" ON public.political_parties;
DROP POLICY IF EXISTS "Allow public read access on political_parties" ON public.political_parties;

-- Allow public read access to political parties
CREATE POLICY "Allow public read access on political_parties"
  ON public.political_parties
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to INSERT, UPDATE, and DELETE political parties
CREATE POLICY "Allow authenticated manage political_parties"
  ON public.political_parties
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant write privileges to authenticated role and read to anon
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.political_parties TO authenticated;
GRANT SELECT ON TABLE public.political_parties TO anon;
