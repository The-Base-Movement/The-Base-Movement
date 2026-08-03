-- Google Sheets sync cursor for the Leaders Auth activity log.
--
-- The `sync-activity-to-sheets` edge function (run every minute by pg_cron)
-- appends new admin_device_activity rows to a Google Sheet. This single-row
-- table records how far it has synced so each run only appends NEW events.
--
-- Private bookkeeping: service-role only. No anon/authenticated access.

CREATE TABLE IF NOT EXISTS public.integration_sheets_sync (
  name text PRIMARY KEY,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_sheets_sync ENABLE ROW LEVEL SECURITY;
-- No policies => only the service_role (which bypasses RLS) can read/write.

REVOKE ALL ON TABLE public.integration_sheets_sync FROM anon, authenticated;

-- Seed the cursor at "now" so the first run starts streaming live activity
-- forward rather than back-filling the entire history.
INSERT INTO public.integration_sheets_sync (name, last_synced_at)
VALUES ('admin_device_activity', now())
ON CONFLICT (name) DO NOTHING;
