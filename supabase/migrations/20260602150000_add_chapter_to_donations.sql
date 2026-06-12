ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS chapter TEXT;

GRANT SELECT (chapter) ON TABLE public.donations TO authenticated;
GRANT SELECT (chapter) ON TABLE public.donations TO anon;
