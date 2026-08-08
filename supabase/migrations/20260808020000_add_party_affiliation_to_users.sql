-- Migration: add party_affiliation to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS party_affiliation text;

-- Grant column-level SELECT permissions to authenticated and anon roles
GRANT SELECT (party_affiliation) ON TABLE public.users TO authenticated;
GRANT SELECT (party_affiliation) ON TABLE public.users TO anon;
