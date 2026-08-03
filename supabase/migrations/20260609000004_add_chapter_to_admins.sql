-- Add chapter column to admins for CHAPTER_LEAD diaspora scoping
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS chapter TEXT;

GRANT SELECT (chapter) ON TABLE public.admins TO authenticated;
GRANT SELECT (chapter) ON TABLE public.admins TO anon;
