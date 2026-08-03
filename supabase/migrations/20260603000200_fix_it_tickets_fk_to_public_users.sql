-- Repoint it_tickets FKs from admins to users so PostgREST can resolve full_name joins.
-- admins.id = users.id (admins_id_fkey), so auth.uid() and RLS are unaffected.

ALTER TABLE public.it_tickets
  DROP CONSTRAINT IF EXISTS it_tickets_submitted_by_fkey,
  DROP CONSTRAINT IF EXISTS it_tickets_assigned_to_fkey;

ALTER TABLE public.it_tickets
  ADD CONSTRAINT it_tickets_submitted_by_fkey
    FOREIGN KEY (submitted_by) REFERENCES public.users(id),
  ADD CONSTRAINT it_tickets_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES public.users(id);

ALTER TABLE public.it_ticket_comments
  DROP CONSTRAINT IF EXISTS it_ticket_comments_author_id_fkey;

ALTER TABLE public.it_ticket_comments
  ADD CONSTRAINT it_ticket_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.users(id);
