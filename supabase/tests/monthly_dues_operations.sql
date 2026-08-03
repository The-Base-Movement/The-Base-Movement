-- Monthly dues operations tests: member-bound identity, append-only consent,
-- idempotent obligation creation, settings snapshots, opt-out history
-- preservation, and rejection of cross-member writes.
begin;

-- Seed two members and an active dues policy.
insert into public.users (id) values
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

insert into public.monthly_dues_settings
  (amount_ghs, due_day, grace_period_days, recurring_enrollment_enabled, policy_version)
values (50, 28, 7, false, 'v1');

-- Act as member A.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

do $$
declare
  v_result jsonb;
  v_again jsonb;
  v_consents integer;
  v_payment public.monthly_dues_payments%rowtype;
begin
  -- Enrollment records consent first and binds to the caller.
  v_result := public.enroll_monthly_dues('manual', true, false, 'v1');
  if v_result ->> 'status' <> 'active' then
    raise exception 'expected active enrollment, got %', v_result;
  end if;

  select count(*) into v_consents
  from public.monthly_dues_consents
  where member_id = '00000000-0000-0000-0000-00000000000a'
    and source = 'enrollment' and dues_enrollment_enabled;
  if v_consents <> 1 then
    raise exception 'expected one enrollment consent row, found %', v_consents;
  end if;

  -- Stale policy versions are rejected.
  begin
    perform public.enroll_monthly_dues('manual', true, false, 'v0');
    raise exception 'stale policy version was accepted';
  exception when others then
    if sqlerrm not like '%policy version%' then raise; end if;
  end;

  -- Recurring stays unavailable while disabled in settings.
  begin
    perform public.enroll_monthly_dues('recurring', true, false, 'v1');
    raise exception 'recurring enrollment was accepted while disabled';
  exception when others then
    if sqlerrm not like '%not available%' then raise; end if;
  end;

  -- Obligation creation is idempotent and snapshots the settings.
  v_result := public.ensure_monthly_dues_obligation(null, '2026-02-15');
  v_again := public.ensure_monthly_dues_obligation(null, '2026-02-01');
  if v_result ->> 'payment_id' <> v_again ->> 'payment_id' then
    raise exception 'duplicate obligation was created for the same month';
  end if;
  if not (v_result ->> 'created')::boolean or (v_again ->> 'created')::boolean then
    raise exception 'idempotency flags wrong: % / %', v_result, v_again;
  end if;

  select * into v_payment
  from public.monthly_dues_payments
  where id = (v_result ->> 'payment_id')::uuid;
  if v_payment.dues_month <> date '2026-02-01'
    or v_payment.due_date <> date '2026-02-28'
    or v_payment.amount_ghs <> 50 then
    raise exception 'obligation snapshot wrong: month %, due %, amount %',
      v_payment.dues_month, v_payment.due_date, v_payment.amount_ghs;
  end if;

  -- Cross-member obligation writes are rejected for non-finance members.
  begin
    perform public.ensure_monthly_dues_obligation(
      '00000000-0000-0000-0000-00000000000b', '2026-02-01');
    raise exception 'cross-member obligation write was accepted';
  exception when others then
    if sqlerrm not like '%Permission denied%' then raise; end if;
  end;

  -- Consent rows are append-only for members.
  begin
    update public.monthly_dues_consents
    set email_enabled = false
    where member_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'consent update was allowed';
  exception when insufficient_privilege then
    null;
  end;
  begin
    delete from public.monthly_dues_consents
    where member_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'consent delete was allowed';
  exception when insufficient_privilege then
    null;
  end;

  -- Opt-out preserves payment and consent history.
  v_result := public.opt_out_monthly_dues();
  if v_result ->> 'status' <> 'opted_out' then
    raise exception 'expected opted_out, got %', v_result;
  end if;

  select count(*) into v_consents
  from public.monthly_dues_consents
  where member_id = '00000000-0000-0000-0000-00000000000a';
  if v_consents < 2 then
    raise exception 'consent history was not preserved (rows: %)', v_consents;
  end if;

  if not exists (
    select 1 from public.monthly_dues_payments
    where member_id = '00000000-0000-0000-0000-00000000000a'
  ) then
    raise exception 'payment history was deleted on opt-out';
  end if;

  -- Opted-out members cannot receive new obligations.
  begin
    perform public.ensure_monthly_dues_obligation(null, '2026-03-01');
    raise exception 'obligation was created for an opted-out member';
  exception when others then
    if sqlerrm not like '%not enrolled%' then raise; end if;
  end;
end
$$;

-- Member B cannot read member A's rows.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.monthly_dues_payments;
  if v_count <> 0 then
    raise exception 'member B can read member A payments (%)', v_count;
  end if;
  select count(*) into v_count from public.monthly_dues_consents;
  if v_count <> 0 then
    raise exception 'member B can read member A consents (%)', v_count;
  end if;
  select count(*) into v_count from public.monthly_dues_enrollments;
  if v_count <> 0 then
    raise exception 'member B can read member A enrollment (%)', v_count;
  end if;
end
$$;

reset role;

-- Callback transitions are atomic, amount-validated, and idempotent
-- (run as postgres, standing in for the service role).
do $$
declare
  v_payment_id uuid;
  v_result jsonb;
begin
  select id into v_payment_id
  from public.monthly_dues_payments
  where member_id = '00000000-0000-0000-0000-00000000000a'
  limit 1;

  -- Mismatched settlement amounts never mark the obligation paid.
  v_result := public.apply_hubtel_monthly_dues_callback(v_payment_id, true, 'txn-1', 49.99);
  if not (v_result ->> 'amount_mismatch')::boolean then
    raise exception 'amount mismatch was not rejected: %', v_result;
  end if;

  v_result := public.apply_hubtel_monthly_dues_callback(v_payment_id, true, 'txn-1', 50);
  if v_result ->> 'status' <> 'paid' or (v_result ->> 'already_final')::boolean then
    raise exception 'valid callback did not mark payment paid: %', v_result;
  end if;

  -- Duplicate callbacks are harmless.
  v_result := public.apply_hubtel_monthly_dues_callback(v_payment_id, true, 'txn-1', 50);
  if not (v_result ->> 'already_final')::boolean then
    raise exception 'duplicate callback was reapplied: %', v_result;
  end if;
end
$$;

rollback;
