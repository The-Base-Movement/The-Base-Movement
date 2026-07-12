begin;

do $$
begin
  if to_regprocedure('public.enforce_user_network_assignment()') is null then
    raise exception 'assignment trigger function is missing';
  end if;
  if to_regclass('public.admin_member_assignment_issues') is null then
    raise exception 'assignment reconciliation view is missing';
  end if;
end
$$;

insert into public.users (id, full_name, phone_number, platform, country, constituency, chapter)
values (
  '00000000-0000-0000-0000-000000000021',
  'Assignment Test',
  '+233200000021',
  'GHANA',
  'Ghana',
  null,
  null
);

do $$
begin
  begin
    update public.users
    set constituency = 'Not A Constituency'
    where id = '00000000-0000-0000-0000-000000000021';
    raise exception 'invalid constituency was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.users
    set chapter = 'Ghana Chapter'
    where id = '00000000-0000-0000-0000-000000000021';
    raise exception 'Ghana chapter assignment was accepted';
  exception when check_violation then
    null;
  end;
end
$$;

rollback;
