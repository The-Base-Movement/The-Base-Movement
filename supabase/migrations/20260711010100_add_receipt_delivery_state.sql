alter table public.donations
  add column if not exists receipt_status text not null default 'pending'
    check (receipt_status in ('pending', 'sending', 'sent', 'failed')),
  add column if not exists receipt_attempts integer not null default 0,
  add column if not exists receipt_last_error text,
  add column if not exists receipt_sent_at timestamptz;

create or replace function public.claim_donation_receipt(p_donation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation public.donations%rowtype;
begin
  select * into v_donation
  from public.donations
  where id = p_donation_id
  for update;

  if not found
    or v_donation.status <> 'Verified'
    or v_donation.receipt_status in ('sending', 'sent')
    or v_donation.receipt_attempts >= 3 then
    return false;
  end if;

  update public.donations
  set receipt_status = 'sending',
      receipt_attempts = receipt_attempts + 1,
      receipt_last_error = null
  where id = p_donation_id;

  return true;
end;
$$;

revoke all on function public.claim_donation_receipt(uuid) from public;
revoke all on function public.claim_donation_receipt(uuid) from anon;
revoke all on function public.claim_donation_receipt(uuid) from authenticated;
grant execute on function public.claim_donation_receipt(uuid) to service_role;
