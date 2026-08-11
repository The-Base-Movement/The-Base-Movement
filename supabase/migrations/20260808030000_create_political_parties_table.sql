-- Migration: create political_parties reference table and seed Ghana political parties
CREATE TABLE IF NOT EXISTS public.political_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  full_label text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;

-- Allow public read access to political parties
DROP POLICY IF EXISTS "Allow public read access on political_parties" ON public.political_parties;
CREATE POLICY "Allow public read access on political_parties"
  ON public.political_parties
  FOR SELECT
  TO public
  USING (true);

-- Seed the 10 Ghana political parties
INSERT INTO public.political_parties (name, code, full_label, sort_order) VALUES
  ('New Patriotic Party', 'NPP', 'New Patriotic Party — NPP', 1),
  ('Great Consolidated Popular Party', 'GCPP', 'Great Consolidated Popular Party — GCPP', 2),
  ('Ghana Freedom Party', 'GFP', 'Ghana Freedom Party — GFP', 3),
  ('Ghana Union Movement', 'GUM', 'Ghana Union Movement — GUM', 4),
  ('Liberal Party of Ghana', 'LPG', 'Liberal Party of Ghana — LPG', 5),
  ('National Democratic Party', 'NDP', 'National Democratic Party — NDP', 6),
  ('Convention People’s Party', 'CPP', 'Convention People’s Party — CPP', 7),
  ('National Democratic Congress', 'NDC', 'National Democratic Congress — NDC', 8),
  ('All People’s Congress', 'APC', 'All People’s Congress — APC', 9),
  ('The New Force', 'NF', 'The New Force — NF', 10)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  full_label = EXCLUDED.full_label,
  sort_order = EXCLUDED.sort_order;

-- Grant SELECT permissions
GRANT SELECT ON TABLE public.political_parties TO anon;
GRANT SELECT ON TABLE public.political_parties TO authenticated;
