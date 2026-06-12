-- Migration: create constituency_leaders table for committee roles
-- Adds support for Secretary, Deputy Secretary, and Treasurer per constituency

CREATE TABLE IF NOT EXISTS public.constituency_leaders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  constituency_id INTEGER NOT NULL REFERENCES public.ghana_constituencies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Secretary', 'Deputy Secretary', 'Treasurer')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.constituency_leaders ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon or authenticated) to read the leaders
CREATE POLICY "constituency_leaders_public_select" ON public.constituency_leaders
  FOR SELECT USING (true);

-- Allow authenticated users to insert (admin permission enforced at app layer)
CREATE POLICY "constituency_leaders_auth_insert" ON public.constituency_leaders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "constituency_leaders_auth_delete" ON public.constituency_leaders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fast lookup index
CREATE INDEX IF NOT EXISTS constituency_leaders_constituency_id_idx
  ON public.constituency_leaders(constituency_id);
