-- Harden finance request review so browser sessions cannot directly mutate
-- review state. Create requests remain browser-authenticated; review updates
-- become service-role only and must flow through the finance-review function.

alter table public.finance_requests enable row level security;

drop policy if exists "finance_requests_select_access" on public.finance_requests;
drop policy if exists "finance_requests_insert_own" on public.finance_requests;
drop policy if exists "finance_requests_service_role_update" on public.finance_requests;

create policy "finance_requests_select_access"
on public.finance_requests
for select
using (
  auth.role() = 'service_role'
  or requester_id = auth.uid()
  or exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
  )
);

create policy "finance_requests_insert_own"
on public.finance_requests
for insert
with check (
  requester_id = auth.uid()
);

create policy "finance_requests_service_role_update"
on public.finance_requests
for update
using (
  auth.role() = 'service_role'
)
with check (
  auth.role() = 'service_role'
);
