-- Allow newsletters to be saved as 'scheduled'.
--
-- The admin Newsletter page offers "Schedule", newsletter-admin saves the row
-- with status 'scheduled', and newsletter-scheduler looks for 'scheduled' rows.
-- But this constraint only ever allowed 'sent' and 'failed', so every attempt to
-- schedule a newsletter was rejected and the feature has never worked.
alter table public.newsletters drop constraint if exists newsletters_status_check;
alter table public.newsletters
  add constraint newsletters_status_check
  check (status = any (array['sent', 'failed', 'scheduled']));
