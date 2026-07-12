-- Migration: add voters_id_card and polling_station_code to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS voters_id_card text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS polling_station_code text;

-- Grant column-level SELECT permissions to authenticated and anon roles
GRANT SELECT (voters_id_card, polling_station_code) ON TABLE public.users TO authenticated;
GRANT SELECT (voters_id_card, polling_station_code) ON TABLE public.users TO anon;
