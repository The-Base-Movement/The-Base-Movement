-- Royalty Points automation: member_points becomes the canonical signed
-- ledger, rates live in a finance-managed settings singleton, and awards fire
-- from database triggers at each confirmed paid-state transition (donations →
-- 'Verified', store orders → payment_status 'Paid', monthly dues → 'paid').
-- Triggers catch every path — Hubtel callbacks, status polling, and offline /
-- admin verification — with no edge-function changes.
-- Design: docs/superpowers/specs/2026-07-12-royalty-points-automation-design.md

-- ---------------------------------------------------------------------------
-- Settings singleton (default rates approved 2026-07-12)
-- ---------------------------------------------------------------------------
create table if not exists public.royalty_points_settings (
  id uuid primary key default gen_random_uuid(),
  referral_registration_points integer not null default 50 check (referral_registration_points >= 0),
  referral_verification_points integer not null default 25 check (referral_verification_points >= 0),
  store_points_per_ghs numeric(8, 4) not null default 1 check (store_points_per_ghs >= 0),
  monthly_dues_points_per_ghs numeric(8, 4) not null default 1 check (monthly_dues_points_per_ghs >= 0),
  donation_points_per_ghs numeric(8, 4) not null default 1 check (donation_points_per_ghs >= 0),
  updated_by uuid references public.admins (id),
  updated_at timestamptz not null default now()
);

create unique index if not exists royalty_points_settings_singleton
  on public.royalty_points_settings ((true));

insert into public.royalty_points_settings default values
on conflict do nothing;

alter table public.royalty_points_settings enable row level security;
revoke all on table public.royalty_points_settings from anon, authenticated;
-- Reads/writes go through the finance-gated RPCs below only.

-- ---------------------------------------------------------------------------
-- member_points → canonical ledger (table is empty in production, so the
-- tightened constraints are safe). Balances are sums over rows, which is how
-- gamificationService already reads it.
-- ---------------------------------------------------------------------------
alter table public.member_points
  add column if not exists source_type text,
  add column if not exists source_reference uuid,
  add column if not exists reason text,
  add column if not exists awarded_by uuid references public.admins (id),
  add column if not exists created_at timestamptz not null default now();

alter table public.member_points
  alter column points set not null,
  alter column user_id set not null;

alter table public.member_points
  add constraint member_points_source_type_check check (
    source_type is null or source_type in (
      'referral_registration', 'referral_verification', 'store_purchase',
      'monthly_dues', 'donation', 'rally_attendance', 'manual_adjustment'
    )
  );

-- One award per source transaction: rerunning any callback or backfill can
-- never double-award.
create unique index if not exists member_points_source_unique
  on public.member_points (source_type, source_reference)
  where source_type is not null and source_reference is not null;

-- Ledger integrity: browsers only read; every write goes through a
-- security-definer function or the service role.
revoke insert, update, delete, truncate on table public.member_points from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Finance permission — same finance authority used for dues/donations.
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_royalty_points()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_monthly_dues();
$$;

revoke execute on function public.can_manage_royalty_points() from public, anon;
grant execute on function public.can_manage_royalty_points() to authenticated;

-- ---------------------------------------------------------------------------
-- award_royalty_points — the single idempotent award writer. Fixed points for
-- referral sources, floor(amount × rate) for financial sources. Missing
-- members, non-positive amounts, and duplicate references award nothing.
-- Not callable from browsers: only triggers, security-definer functions, and
-- the service role reach it.
-- ---------------------------------------------------------------------------
create or replace function public.award_royalty_points(
  p_member_id uuid,
  p_source_type text,
  p_source_reference uuid,
  p_amount_ghs numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.royalty_points_settings%rowtype;
  v_points integer;
  v_id uuid;
begin
  if p_member_id is null or p_source_reference is null then
    return jsonb_build_object('awarded', false, 'reason', 'missing_member_or_reference');
  end if;

  select * into v_settings from public.royalty_points_settings limit 1;
  if not found then
    return jsonb_build_object('awarded', false, 'reason', 'no_settings');
  end if;

  v_points := case p_source_type
    when 'referral_registration' then v_settings.referral_registration_points
    when 'referral_verification' then v_settings.referral_verification_points
    when 'store_purchase' then floor(coalesce(p_amount_ghs, 0) * v_settings.store_points_per_ghs)::integer
    when 'monthly_dues' then floor(coalesce(p_amount_ghs, 0) * v_settings.monthly_dues_points_per_ghs)::integer
    when 'donation' then floor(coalesce(p_amount_ghs, 0) * v_settings.donation_points_per_ghs)::integer
    else null
  end;

  if v_points is null then
    raise exception 'Unknown royalty points source: %', p_source_type;
  end if;

  if v_points <= 0 then
    return jsonb_build_object('awarded', false, 'reason', 'zero_points');
  end if;

  insert into public.member_points (user_id, points, source_type, source_reference)
  values (p_member_id, v_points, p_source_type, p_source_reference)
  on conflict (source_type, source_reference)
    where source_type is not null and source_reference is not null
    do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.member_points
    where source_type = p_source_type and source_reference = p_source_reference;
    return jsonb_build_object('awarded', false, 'reason', 'duplicate', 'ledger_id', v_id);
  end if;

  return jsonb_build_object('awarded', true, 'ledger_id', v_id, 'points', v_points);
end;
$$;

revoke all on function public.award_royalty_points(uuid, text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.award_royalty_points(uuid, text, uuid, numeric) to service_role;

-- ---------------------------------------------------------------------------
-- Paid-state transition triggers. Award failures are logged and never break
-- the payment transaction itself.
-- ---------------------------------------------------------------------------
create or replace function public.royalty_points_log_failure(p_source text, p_ref uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (action, resource, status, metadata)
  values (
    'ROYALTY_POINTS_AWARD_FAILED',
    'ROYALTY_POINTS/' || p_ref,
    'Failure',
    jsonb_build_object('source', p_source, 'error', p_error)
  );
$$;

create or replace function public.royalty_points_on_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Verified'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
    and new.member_id is not null then
    begin
      perform public.award_royalty_points(new.member_id, 'donation', new.id, new.amount);
    exception when others then
      perform public.royalty_points_log_failure('donation', new.id, sqlerrm);
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists royalty_points_on_donation on public.donations;
create trigger royalty_points_on_donation
  after insert or update on public.donations
  for each row execute function public.royalty_points_on_donation();

create or replace function public.royalty_points_on_store_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'Paid'
    and (tg_op = 'INSERT' or old.payment_status is distinct from new.payment_status)
    and new.customer_id is not null then
    begin
      -- Merchandise subtotal only; shipping never earns points.
      perform public.award_royalty_points(new.customer_id, 'store_purchase', new.id, new.subtotal);
    exception when others then
      perform public.royalty_points_log_failure('store_purchase', new.id, sqlerrm);
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists royalty_points_on_store_order on public.store_orders;
create trigger royalty_points_on_store_order
  after insert or update on public.store_orders
  for each row execute function public.royalty_points_on_store_order();

create or replace function public.royalty_points_on_monthly_dues()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid'
    and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    begin
      perform public.award_royalty_points(new.member_id, 'monthly_dues', new.id, new.amount_ghs);
    exception when others then
      perform public.royalty_points_log_failure('monthly_dues', new.id, sqlerrm);
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists royalty_points_on_monthly_dues on public.monthly_dues_payments;
create trigger royalty_points_on_monthly_dues
  after insert or update on public.monthly_dues_payments
  for each row execute function public.royalty_points_on_monthly_dues();

-- ---------------------------------------------------------------------------
-- Referral awards now read their rates from settings and mirror into the
-- canonical ledger. referral_awards stays as the referral audit/idempotency
-- source; its unique_violation still short-circuits duplicates.
-- ---------------------------------------------------------------------------
create or replace function public.award_referral_points(p_new_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_reg text;
  v_referrer_id uuid;
  v_points integer;
begin
  select referred_by into v_referrer_reg from users where id = p_new_member_id;
  if v_referrer_reg is null then return; end if;

  select id into v_referrer_id from users where registration_number = v_referrer_reg;
  if v_referrer_id is null then return; end if;

  select referral_registration_points into v_points from royalty_points_settings limit 1;
  v_points := coalesce(v_points, 50);

  begin
    insert into referral_awards (referrer_id, referred_member_id, award_type, points)
    values (v_referrer_id, p_new_member_id, 'registration', v_points);

    update users set points = coalesce(points, 0) + v_points where id = v_referrer_id;

    perform public.award_royalty_points(v_referrer_id, 'referral_registration', p_new_member_id, null);
  exception when unique_violation then
    null;
  end;
end;
$$;

create or replace function public.award_referral_verification_bonus(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_reg text;
  v_referrer_id uuid;
  v_points integer;
begin
  select referred_by into v_referrer_reg from users where id = p_member_id;
  if v_referrer_reg is null then return; end if;

  select id into v_referrer_id from users where registration_number = v_referrer_reg;
  if v_referrer_id is null then return; end if;

  select referral_verification_points into v_points from royalty_points_settings limit 1;
  v_points := coalesce(v_points, 25);

  begin
    insert into referral_awards (referrer_id, referred_member_id, award_type, points)
    values (v_referrer_id, p_member_id, 'verification', v_points);

    update users set points = coalesce(points, 0) + v_points where id = v_referrer_id;

    perform public.award_royalty_points(v_referrer_id, 'referral_verification', p_member_id, null);
  exception when unique_violation then
    null;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rally attendance fix: the old ON CONFLICT (user_id) upsert referenced a
-- unique index that does not exist, so the trigger errored whenever it fired.
-- Each verified attendance is now its own ledger row, idempotent per
-- attendance record.
-- ---------------------------------------------------------------------------
create or replace function public.handle_rally_attendance_points()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_verified = true and (old.is_verified = false or old.is_verified is null) then
    insert into public.member_points (user_id, points, source_type, source_reference)
    values (new.user_id, 50, 'rally_attendance', new.id)
    on conflict (source_type, source_reference)
      where source_type is not null and source_reference is not null
      do nothing;

    insert into public.audit_logs (action, resource, status, metadata)
    values (
      'RALLY_ATTENDANCE_VERIFIED',
      'field_actions',
      'Success',
      jsonb_build_object('user_id', new.user_id, 'action_id', new.action_id, 'points', 50)
    );

    new.points_awarded := 50;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Finance management RPCs
-- ---------------------------------------------------------------------------
create or replace function public.get_royalty_points_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_royalty_points() then
    raise exception 'Permission denied';
  end if;

  return jsonb_build_object(
    'settings', (
      select to_jsonb(s) - 'id' from public.royalty_points_settings s limit 1
    ),
    'summary', jsonb_build_object(
      'total_points', coalesce((select sum(points) from public.member_points), 0),
      'members_with_points', coalesce((
        select count(*) from (
          select user_id from public.member_points group by user_id having sum(points) > 0
        ) m
      ), 0),
      'points_this_month', coalesce((
        select sum(points) from public.member_points
        where created_at >= date_trunc('month', now())
      ), 0),
      'manual_adjustments', coalesce((
        select count(*) from public.member_points where source_type = 'manual_adjustment'
      ), 0)
    ),
    'balances', coalesce((
      select jsonb_agg(b) from (
        select mp.user_id, u.full_name, u.registration_number,
               sum(mp.points)::int as balance, max(mp.created_at) as last_activity
        from public.member_points mp
        join public.users u on u.id = mp.user_id
        group by mp.user_id, u.full_name, u.registration_number
        order by balance desc
        limit 500
      ) b
    ), '[]'::jsonb),
    'ledger', coalesce((
      select jsonb_agg(l) from (
        select mp.id, mp.user_id, u.full_name, u.registration_number,
               mp.points, mp.source_type, mp.source_reference, mp.reason,
               mp.awarded_by, mp.created_at
        from public.member_points mp
        left join public.users u on u.id = mp.user_id
        order by mp.created_at desc
        limit 500
      ) l
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_royalty_points_admin() from public, anon;
grant execute on function public.get_royalty_points_admin() to authenticated;

create or replace function public.update_royalty_points_settings(
  p_referral_registration integer,
  p_referral_verification integer,
  p_store_per_ghs numeric,
  p_dues_per_ghs numeric,
  p_donation_per_ghs numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if not public.can_manage_royalty_points() then
    raise exception 'Permission denied';
  end if;

  if least(p_referral_registration, p_referral_verification) < 0
    or least(p_store_per_ghs, p_dues_per_ghs, p_donation_per_ghs) < 0 then
    raise exception 'Rates cannot be negative';
  end if;

  select to_jsonb(s) - 'id' into v_before from public.royalty_points_settings s limit 1;

  update public.royalty_points_settings
  set referral_registration_points = p_referral_registration,
      referral_verification_points = p_referral_verification,
      store_points_per_ghs = p_store_per_ghs,
      monthly_dues_points_per_ghs = p_dues_per_ghs,
      donation_points_per_ghs = p_donation_per_ghs,
      updated_by = auth.uid(),
      updated_at = now();

  select to_jsonb(s) - 'id' into v_after from public.royalty_points_settings s limit 1;

  insert into public.audit_logs (action, resource, status, metadata)
  values (
    'ROYALTY_POINTS_SETTINGS_UPDATED',
    'ROYALTY_POINTS/settings',
    'Success',
    jsonb_build_object('updated_by', auth.uid(), 'before', v_before, 'after', v_after)
  );

  return v_after;
end;
$$;

revoke all on function public.update_royalty_points_settings(integer, integer, numeric, numeric, numeric) from public, anon;
grant execute on function public.update_royalty_points_settings(integer, integer, numeric, numeric, numeric) to authenticated;

create or replace function public.adjust_member_royalty_points(
  p_member_id uuid,
  p_points integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_id uuid;
begin
  if not public.can_manage_royalty_points() then
    raise exception 'Permission denied';
  end if;

  if p_points is null or p_points = 0 then
    raise exception 'The adjustment must be a non-zero whole number';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  if not exists (select 1 from public.users where id = p_member_id) then
    raise exception 'Member not found';
  end if;

  select coalesce(sum(points), 0) into v_balance
  from public.member_points
  where user_id = p_member_id;

  if v_balance + p_points < 0 then
    raise exception 'The deduction would drop the member below zero points (balance %)', v_balance;
  end if;

  insert into public.member_points (user_id, points, source_type, reason, awarded_by)
  values (p_member_id, p_points, 'manual_adjustment', trim(p_reason), auth.uid())
  returning id into v_id;

  insert into public.audit_logs (action, resource, status, metadata)
  values (
    'ROYALTY_POINTS_MANUAL_ADJUSTMENT',
    'ROYALTY_POINTS/' || v_id,
    'Success',
    jsonb_build_object(
      'adjusted_by', auth.uid(), 'member_id', p_member_id,
      'points', p_points, 'reason', trim(p_reason)
    )
  );

  return jsonb_build_object('ledger_id', v_id, 'points', p_points, 'new_balance', v_balance + p_points);
end;
$$;

revoke all on function public.adjust_member_royalty_points(uuid, integer, text) from public, anon;
grant execute on function public.adjust_member_royalty_points(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: accumulated points for historical verified donations linked via
-- donations.member_id only. The source uniqueness key makes reruns no-ops.
-- Identity is never guessed from names, emails, or phone numbers.
-- ---------------------------------------------------------------------------
insert into public.member_points (user_id, points, source_type, source_reference, reason)
select d.member_id,
       floor(d.amount * s.donation_points_per_ghs)::integer,
       'donation', d.id, 'Historical donation backfill'
from public.donations d
cross join (select donation_points_per_ghs from public.royalty_points_settings limit 1) s
where d.status = 'Verified'
  and d.member_id is not null
  and floor(d.amount * s.donation_points_per_ghs) >= 1
on conflict (source_type, source_reference)
  where source_type is not null and source_reference is not null
  do nothing;
