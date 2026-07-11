create or replace function public.apply_hubtel_donation_callback(
  p_donation_id uuid,
  p_paid boolean,
  p_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation public.donations%rowtype;
begin
  select *
  into v_donation
  from public.donations
  where id = p_donation_id
  for update;

  if not found then
    return jsonb_build_object('matched', false, 'already_final', false);
  end if;

  if v_donation.status = 'Verified' then
    return jsonb_build_object(
      'matched', true,
      'already_final', true,
      'donation_id', v_donation.id
    );
  end if;

  update public.donations
  set status = case when p_paid then 'Verified' else 'Rejected' end,
      payment_method = 'Hubtel',
      hubtel_reference = p_transaction_id,
      cleared = p_paid,
      reference = case when p_paid then upper(left(p_donation_id::text, 8)) else reference end
  where id = p_donation_id;

  insert into public.audit_logs (action, resource, status, metadata)
  values (
    case when p_paid then 'DONATION_PAYMENT_VERIFIED' else 'DONATION_PAYMENT_REJECTED' end,
    'DONATIONS/' || p_donation_id,
    case when p_paid then 'Success' else 'Failure' end,
    jsonb_build_object('payment_method', 'Hubtel')
  );

  return jsonb_build_object(
    'matched', true,
    'already_final', false,
    'donation_id', p_donation_id
  );
end;
$$;

revoke all on function public.apply_hubtel_donation_callback(uuid, boolean, text) from public;
revoke all on function public.apply_hubtel_donation_callback(uuid, boolean, text) from anon;
revoke all on function public.apply_hubtel_donation_callback(uuid, boolean, text) from authenticated;
grant execute on function public.apply_hubtel_donation_callback(uuid, boolean, text) to service_role;
