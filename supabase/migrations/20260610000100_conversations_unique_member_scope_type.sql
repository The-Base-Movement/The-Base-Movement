-- One conversation per member per scope type (was one per member total).
-- Enables platform-correct routing: GHANA -> constituency, DIASPORA -> chapter.
ALTER TABLE public.conversations DROP CONSTRAINT conversations_member_id_key;

ALTER TABLE public.conversations ADD CONSTRAINT conversations_member_id_scope_type_key UNIQUE (member_id, scope_type);
