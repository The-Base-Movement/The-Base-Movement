-- Server-authorized monthly dues operations: enrollment, opt-out, obligation
-- creation, Hubtel callback transition, and offline finance verification.
-- All member operations bind to auth.uid(); callbacks are service-role only.

-- ---------------------------------------------------------------------------
-- enroll_monthly_dues — consent first, then create/reactivate enrollment
-- ---------------------------------------------------------------------------
create or replace function public.enroll_monthly_dues(
  p_payment_mode text,
  p_email boolean,
  p_sms boolean,
  p_policy_version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid := auth.uid();
  v_settings public.monthly_dues_settings%rowtype;
  v_enrollment public.monthly_dues_enrollments%rowtype;
  v_status text;
begin
  if v_member is null then
    raise exception 'Not authenticated';
  end if;

  if p_payment_mode not in ('manual', 'recurring') then
    raise exception 'Invalid payment mode';
  end if;

  select * into v_settings
  from public.monthly_dues_settings
  where is_active
  order by effective_from desc
  limit 1;

  if not found then
    raise exception 'Monthly dues are not configured yet';
  end if;

  if p_policy_version is distinct from v_settings.policy_version then
    raise exception 'Stale dues policy version';
  end if;

  if p_payment_mode = 'recurring' and not v_settings.recurring_enrollment_enabled then
    raise exception 'Recurring enrollment is not available yet';
  end if;

  -- Recurring activates only after a confirmed provider result.
  v_status := case when p_payment_mode = 'recurring' then 'pending_activation' else 'active' end;

  -- Consent evidence is recorded before any enrollment state change.
  insert into public.monthly_dues_consents (
    member_id, email_enabled, sms_enabled,
    dues_enrollment_enabled, recurring_payment_authorized,
    policy_version, source
  ) values (
    v_member, p_email, p_sms,
    true, p_payment_mode = 'recurring',
    v_settings.policy_version, 'enrollment'
  );

  select * into v_enrollment
  from public.monthly_dues_enrollments
  where member_id = v_member
  for update;

  if found then
    update public.monthly_dues_enrollments
    set status = v_status,
        payment_mode = p_payment_mode,
        enrolled_at = now(),
        opted_out_at = null
    where member_id = v_member
    returning * into v_enrollment;
  else
    insert into public.monthly_dues_enrollments (member_id, status, payment_mode)
    values (v_member, v_status, p_payment_mode)
    returning * into v_enrollment;
  end if;

  return jsonb_build_object('enrollment_id', v_enrollment.id, 'status', v_enrollment.status);
end;
$$;

revoke all on function public.enroll_monthly_dues(text, boolean, boolean, text) from public, anon;
grant execute on function public.enroll_monthly_dues(text, boolean, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- opt_out_monthly_dues — consent withdrawal + state change, history preserved
-- ---------------------------------------------------------------------------
create or replace function public.opt_out_monthly_dues()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid := auth.uid();
  v_enrollment public.monthly_dues_enrollments%rowtype;
  v_prev public.monthly_dues_consents%rowtype;
  v_next_status text;
begin
  if v_member is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_enrollment
  from public.monthly_dues_enrollments
  where member_id = v_member
  for update;

  if not found then
    raise exception 'No dues enrollment to opt out of';
  end if;

  select * into v_prev
  from public.monthly_dues_consents
  where member_id = v_member
  order by recorded_at desc
  limit 1;

  insert into public.monthly_dues_consents (
    member_id, email_enabled, sms_enabled,
    dues_enrollment_enabled, recurring_payment_authorized,
    policy_version, source
  ) values (
    v_member,
    coalesce(v_prev.email_enabled, false),
    coalesce(v_prev.sms_enabled, false),
    false, false,
    v_prev.policy_version, 'opt_out'
  );

  -- Active recurring enrollments wait for provider cancellation confirmation.
  v_next_status := case
    when v_enrollment.payment_mode = 'recurring'
      and v_enrollment.status in ('active', 'pending_activation')
      and v_enrollment.hubtel_invoice_id is not null
      then 'cancellation_pending'
    else 'opted_out'
  end;

  update public.monthly_dues_enrollments
  set status = v_next_status,
      opted_out_at = now()
  where member_id = v_member
  returning * into v_enrollment;

  return jsonb_build_object('enrollment_id', v_enrollment.id, 'status', v_enrollment.status);
end;
$$;

revoke all on function public.opt_out_monthly_dues() from public, anon;
grant execute on function public.opt_out_monthly_dues() to authenticated;

-- ---------------------------------------------------------------------------
-- ensure_monthly_dues_obligation — idempotent obligation creation with a
-- settings + currency snapshot. Callable by the member themselves (null or
-- own id), a finance admin, or the service role (scheduled jobs).
-- Display params are cosmetic snapshots; amount_ghs always comes from the
-- active settings, never from the caller.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_monthly_dues_obligation(
  p_member_id uuid,
  p_month date,
  p_display_currency text default null,
  p_exchange_rate_to_ghs numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_member uuid := coalesce(p_member_id, v_caller);
  v_is_service boolean := coalesce(auth.role() = 'service_role', false) or v_caller is null;
  v_settings public.monthly_dues_settings%rowtype;
  v_enrollment public.monthly_dues_enrollments%rowtype;
  v_payment public.monthly_dues_payments%rowtype;
  v_month date;
  v_due date;
  v_rate numeric;
  v_currency text;
begin
  if v_member is null then
    raise exception 'Member is required';
  end if;

  if not v_is_service
    and v_member is distinct from v_caller
    and not public.can_manage_monthly_dues() then
    raise exception 'Permission denied';
  end if;

  v_month := date_trunc('month', p_month)::date;

  select * into v_settings
  from public.monthly_dues_settings
  where is_active
  order by effective_from desc
  limit 1;

  if not found then
    raise exception 'Monthly dues are not configured yet';
  end if;

  select * into v_enrollment
  from public.monthly_dues_enrollments
  where member_id = v_member;

  if not found or v_enrollment.status in ('opted_out', 'cancellation_pending') then
    raise exception 'Member is not enrolled in monthly dues';
  end if;

  -- Idempotent: return the existing obligation untouched (snapshots are
  -- immutable after creation).
  select * into v_payment
  from public.monthly_dues_payments
  where member_id = v_member and dues_month = v_month;

  if found then
    return jsonb_build_object(
      'payment_id', v_payment.id,
      'status', v_payment.status,
      'created', false
    );
  end if;

  v_due := (v_month + make_interval(days => least(v_settings.due_day,
    extract(day from (v_month + interval '1 month - 1 day'))::int) - 1))::date;

  v_rate := coalesce(nullif(p_exchange_rate_to_ghs, 0), 1);
  if v_rate <= 0 then
    v_rate := 1;
  end if;
  v_currency := coalesce(nullif(upper(trim(p_display_currency)), ''), 'GHS');
  if v_currency = 'GHS' then
    v_rate := 1;
  end if;

  insert into public.monthly_dues_payments (
    member_id, dues_month, due_date, amount_ghs,
    display_amount, display_currency, exchange_rate_to_ghs,
    payment_mode, status
  ) values (
    v_member, v_month, v_due, v_settings.amount_ghs,
    round(v_settings.amount_ghs / v_rate, 2), v_currency, v_rate,
    case when v_enrollment.payment_mode = 'recurring' then 'recurring_hubtel' else 'manual_hubtel' end,
    'due'
  )
  returning * into v_payment;

  return jsonb_build_object(
    'payment_id', v_payment.id,
    'status', v_payment.status,
    'created', true
  );
end;
$$;

revoke all on function public.ensure_monthly_dues_obligation(uuid, date, text, numeric) from public, anon;
grant execute on function public.ensure_monthly_dues_obligation(uuid, date, text, numeric) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- apply_hubtel_monthly_dues_callback — atomic, idempotent payment transition.
-- Only matching pending/due obligations move; duplicates are reported, not
-- reapplied. Service role only (Hubtel callback edge function).
-- ---------------------------------------------------------------------------
create or replace function public.apply_hubtel_monthly_dues_callback(
  p_payment_id uuid,
  p_paid boolean,
  p_transaction_id text,
  p_amount_ghs numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.monthly_dues_payments%rowtype;
begin
  select * into v_payment
  from public.monthly_dues_payments
  where id = p_payment_id
  for update;

  if not found then
    return jsonb_build_object('matched', false, 'already_final', false);
  end if;

  if v_payment.status in ('paid', 'waived', 'cancelled') then
    return jsonb_build_object(
      'matched', true,
      'already_final', true,
      'payment_id', v_payment.id,
      'status', v_payment.status
    );
  end if;

  -- The settled amount must match the immutable obligation snapshot.
  if p_paid and p_amount_ghs is not null
    and round(p_amount_ghs, 2) is distinct from round(v_payment.amount_ghs, 2) then
    return jsonb_build_object(
      'matched', true,
      'already_final', false,
      'amount_mismatch', true,
      'payment_id', v_payment.id,
      'status', v_payment.status
    );
  end if;

  update public.monthly_dues_payments
  set status = case when p_paid then 'paid' else 'failed' end,
      provider_transaction_id = coalesce(p_transaction_id, provider_transaction_id),
      paid_at = case when p_paid then now() else paid_at end,
      receipt_number = case
        when p_paid then coalesce(receipt_number, upper(left(p_payment_id::text, 8)))
        else receipt_number
      end
  where id = p_payment_id
  returning * into v_payment;

  insert into public.audit_logs (action, resource, status, metadata)
  values (
    case when p_paid then 'MONTHLY_DUES_PAYMENT_VERIFIED' else 'MONTHLY_DUES_PAYMENT_FAILED' end,
    'MONTHLY_DUES/' || p_payment_id,
    case when p_paid then 'Success' else 'Failure' end,
    jsonb_build_object('payment_method', 'Hubtel', 'dues_month', v_payment.dues_month)
  );

  return jsonb_build_object(
    'matched', true,
    'already_final', false,
    'payment_id', v_payment.id,
    'status', v_payment.status
  );
end;
$$;

revoke all on function public.apply_hubtel_monthly_dues_callback(uuid, boolean, text, numeric)
  from public, anon, authenticated;
grant execute on function public.apply_hubtel_monthly_dues_callback(uuid, boolean, text, numeric)
  to service_role;

-- ---------------------------------------------------------------------------
-- verify_offline_monthly_dues_payment — finance-only manual verification with
-- required notes. Hubtel-settled obligations can never be marked paid by hand.
-- ---------------------------------------------------------------------------
create or replace function public.verify_offline_monthly_dues_payment(
  p_payment_id uuid,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.monthly_dues_payments%rowtype;
begin
  if not public.can_manage_monthly_dues() then
    raise exception 'Permission denied';
  end if;

  if coalesce(trim(p_notes), '') = '' then
    raise exception 'Verification notes are required';
  end if;

  select * into v_payment
  from public.monthly_dues_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if v_payment.status = 'paid' then
    return jsonb_build_object('payment_id', v_payment.id, 'status', 'paid', 'already_final', true);
  end if;

  if v_payment.provider_transaction_id is not null then
    raise exception 'Provider payments cannot be manually verified';
  end if;

  update public.monthly_dues_payments
  set status = 'paid',
      payment_mode = 'offline',
      paid_at = now(),
      verified_by = auth.uid(),
      verification_notes = trim(p_notes),
      receipt_number = coalesce(receipt_number, upper(left(p_payment_id::text, 8)))
  where id = p_payment_id
  returning * into v_payment;

  insert into public.audit_logs (action, resource, status, metadata)
  values (
    'MONTHLY_DUES_OFFLINE_VERIFIED',
    'MONTHLY_DUES/' || p_payment_id,
    'Success',
    jsonb_build_object('verified_by', auth.uid(), 'dues_month', v_payment.dues_month)
  );

  return jsonb_build_object('payment_id', v_payment.id, 'status', v_payment.status, 'already_final', false);
end;
$$;

revoke all on function public.verify_offline_monthly_dues_payment(uuid, text) from public, anon;
grant execute on function public.verify_offline_monthly_dues_payment(uuid, text) to authenticated;
