-- Single-row table holding the movement's bank-transfer details, shown on the
-- public /donate page and editable by privileged roles in the admin area.
create table if not exists public.bank_transfer_details (
  id            integer primary key default 1,
  bank_name     text,
  account_name  text,
  account_number text,
  swift_code    text,
  branch        text,
  address       text,
  updated_at    timestamptz not null default now(),
  updated_by    uuid,
  constraint bank_transfer_details_single_row check (id = 1)
);

-- Who may edit the bank details: the roles the product owner specified.
create or replace function public.can_edit_bank_details()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid()
      and role = any (array[
        'SUPER_ADMIN','FOUNDER','IT_MANAGER','MOVEMENT_LEADER','FINANCE_OFFICER'
      ])
  )
$$;

revoke execute on function public.can_edit_bank_details() from public;
grant execute on function public.can_edit_bank_details() to authenticated;

alter table public.bank_transfer_details enable row level security;

-- Public can read (the /donate page is anonymous).
drop policy if exists bank_details_select on public.bank_transfer_details;
create policy bank_details_select on public.bank_transfer_details
  for select using (true);

-- Only the allowed roles can write.
drop policy if exists bank_details_insert on public.bank_transfer_details;
create policy bank_details_insert on public.bank_transfer_details
  for insert with check (public.can_edit_bank_details());

drop policy if exists bank_details_update on public.bank_transfer_details;
create policy bank_details_update on public.bank_transfer_details
  for update using (public.can_edit_bank_details())
  with check (public.can_edit_bank_details());

grant select on public.bank_transfer_details to anon, authenticated;
grant insert, update on public.bank_transfer_details to authenticated;

-- Seed the single row with the details currently in use.
insert into public.bank_transfer_details
  (id, bank_name, account_name, account_number, swift_code, branch, address)
values
  (1, 'CBG', 'THE BASE MOVEMENT LBG', '2497625640001', 'CBGHGHAC', 'Kwabenya',
   'GE-286-9051, Brekusu Road, Kwabenya, Greater Accra, Ghana')
on conflict (id) do nothing;
