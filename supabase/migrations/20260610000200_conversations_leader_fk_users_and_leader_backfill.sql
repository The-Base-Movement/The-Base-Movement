-- Leaders are appointed members (chapters.leader_id / ghana_constituencies.leader_id),
-- not rows in admins. Point the conversations FK at users so appointed leads can hold conversations.
ALTER TABLE public.conversations DROP CONSTRAINT conversations_leader_id_fkey;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_leader_id_fkey
  FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE RESTRICT;

-- Backfill chapters.leader_id from leader_name where the appointment only saved the name
UPDATE public.chapters c
SET leader_id = u.id
FROM public.users u
WHERE c.leader_id IS NULL
  AND c.leader_name IS NOT NULL
  AND c.leader_name <> 'Unassigned'
  AND u.full_name = c.leader_name;
