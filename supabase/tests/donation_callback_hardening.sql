begin;

insert into public.donations (id, full_name, phone, amount, status)
values ('00000000-0000-0000-0000-000000000011', 'Callback Test', '0200000000', 10, 'Pending');

do $$
declare
  first_result jsonb;
  second_result jsonb;
  audit_count integer;
begin
  first_result := public.apply_hubtel_donation_callback(
    '00000000-0000-0000-0000-000000000011', true, 'hubtel-test-1'
  );
  second_result := public.apply_hubtel_donation_callback(
    '00000000-0000-0000-0000-000000000011', true, 'hubtel-test-1'
  );

  if (first_result ->> 'already_final')::boolean then
    raise exception 'first callback was incorrectly treated as final';
  end if;

  if not (second_result ->> 'already_final')::boolean then
    raise exception 'duplicate callback was not detected';
  end if;

  select count(*) into audit_count
  from public.audit_logs
  where resource = 'DONATIONS/00000000-0000-0000-0000-000000000011'
    and action = 'DONATION_PAYMENT_VERIFIED';

  if audit_count <> 1 then
    raise exception 'expected one payment audit row, found %', audit_count;
  end if;
end
$$;

rollback;
