-- Youth Wing membership numbers are issued by the database, never supplied.
--
-- The original trigger returned early when the insert already carried a
-- membership_number, mirroring the adult one. On the adult side that hatch has a
-- use: imports of historic members who genuinely already hold a printed number.
-- On the youth side it has none. A TBM-YW- number only ever comes from this
-- sequence, so anything supplied on insert was invented by whoever wrote the
-- INSERT -- an importer, a script, an officer with table access -- which is
-- exactly what "no officer can issue a membership number" forbids.
--
-- The number is now always generated, and anything supplied is discarded.
create or replace function public.assign_youth_wing_membership_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Unconditional on purpose: see the migration header. A supplied value is
  -- overwritten rather than rejected, so a bulk import does not fail row by row
  -- on a column the caller should not have been populating in the first place.
  new.membership_number := 'TBM-YW-' ||
    lpad(nextval('public.youth_wing_membership_number_seq')::text, 6, '0');
  return new;
end;
$$;

revoke all on function public.assign_youth_wing_membership_number() from public, anon, authenticated;
