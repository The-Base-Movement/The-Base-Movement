-- IT Noticeboard: notes can be archived (hidden from the active board but
-- kept for reference). NULL = active. Author-or-admin UPDATE RLS already
-- covers setting/clearing this.
ALTER TABLE public.it_notes ADD COLUMN IF NOT EXISTS archived_at timestamptz;
