-- Migration: Add color column and write access policies to political_parties table
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS color text;

-- Allow authenticated users to INSERT, UPDATE, and DELETE political parties
CREATE POLICY "Allow authenticated manage political_parties"
  ON public.political_parties
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant write privileges to authenticated role
GRANT INSERT, UPDATE, DELETE ON TABLE public.political_parties TO authenticated;
