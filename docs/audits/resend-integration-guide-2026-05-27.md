# Resend Integration Guide — 2026-05-27

**Purpose:** Activate transactional email sending for The Base Movement platform  
**Provider:** [Resend](https://resend.com) — recommended for Supabase Edge Functions  
**Status:** Templates implemented, key not yet configured

---

## Prerequisites

- Supabase project access (to set secrets)
- Resend account (free tier: 3,000 emails/month, 100/day)
- DNS access to `thebasemovement.com` (to verify the sending domain)

---

## Step 1 — Create a Resend account

1. Go to [resend.com](https://resend.com) and sign up
2. From the dashboard, go to **API Keys** → **Create API Key**
3. Name it `the-base-production`, select **Full access**
4. Copy the key (shown once only): `re_xxxxxxxxxxxx`

---

## Step 2 — Verify the sending domain

1. In Resend dashboard → **Domains** → **Add Domain** → enter `thebasemovement.com`
2. Resend will show 3–5 DNS records (DKIM, SPF, DMARC)
3. Add those records in your DNS provider (Cloudflare, Namecheap, etc.)
4. Click **Verify** — propagation takes 5–60 minutes
5. Once verified, the `from:` address `noreply@thebasemovement.com` becomes usable

> Until the domain is verified you can use Resend's test domain `onboarding@resend.dev` for the `from:` field (for development/staging only).

---

## Step 3 — Add the key to Supabase secrets

```bash
# Using the Supabase CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

Or via the Supabase dashboard: **Project Settings → Edge Functions → Secrets → New secret**

Name: `RESEND_API_KEY`  
Value: `re_xxxxxxxxxxxx`

---

## Step 4 — Deploy the edge functions

```bash
supabase functions deploy notify-leads
supabase functions deploy broadcast-dispatcher
supabase functions deploy send-donation-receipt
supabase functions deploy send-poll-notification
```

Or use the deploy-pipeline agent (`/deploy`) — it runs all four in the correct order after the type check and build.

---

## Step 5 — Verify activation

After deploying, trigger a test by verifying a donation in the admin panel. Check:

1. Supabase dashboard → **Edge Functions → send-donation-receipt → Logs**
2. You should see `[RECEIPT] Sent to <email>` (not `RESEND_API_KEY not set`)
3. The member's email inbox should receive the receipt within 5 seconds

---

## What each function sends

| Function                 | When it fires                                         | Template               |
| ------------------------ | ----------------------------------------------------- | ---------------------- |
| `notify-leads`           | Database trigger: new row in `users`                  | `welcomeEmail`         |
| `broadcast-dispatcher`   | Admin RPC: broadcast with `priority: 'Urgent'`        | `broadcastEmail`       |
| `send-donation-receipt`  | `adminService.verifyDonation()` → status `'Verified'` | `donationReceiptEmail` |
| `send-poll-notification` | Manual or cron job 24h before poll close              | `pollClosingEmail`     |

---

## Optional: Poll closing cron job

To automate poll-closing notifications, add a Supabase pg_cron job that fires daily and checks for polls closing within 24 hours:

```sql
-- Run once in the Supabase SQL editor to schedule the job
select cron.schedule(
  'poll-closing-notifications',
  '0 9 * * *',   -- every day at 09:00 UTC
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/send-poll-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_ANON_KEY')
      ),
      body := (
        select jsonb_agg(jsonb_build_object('pollId', id))
        from polls
        where end_date between now() and now() + interval '25 hours'
          and status = 'Active'
      )
    );
  $$
);
```

> Requires `pg_net` and `pg_cron` extensions enabled in Supabase.

---

## Rate limits and batching

| Resend plan  | Monthly | Daily     | Per-request `to` array max |
| ------------ | ------- | --------- | -------------------------- |
| Free         | 3,000   | 100       | 50                         |
| Pro ($20/mo) | 50,000  | Unlimited | 50                         |

`broadcast-dispatcher` batches recipients in groups of 50. `send-poll-notification` sends one email per member (required for personalisation). For a region of 10,000 members, the poll notification function will make ~200 requests — upgrade to Resend Pro before running large-scale blasts.

---

## Troubleshooting

| Symptom                                  | Likely cause                                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY not set` in logs         | Secret not added or function not redeployed after secret was added                                                          |
| `422 Unprocessable Entity` from Resend   | `from:` domain not verified — use `onboarding@resend.dev` temporarily                                                       |
| Emails in spam                           | SPF/DKIM records not yet propagated; wait 60 minutes and re-verify in Resend dashboard                                      |
| `[RECEIPT] No email for member_id`       | Member row in `users` table has no `email` value — check registration flow                                                  |
| Receipt not sent after donation approval | Check `send-donation-receipt` logs; `fire-and-forget` means errors are silent by design — add explicit logging if debugging |
