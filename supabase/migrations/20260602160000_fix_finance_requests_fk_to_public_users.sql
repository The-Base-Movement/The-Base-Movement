-- PostgREST only tracks FK relationships within the public schema.
-- The original FKs pointed to auth.users(id), making the join
-- finance_requests?select=*,users:requester_id(full_name) return 400.
-- Repoint both FKs to public.users(id) to enable the join.

ALTER TABLE public.finance_requests
  DROP CONSTRAINT finance_requests_requester_id_fkey,
  ADD CONSTRAINT finance_requests_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.finance_requests
  DROP CONSTRAINT finance_requests_reviewed_by_fkey,
  ADD CONSTRAINT finance_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES public.users(id);
