ALTER TABLE public.users ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;
GRANT SELECT (followup_sent_at) ON TABLE public.users TO authenticated;
GRANT SELECT (followup_sent_at) ON TABLE public.users TO anon;
