-- Message actions: reply, edit (15-minute window), recall, per-user delete, reactions.
--
-- Recall and moderator removal are deliberately different columns:
--   recalled_at  — the author took it back. Content is wiped, a tombstone remains
--                  so the conversation still reads sensibly around it.
--   is_deleted   — a moderator removed it. The row never reaches other members.
-- Overloading is_deleted for both would make a recall indistinguishable from a
-- takedown, and would either leak removed content or hide recalls entirely.

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists recalled_at timestamptz;

create index if not exists messages_reply_to_idx on public.messages (reply_to_id)
  where reply_to_id is not null;

-- A recalled message has no content, so the non-empty check has to yield to it.
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(content) > 0 or recalled_at is not null);

-- Reactions ---------------------------------------------------------------
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null check (emoji in ('👍','❤️','😂','😮','😢','🙏')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_idx
  on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- Visibility rides on the messages policy: the subquery below is itself subject to
-- RLS on messages, so a reaction is readable exactly when its message is. messages
-- policies never reference message_reactions, so there is no recursion.
drop policy if exists message_reactions_select on public.message_reactions;
create policy message_reactions_select on public.message_reactions
  for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id));

drop policy if exists message_reactions_insert on public.message_reactions;
create policy message_reactions_insert on public.message_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.messages m where m.id = message_id)
  );

drop policy if exists message_reactions_delete on public.message_reactions;
create policy message_reactions_delete on public.message_reactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Per-user "delete for me" -------------------------------------------------
create table if not exists public.message_hides (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_hides enable row level security;

drop policy if exists message_hides_all on public.message_hides;
create policy message_hides_all on public.message_hides
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Realtime so reactions and recalls land on other screens without a reload.
alter publication supabase_realtime add table public.message_reactions;
