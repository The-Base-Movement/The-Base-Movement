-- Generate collision-free member numbers in the database.
-- Existing registration numbers and imported numbers remain unchanged.
create sequence public.member_registration_number_seq as bigint start with 1;

revoke all on sequence public.member_registration_number_seq from anon, authenticated;

create or replace function public.assign_member_registration_number()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sequence_value bigint;
  suffix text;
begin
  if nullif(trim(new.registration_number), '') is not null then
    return new;
  end if;

  sequence_value := nextval('public.member_registration_number_seq');
  suffix := sequence_value::text;
  if length(suffix) < 8 then
    suffix := lpad(suffix, 8, '0');
  end if;

  new.registration_number := format(
    'TBM-%s-%s%s',
    case when upper(coalesce(new.platform, 'GHANA')) = 'DIASPORA' then 'DI' else 'GH' end,
    to_char(current_date, 'YY'),
    suffix
  );
  return new;
end;
$$;

revoke all on function public.assign_member_registration_number() from public, anon, authenticated;

create trigger assign_member_registration_number
before insert or update of registration_number on public.users
for each row
execute function public.assign_member_registration_number();