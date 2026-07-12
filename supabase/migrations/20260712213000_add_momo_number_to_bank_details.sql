-- Standalone MTN MoMo merchant details table (separate from bank_transfer_details).
-- Single-row, publicly readable, editable only by privileged finance roles.
create table if not exists public.momo_details (
  id              integer primary key default 1,
  merchant_number text not null default '',
  merchant_name   text not null default 'The Base Movement',
  network         text not null default 'MTN',
  is_active       boolean not null default true,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  constraint momo_details_single_row check (id = 1)
);

alter table public.momo_details enable row level security;

-- Public can read (donate page is public).
create policy momo_details_select on public.momo_details
  for select using (true);

-- Only privileged roles can write (reuse the bank details guard).
create policy momo_details_insert on public.momo_details
  for insert with check (public.can_edit_bank_details());

create policy momo_details_update on public.momo_details
  for update using (public.can_edit_bank_details())
  with check (public.can_edit_bank_details());

grant select on public.momo_details to anon, authenticated;
grant insert, update on public.momo_details to authenticated;

-- Seed with the current merchant number.
insert into public.momo_details (id, merchant_number, merchant_name, network)
values (1, '0597567336', 'The Base Movement', 'MTN')
on conflict (id) do nothing;
