ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS closing_notified boolean NOT NULL DEFAULT false;
