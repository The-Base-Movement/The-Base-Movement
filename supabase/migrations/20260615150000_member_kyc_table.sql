-- Per-member KYC document tracking (Ghana Card front/back + selfie) and
-- verification status. Smile ID columns stay empty until Phase 2.
create table if not exists public.member_kyc (
  user_id uuid primary key references public.users (id) on delete cascade,
  ghana_card_front_path text,
  ghana_card_back_path text,
  selfie_path text,
  status text not null default 'not_uploaded'
    check (status in ('not_uploaded', 'uploaded', 'pending_verification', 'verified', 'failed')),
  smile_job_id text,
  smile_result jsonb,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.member_kyc enable row level security;

-- Members manage their own row; admins (is_admin) can read/update any (review).
create policy "member_kyc_select" on public.member_kyc
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin());

create policy "member_kyc_insert" on public.member_kyc
  for insert to authenticated
  with check (user_id = (select auth.uid()) or is_admin());

create policy "member_kyc_update" on public.member_kyc
  for update to authenticated
  using (user_id = (select auth.uid()) or is_admin())
  with check (user_id = (select auth.uid()) or is_admin());

grant select, insert, update on public.member_kyc to authenticated;
