-- Guest donations use capability-style UUIDs for checkout status, while donor
-- records and receipts remain behind the existing admin/member boundaries.

alter table public.donations
  add column if not exists guest_email text
    check (guest_email is null or guest_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

grant select (guest_email) on table public.donations to authenticated;

create or replace function public.create_public_donation(
  p_full_name text,
  p_phone text,
  p_amount numeric,
  p_country text,
  p_guest_email text default null,
  p_campaign_id uuid default null,
  p_show_on_dashboard boolean default true,
  p_chapter text default null,
  p_constituency text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_member_id uuid;
  v_email text := nullif(lower(trim(p_guest_email)), '');
begin
  if length(trim(coalesce(p_full_name, ''))) not between 2 and 160 then
    raise exception 'A valid full name is required.';
  end if;
  if length(trim(coalesce(p_phone, ''))) not between 7 and 32 then
    raise exception 'A valid phone number is required.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Donation amount must be greater than zero.';
  end if;
  if length(trim(coalesce(p_country, ''))) not between 2 and 100 then
    raise exception 'A valid country is required.';
  end if;
  if v_email is not null
     and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid email address is required.';
  end if;
  if length(coalesce(p_chapter, '')) > 160 or length(coalesce(p_constituency, '')) > 160 then
    raise exception 'Donation context is too long.';
  end if;

  select u.id
  into v_member_id
  from public.users u
  where u.id = (select auth.uid());

  insert into public.donations (
    member_id,
    campaign_id,
    full_name,
    phone,
    amount,
    country,
    guest_email,
    payment_method,
    status,
    show_on_dashboard,
    chapter,
    constituency
  )
  values (
    v_member_id,
    p_campaign_id,
    trim(p_full_name),
    trim(p_phone),
    p_amount,
    trim(p_country),
    case when v_member_id is null then v_email else null end,
    'Hubtel',
    'Pending',
    coalesce(p_show_on_dashboard, true),
    nullif(trim(p_chapter), ''),
    nullif(trim(p_constituency), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_public_donation(
  text, text, numeric, text, text, uuid, boolean, text, text
) from public;
grant execute on function public.create_public_donation(
  text, text, numeric, text, text, uuid, boolean, text, text
) to anon, authenticated;

create or replace function public.get_donation_checkout_status(p_donation_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.status::text
  from public.donations d
  where d.id = p_donation_id
    and (d.member_id is null or d.member_id = (select auth.uid()));
$$;

revoke all on function public.get_donation_checkout_status(uuid) from public;
grant execute on function public.get_donation_checkout_status(uuid) to anon, authenticated;

-- Browser callers must use create_public_donation so they cannot choose trusted
-- fields such as status, verification metadata, or receipt paths.
drop policy if exists donations_insert on public.donations;
create policy donations_insert on public.donations
  for insert to authenticated
  with check (public.is_admin());

-- Receipt files are delivered only through short-lived signed URLs after the
-- edge function performs the owner/role authorization check.
update storage.buckets
set public = false
where id in ('receipts', 'donation-receipts');

drop policy if exists receipts_public_read on storage.objects;
drop policy if exists receipts_admin_list on storage.objects;

alter table public.donations
  drop constraint if exists donations_receipt_status_check;
alter table public.donations
  add constraint donations_receipt_status_check
  check (receipt_status in ('pending', 'sending', 'sent', 'stored', 'failed'));

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
    or v_donation.receipt_status in ('sending', 'sent', 'stored')
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
