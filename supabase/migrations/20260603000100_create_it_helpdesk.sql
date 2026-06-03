-- supabase/migrations/20260603000100_create_it_helpdesk.sql

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.it_tickets (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  priority      TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low','medium','high')),
  status        TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','in-progress','resolved')),
  submitted_by  UUID        NOT NULL REFERENCES public.admins(id),
  assigned_to   UUID        REFERENCES public.admins(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.it_ticket_comments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID        NOT NULL REFERENCES public.it_tickets(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.admins(id),
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.it_tickets_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS it_tickets_updated_at ON public.it_tickets;
CREATE TRIGGER it_tickets_updated_at
  BEFORE UPDATE ON public.it_tickets
  FOR EACH ROW EXECUTE FUNCTION public.it_tickets_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.it_tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_comments ENABLE ROW LEVEL SECURITY;

-- it_tickets: IT staff full access
DROP POLICY IF EXISTS "it_tickets_staff_all" ON public.it_tickets;
CREATE POLICY "it_tickets_staff_all"
  ON public.it_tickets FOR ALL TO authenticated
  USING      ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'))
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- it_tickets: any admin can insert their own ticket
DROP POLICY IF EXISTS "it_tickets_submitter_insert" ON public.it_tickets;
CREATE POLICY "it_tickets_submitter_insert"
  ON public.it_tickets FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- it_tickets: submitter can read their own tickets
DROP POLICY IF EXISTS "it_tickets_submitter_select" ON public.it_tickets;
CREATE POLICY "it_tickets_submitter_select"
  ON public.it_tickets FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- it_ticket_comments: IT staff full access
DROP POLICY IF EXISTS "it_comments_staff_all" ON public.it_ticket_comments;
CREATE POLICY "it_comments_staff_all"
  ON public.it_ticket_comments FOR ALL TO authenticated
  USING      ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'))
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- it_ticket_comments: submitter can insert comment on their own ticket
DROP POLICY IF EXISTS "it_comments_submitter_insert" ON public.it_ticket_comments;
CREATE POLICY "it_comments_submitter_insert"
  ON public.it_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.it_tickets t
      WHERE t.id = ticket_id AND t.submitted_by = auth.uid()
    )
  );

-- it_ticket_comments: submitter can read comments on their own tickets
DROP POLICY IF EXISTS "it_comments_submitter_select" ON public.it_ticket_comments;
CREATE POLICY "it_comments_submitter_select"
  ON public.it_ticket_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.it_tickets t
      WHERE t.id = ticket_id AND t.submitted_by = auth.uid()
    )
  );
