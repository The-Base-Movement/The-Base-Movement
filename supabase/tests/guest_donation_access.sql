begin;

create temporary table guest_donation_test_id (id uuid not null);
grant insert, select on guest_donation_test_id to anon;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
insert into guest_donation_test_id (id)
select public.create_public_donation(
  'Guest Donor',
  '+233200000001',
  25,
  'Ghana',
  'guest@example.com'
);
reset role;

do $$
declare
  donation_id uuid;
  donation_status text;
begin
  select id into donation_id from guest_donation_test_id;
  select public.get_donation_checkout_status(donation_id) into donation_status;

  if donation_status <> 'Pending' then
    raise exception 'expected Pending guest donation, got %', donation_status;
  end if;

  if not exists (
    select 1
    from public.donations
    where id = donation_id
      and member_id is null
      and guest_email = 'guest@example.com'
  ) then
    raise exception 'guest donor details were not recorded';
  end if;
end
$$;

rollback;