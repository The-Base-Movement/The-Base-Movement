-- Harden newsletter management so browser sessions cannot mutate newsletter
-- rows unless the caller is a privileged admin or an editor-equivalent admin.
-- Edge functions continue to use the service-role key for writes.

alter table public.newsletters enable row level security;
alter table public.newsletter_events enable row level security;

drop policy if exists "newsletter_admins_select_newsletters" on public.newsletters;
drop policy if exists "newsletter_admins_manage_newsletters" on public.newsletters;
drop policy if exists "admins can select newsletters" on public.newsletters;
drop policy if exists "admins can insert newsletters" on public.newsletters;
drop policy if exists "admins can update newsletters" on public.newsletters;
drop policy if exists "Admins can delete newsletters" on public.newsletters;
drop policy if exists "newsletter_admins_select_newsletter_events" on public.newsletter_events;
drop policy if exists "service_role_insert_newsletter_events" on public.newsletter_events;
drop policy if exists "Admins can read newsletter events" on public.newsletter_events;

create policy "newsletter_admins_select_newsletters"
on public.newsletters
for select
using (
  auth.role() = 'service_role'
  or exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
  )
);

create policy "newsletter_admins_manage_newsletters"
on public.newsletters
for all
using (
  auth.role() = 'service_role'
  or exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and (
        upper(coalesce(a.role, '')) in ('SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE')
        or coalesce((a.permissions ->> 'can_post_blog')::boolean, false)
      )
  )
)
with check (
  auth.role() = 'service_role'
  or exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and (
        upper(coalesce(a.role, '')) in ('SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE')
        or coalesce((a.permissions ->> 'can_post_blog')::boolean, false)
      )
  )
);

create policy "newsletter_admins_select_newsletter_events"
on public.newsletter_events
for select
using (
  auth.role() = 'service_role'
  or exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and (
        upper(coalesce(a.role, '')) in ('SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE')
        or coalesce((a.permissions ->> 'can_post_blog')::boolean, false)
      )
  )
);

create policy "service_role_insert_newsletter_events"
on public.newsletter_events
for insert
with check (auth.role() = 'service_role');
