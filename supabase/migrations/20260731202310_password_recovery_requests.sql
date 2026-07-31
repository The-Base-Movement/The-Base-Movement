create table if not exists public.password_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  old_phone text not null,
  normalized_old_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  discord_notified_at timestamptz
);

create index if not exists password_recovery_requests_phone_idx
  on public.password_recovery_requests (normalized_old_phone);

create index if not exists password_recovery_requests_status_submitted_idx
  on public.password_recovery_requests (status, submitted_at desc);

alter table public.password_recovery_requests enable row level security;

revoke all on public.password_recovery_requests from public;
revoke all on public.password_recovery_requests from anon;
grant select on public.password_recovery_requests to authenticated;
grant all on public.password_recovery_requests to service_role;

drop policy if exists password_recovery_requests_admin_select on public.password_recovery_requests;
create policy password_recovery_requests_admin_select
  on public.password_recovery_requests
  for select
  to authenticated
  using ((select public.is_admin()));
