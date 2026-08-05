-- Monthly dues core data model: settings, enrollments, append-only consents,
-- monthly obligations/payments, and reminder delivery ledger.
-- Design: docs/specs/2026-07-12-monthly-dues-system-design.md

-- ---------------------------------------------------------------------------
-- Finance permission helper (MANAGE_DONATIONS:DONATIONS or privileged role)
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_monthly_dues()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and (
        upper(coalesce(a.role, '')) in ('SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE')
        or (
          jsonb_typeof(a.permissions) = 'array'
          and exists (
            select 1
            from jsonb_array_elements(a.permissions) p
            where p ->> 'action' = 'MANAGE_DONATIONS'
              and p ->> 'resource' = 'DONATIONS'
          )
        )
        or (
          jsonb_typeof(a.permissions) = 'object'
          and coalesce((a.permissions ->> 'can_manage_donations')::boolean, false)
        )
      )
  );
$$;

revoke execute on function public.can_manage_monthly_dues() from public, anon;
grant execute on function public.can_manage_monthly_dues() to authenticated;

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.monthly_dues_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- monthly_dues_settings — singleton active policy, finance-managed
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_dues_settings (
  id uuid primary key default gen_random_uuid(),
  amount_ghs numeric(12, 2) not null check (amount_ghs > 0),
  due_day integer not null check (due_day between 1 and 28),
  grace_period_days integer not null default 3 check (grace_period_days between 0 and 28),
  recurring_enrollment_enabled boolean not null default false,
  policy_version text not null,
  is_active boolean not null default true,
  effective_from timestamptz not null default now(),
  updated_by uuid references public.admins (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists monthly_dues_settings_single_active
  on public.monthly_dues_settings (is_active)
  where is_active;

create trigger monthly_dues_settings_updated_at
  before update on public.monthly_dues_settings
  for each row execute function public.monthly_dues_set_updated_at();

alter table public.monthly_dues_settings enable row level security;
revoke all on table public.monthly_dues_settings from anon, authenticated;

create policy "finance manages dues settings"
  on public.monthly_dues_settings for all to authenticated
  using (public.can_manage_monthly_dues())
  with check (public.can_manage_monthly_dues());

grant select, insert, update on table public.monthly_dues_settings to authenticated;

-- ---------------------------------------------------------------------------
-- monthly_dues_enrollments — one current enrollment per member
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_dues_enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.users (id),
  status text not null default 'active'
    check (status in ('active', 'opted_out', 'pending_activation', 'cancellation_pending')),
  payment_mode text not null default 'manual'
    check (payment_mode in ('manual', 'recurring')),
  hubtel_invoice_id text,
  enrolled_at timestamptz not null default now(),
  opted_out_at timestamptz,
  provider_cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger monthly_dues_enrollments_updated_at
  before update on public.monthly_dues_enrollments
  for each row execute function public.monthly_dues_set_updated_at();

alter table public.monthly_dues_enrollments enable row level security;
revoke all on table public.monthly_dues_enrollments from anon, authenticated;
grant select on table public.monthly_dues_enrollments to authenticated;

create policy "members read own dues enrollment"
  on public.monthly_dues_enrollments for select to authenticated
  using (auth.uid() = member_id or public.can_manage_monthly_dues());

-- Enrollment state changes run only through server-authorized RPCs
-- (security definer) or the service role; no direct member write policies.

-- ---------------------------------------------------------------------------
-- monthly_dues_consents — append-only consent evidence
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_dues_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.users (id),
  email_enabled boolean not null,
  sms_enabled boolean not null,
  dues_enrollment_enabled boolean not null,
  recurring_payment_authorized boolean not null default false,
  policy_version text,
  source text not null
    check (source in ('enrollment', 'profile_settings', 'opt_out', 'admin_correction')),
  recorded_at timestamptz not null default now()
);

create index if not exists monthly_dues_consents_member_recorded
  on public.monthly_dues_consents (member_id, recorded_at desc);

alter table public.monthly_dues_consents enable row level security;
revoke all on table public.monthly_dues_consents from anon, authenticated;
grant select, insert on table public.monthly_dues_consents to authenticated;

create policy "members read own dues consent"
  on public.monthly_dues_consents for select to authenticated
  using (auth.uid() = member_id or public.can_manage_monthly_dues());

create policy "members insert own dues consent"
  on public.monthly_dues_consents for insert to authenticated
  with check (auth.uid() = member_id);

revoke update, delete on table public.monthly_dues_consents from authenticated, anon;

-- ---------------------------------------------------------------------------
-- monthly_dues_payments — one obligation/payment row per member and month
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_dues_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.users (id),
  dues_month date not null check (dues_month = date_trunc('month', dues_month)::date),
  due_date date not null,
  amount_ghs numeric(12, 2) not null check (amount_ghs > 0),
  display_amount numeric(12, 2) not null check (display_amount > 0),
  display_currency text not null default 'GHS',
  exchange_rate_to_ghs numeric(18, 8) not null default 1 check (exchange_rate_to_ghs > 0),
  payment_mode text not null default 'manual_hubtel'
    check (payment_mode in ('manual_hubtel', 'recurring_hubtel', 'offline')),
  status text not null default 'due'
    check (status in ('due', 'pending', 'paid', 'failed', 'overdue', 'waived', 'cancelled')),
  hubtel_reference text,
  provider_transaction_id text unique,
  paid_at timestamptz,
  verified_by uuid references public.admins (id),
  verification_notes text,
  receipt_number text,
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, dues_month)
);

create index if not exists monthly_dues_payments_status_due
  on public.monthly_dues_payments (status, due_date);

create trigger monthly_dues_payments_updated_at
  before update on public.monthly_dues_payments
  for each row execute function public.monthly_dues_set_updated_at();

alter table public.monthly_dues_payments enable row level security;
revoke all on table public.monthly_dues_payments from anon, authenticated;
grant select on table public.monthly_dues_payments to authenticated;

create policy "members read own dues payments"
  on public.monthly_dues_payments for select to authenticated
  using (auth.uid() = member_id or public.can_manage_monthly_dues());

-- Payment mutations happen only via security definer RPCs / service-role
-- callbacks so Hubtel, not browser state, determines payment success.

-- ---------------------------------------------------------------------------
-- monthly_dues_reminders — delivery ledger with unique-stage claims
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_dues_reminders (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.monthly_dues_payments (id) on delete cascade,
  member_id uuid not null references public.users (id),
  channel text not null check (channel in ('email', 'sms')),
  reminder_stage text not null check (reminder_stage in ('pre_due', 'due', 'overdue')),
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_reference text,
  attempted_at timestamptz not null default now(),
  failure_reason text,
  unique (payment_id, channel, reminder_stage)
);

alter table public.monthly_dues_reminders enable row level security;
revoke all on table public.monthly_dues_reminders from anon, authenticated;
grant select on table public.monthly_dues_reminders to authenticated;

create policy "members read own dues reminders"
  on public.monthly_dues_reminders for select to authenticated
  using (auth.uid() = member_id or public.can_manage_monthly_dues());

-- ---------------------------------------------------------------------------
-- get_current_monthly_dues_settings — restricted read of active policy terms
-- ---------------------------------------------------------------------------
create or replace function public.get_current_monthly_dues_settings()
returns table (
  amount_ghs numeric,
  due_day integer,
  grace_period_days integer,
  recurring_enrollment_enabled boolean,
  policy_version text,
  effective_from timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.amount_ghs, s.due_day, s.grace_period_days,
         s.recurring_enrollment_enabled, s.policy_version, s.effective_from
  from public.monthly_dues_settings s
  where s.is_active
  order by s.effective_from desc
  limit 1;
$$;

revoke execute on function public.get_current_monthly_dues_settings() from public, anon;
grant execute on function public.get_current_monthly_dues_settings() to authenticated;

-- ---------------------------------------------------------------------------
-- set_monthly_dues_consent — append a consent row bound to the caller
-- ---------------------------------------------------------------------------
create or replace function public.set_monthly_dues_consent(
  p_email boolean,
  p_sms boolean,
  p_source text default 'profile_settings'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid := auth.uid();
  v_prev public.monthly_dues_consents%rowtype;
  v_policy text;
  v_id uuid;
begin
  if v_member is null then
    raise exception 'Not authenticated';
  end if;

  if p_source not in ('enrollment', 'profile_settings') then
    raise exception 'Invalid consent source';
  end if;

  select * into v_prev
  from public.monthly_dues_consents
  where member_id = v_member
  order by recorded_at desc
  limit 1;

  select policy_version into v_policy
  from public.monthly_dues_settings
  where is_active
  order by effective_from desc
  limit 1;

  insert into public.monthly_dues_consents (
    member_id, email_enabled, sms_enabled,
    dues_enrollment_enabled, recurring_payment_authorized,
    policy_version, source
  ) values (
    v_member, p_email, p_sms,
    coalesce(v_prev.dues_enrollment_enabled, false),
    coalesce(v_prev.recurring_payment_authorized, false),
    v_policy, p_source
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.set_monthly_dues_consent(boolean, boolean, text) from public, anon;
grant execute on function public.set_monthly_dues_consent(boolean, boolean, text) to authenticated;
