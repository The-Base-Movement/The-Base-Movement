# Leaders Auth activity → Google Sheets (live sync)

Mirrors the Leaders Auth **activity log** (`admin_device_activity`) into a Google
Sheet, refreshed every minute by `pg_cron` calling the
`sync-activity-to-sheets` edge function. The function appends only **new** rows
(tracked by the `integration_sheets_sync` cursor), so the sheet is an
append-only, near-live mirror.

> ⚠️ **Sensitive data.** This log contains leader names, IP addresses,
> geolocations and user agents. Once in Google Sheets it lives outside Supabase
> RLS — share the sheet with the smallest possible IT group only.

---

## 1. Create a Google service account (one-time)

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. **APIs & Services → Library →** enable the **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account.**
   - Name it e.g. `base-activity-sync`. No roles/permissions needed.
4. Open the new service account → **Keys → Add key → Create new key → JSON.**
   A `.json` file downloads — this is the secret. Keep it safe, never commit it.
5. Note the service account **email** (looks like
   `base-activity-sync@your-project.iam.gserviceaccount.com`).

## 2. Create the Google Sheet

1. Create a new Google Sheet. Rename the first tab to **`Activity`**.
2. Click **Share** and add the service account **email** from step 1.5 as an
   **Editor**. (No need to share with people beyond your IT group.)
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<THIS_IS_THE_ID>`**`/edit`
4. Leave row 1 empty — the function writes the header row automatically on the
   first run.

## 3. Set the edge-function secrets

From the repo root (or Dashboard → Edge Functions → Secrets):

```bash
# Paste the entire JSON file contents as one secret
supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat path/to/base-activity-sync-key.json)"
supabase secrets set SHEET_ID="<the Sheet ID from step 2.3>"
# Optional — defaults to "Activity"
supabase secrets set SHEET_TAB="Activity"
```

## 4. Deploy the function

```bash
supabase functions deploy sync-activity-to-sheets
```

(Already deployed for you if the Supabase MCP was used — just (re)deploy after
setting secrets so it picks them up.)

### Smoke test

```bash
curl -i -X POST \
  https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/sync-activity-to-sheets \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
```

Expect `{"appended":N,...}`. If `appended` is 0, trigger a Leaders Auth event
(log in from a tracked admin) and run it again.

## 5. Schedule it every minute (pg_cron)

Easiest: **Dashboard → Integrations → Cron → Create job**, type **Edge
Function**, target `sync-activity-to-sheets`, schedule `* * * * *` (every
minute).

Or via SQL (store the key in Vault rather than inline):

```sql
-- one-time: stash the service role key in Vault
select vault.create_secret('<SUPABASE_SERVICE_ROLE_KEY>', 'service_role_key');

select cron.schedule(
  'sync-activity-to-sheets',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/sync-activity-to-sheets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    )
  );
  $$
);
```

To pause/remove: `select cron.unschedule('sync-activity-to-sheets');`

---

## How it works

- `integration_sheets_sync` holds one cursor row (`last_synced_at`), seeded at
  migration time to "now" so it streams forward, not back-filling history.
- Each run: read cursor → fetch `admin_device_activity` rows newer than it
  (ascending, capped at 500) → resolve leader names → append to the sheet →
  advance the cursor to the newest row appended.
- Columns: Timestamp · Leader · Device · Event · IP address · Location ·
  Fingerprint · User agent.

### Want history too?

The cursor starts at "now". To back-fill existing activity once, reset it:

```sql
update public.integration_sheets_sync
set last_synced_at = '1970-01-01'
where name = 'admin_device_activity';
```

The next run appends everything (in 500-row batches per minute).
