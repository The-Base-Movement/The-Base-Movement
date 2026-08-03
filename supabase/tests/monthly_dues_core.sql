begin;

create extension if not exists pgtap;

select plan(8);

select has_table('public'::name, 'monthly_dues_settings'::name);
select has_table('public'::name, 'monthly_dues_enrollments'::name);
select has_table('public'::name, 'monthly_dues_consents'::name);
select has_table('public'::name, 'monthly_dues_payments'::name);
select has_table('public'::name, 'monthly_dues_reminders'::name);
select col_is_unique('public'::name, 'monthly_dues_enrollments'::name, 'member_id'::name);
select col_is_unique('public', 'monthly_dues_payments', array['member_id', 'dues_month']);
select col_is_unique('public', 'monthly_dues_reminders', array['payment_id', 'channel', 'reminder_stage']);

select * from finish();

rollback;
