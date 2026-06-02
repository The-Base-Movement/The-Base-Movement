# Transactional Emails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up all five branded email templates so member lifecycle events (approval, donation, broadcast, poll closing, CSV import) send real emails via SendGrid.

**Architecture:** Extend the existing per-function pattern in `supabase/functions/`. Fix two cross-cutting bugs in `_shared/email-templates.ts` (Outlook header layout, wrong sender address) — the header fix propagates automatically to all existing functions since they import from the shared file. Create one new edge function (`send-welcome-email`), one new scheduler function (`poll-closing-scheduler`), add a `closing_notified` column to `polls`, and add one daily cron in the Supabase dashboard.

**Tech Stack:** Supabase Edge Functions (Deno + TypeScript), SendGrid v3 `/v3/mail/send`, Supabase pg_cron, React + TypeScript (frontend)

---

### Task 1: DB migration — add `closing_notified` to `polls`

**Files:**

- DB change only (via Supabase MCP or SQL editor)

- [ ] **Step 1: Apply the migration**

Run in Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS closing_notified boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Verify the column exists**

Run in SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'polls'
  AND column_name = 'closing_notified';
```

Expected: one row — `closing_notified | boolean | false`

- [ ] **Step 3: Commit a migration file**

Create `supabase/migrations/<timestamp>_add_polls_closing_notified.sql` with:

```sql
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS closing_notified boolean NOT NULL DEFAULT false;
```

```bash
git add supabase/migrations/
git commit -m "feat(db): add closing_notified column to polls"
```

---

### Task 2: Fix `_shared/email-templates.ts` — Outlook header layout

**Files:**

- Modify: `supabase/functions/_shared/email-templates.ts:18-27`

The current `emailHeader()` uses `display:flex` which Outlook Win32 ignores entirely. Replace with a 2-cell HTML table.

- [ ] **Step 1: Replace `emailHeader()` in the shared file**

Find this function (lines 18–27):

```ts
function emailHeader(tag: string) {
  return `
  <div style="background:#181d19;padding:20px 28px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:28px;height:28px;background:#CE1126;border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Public Sans',Arial;font-weight:800;font-size:13px;color:#fff">B</div>
      <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#fff">The Base Movement</span>
    </div>
    <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">${tag}</span>
  </div>`
}
```

Replace with:

```ts
function emailHeader(tag: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:#181d19;border-collapse:collapse">
    <tr>
      <td style="padding:20px 28px;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="padding-right:10px;vertical-align:middle">
              <div style="width:28px;height:28px;background:#CE1126;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:13px;color:#fff;text-align:center;line-height:28px">B</div>
            </td>
            <td style="vertical-align:middle">
              <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#fff">The Base Movement</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:20px 28px;vertical-align:middle;text-align:right;white-space:nowrap">
        <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">${tag}</span>
      </td>
    </tr>
  </table>`
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates.ts
git commit -m "fix(email): replace flex header with table layout for Outlook compatibility"
```

---

### Task 3: Fix sender address in `send-donation-receipt` and redeploy

**Files:**

- Modify: `supabase/functions/send-donation-receipt/index.ts:81`

The `from` email is currently `brastyphler17@gmail.com`. SendGrid will reject or spam-flag mail from unverified senders.

- [ ] **Step 1: Update the `from` address**

Find line 81:

```ts
from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
```

Replace with:

```ts
from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
```

- [ ] **Step 2: Deploy the updated function**

In Supabase Dashboard → Edge Functions → `send-donation-receipt` → Deploy, or via CLI:

```bash
supabase functions deploy send-donation-receipt
```

- [ ] **Step 3: Verify in logs**

Trigger a test donation verification in the admin panel. Check Supabase Dashboard → Edge Functions → `send-donation-receipt` → Logs. You should see `[RECEIPT] Sent to <email> 202`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-donation-receipt/index.ts
git commit -m "fix(email): use verified sender domain for donation receipt"
```

---

### Task 4: Fix sender address in `send-poll-notification` and redeploy

**Files:**

- Modify: `supabase/functions/send-poll-notification/index.ts:107`

- [ ] **Step 1: Update the `from` address**

Find line 107 (inside the SendGrid fetch call):

```ts
from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
```

Replace with:

```ts
from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy send-poll-notification
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-poll-notification/index.ts
git commit -m "fix(email): use verified sender domain for poll notification"
```

---

### Task 5: Fix sender address in `broadcast-dispatcher` and redeploy

**Files:**

- Modify: `supabase/functions/broadcast-dispatcher/index.ts:71`

- [ ] **Step 1: Update the `from` address**

Find line 71:

```ts
from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
```

Replace with:

```ts
from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy broadcast-dispatcher
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/broadcast-dispatcher/index.ts
git commit -m "fix(email): use verified sender domain for broadcast dispatcher"
```

---

### Task 6: Create and deploy `send-welcome-email` edge function

**Files:**

- Create: `supabase/functions/send-welcome-email/index.ts`

This function is called fire-and-forget by `adminService.verifyMember()` when an admin approves a member. It fetches the member's profile, builds the `welcomeEmail` HTML, and sends it via SendGrid.

- [ ] **Step 1: Create the function file**

Create `supabase/functions/send-welcome-email/index.ts` with the following content:

```ts
// @ts-nocheck
// THE BASE: WELCOME EMAIL
// Sent when an admin approves a pending member (status → Active).
// Invoked fire-and-forget from adminService.verifyMember().
//
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secret: SENDGRID_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { welcomeEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId } = await req.json()
    if (!userId) throw new Error('userId is required')

    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    if (!sgKey) {
      console.warn('[WELCOME] SENDGRID_API_KEY not set — skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch member profile
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('full_name, email, registration_number, chapter')
      .eq('id', userId)
      .single()

    if (userErr || !user) throw new Error(`User not found: ${userErr?.message}`)

    interface UserRow {
      full_name: string
      email: string | null
      registration_number: string
      chapter: string | null
    }
    const row = user as unknown as UserRow

    if (!row.email) {
      console.warn('[WELCOME] No email for user', userId, '— skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'no email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Live active member count for the template
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Active')

    const firstName = row.full_name.split(' ')[0] || row.full_name
    const html = welcomeEmail({
      name: firstName,
      regNo: row.registration_number,
      chapter: row.chapter ?? 'TBM',
      dashboardUrl: 'https://nevermind-beta.vercel.app/dashboard',
      cardDownloadUrl: 'https://nevermind-beta.vercel.app/dashboard',
      totalMembers: (count ?? 0).toLocaleString('en-GB'),
    })

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sgKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: row.email }] }],
        from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
        subject: `Welcome to The Base, ${firstName} — you're now a verified member`,
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (res.status !== 202) {
      const errText = await res.text()
      throw new Error(`SendGrid error ${res.status}: ${errText}`)
    }

    console.log('[WELCOME] Sent to', row.email)
    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[WELCOME-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy send-welcome-email --no-verify-jwt
```

Or via Supabase MCP deploy tool with `verify_jwt: false`.

- [ ] **Step 3: Smoke test via curl**

```bash
curl -X POST https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<a real user id with an email>"}'
```

Expected response: `{"sent":true}` and status 200. Check the member's inbox.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-welcome-email/index.ts
git commit -m "feat(email): send-welcome-email edge function"
```

---

### Task 7: Wire welcome email trigger in `adminService.ts`

**Files:**

- Modify: `src/services/adminService.ts:500-506`

- [ ] **Step 1: Add the fire-and-forget invoke**

Find `verifyMember()` in `src/services/adminService.ts`. The current block at lines 500–506:

```ts
    if (approve && chapterName) {
      await this.incrementChapterMemberCount(chapterName)
    }
  }
  return success
}
```

Replace with:

```ts
    if (approve && chapterName) {
      await this.incrementChapterMemberCount(chapterName)
    }
    if (approve) {
      supabase.functions
        .invoke('send-welcome-email', { body: { userId: id } })
        .catch(() => {
          // Fire-and-forget — email failure must not block approval
        })
    }
  }
  return success
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit and push**

```bash
git add src/services/adminService.ts
git commit -m "feat(email): trigger welcome email on member approval"
git push
```

- [ ] **Step 4: End-to-end test**

In the admin panel, approve a pending member who has a real email address. Check:

1. The approval succeeds immediately (email is fire-and-forget, won't block)
2. After ~5 seconds, check Supabase → Edge Functions → `send-welcome-email` → Logs
3. You should see `[WELCOME] Sent to <email> ` with no errors
4. The member receives the branded welcome email

---

### Task 8: Create and deploy `poll-closing-scheduler` edge function

**Files:**

- Create: `supabase/functions/poll-closing-scheduler/index.ts`

This cron-triggered function runs daily, finds polls closing within the next 24 hours that haven't been notified, marks them as notified (optimistic, to prevent double-send), then calls `send-poll-notification` for each.

- [ ] **Step 1: Create the function file**

Create `supabase/functions/poll-closing-scheduler/index.ts`:

```ts
// @ts-nocheck
// THE BASE: POLL CLOSING SCHEDULER
// Triggered daily at 08:00 GMT via Supabase cron.
// Finds polls closing within the next 24 hours that haven't sent a closing
// notification, marks them notified (optimistic), then calls send-poll-notification
// for each one.
//
// Cron: 0 8 * * * (Supabase Dashboard → Database → Cron Jobs)
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // Find active polls closing within the next 24h that haven't been notified
  const { data: polls, error } = await supabase
    .from('polls')
    .select('id, title')
    .eq('status', 'Active')
    .eq('closing_notified', false)
    .gte('end_date', now)
    .lte('end_date', in24h)

  if (error) {
    console.error('[POLL-SCHEDULER] Query error', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!polls || polls.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[POLL-SCHEDULER] Dispatching notifications for ${polls.length} poll(s)`)

  // Mark notified optimistically — prevents double-send on concurrent cron runs
  const ids = polls.map((p: { id: string }) => p.id)
  await supabase.from('polls').update({ closing_notified: true }).in('id', ids)

  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const poll of polls as Array<{ id: string; title: string }>) {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-poll-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ pollId: poll.id }),
    })

    if (res.ok) {
      results.push({ id: poll.id, ok: true })
      console.log(`[POLL-SCHEDULER] Notified poll ${poll.id}`)
    } else {
      const errText = await res.text()
      console.error(`[POLL-SCHEDULER] Failed for poll ${poll.id}: ${errText}`)
      // Do NOT revert closing_notified — a missed send is preferable to a double-send
      results.push({ id: poll.id, ok: false, error: errText })
    }
  }

  return new Response(JSON.stringify({ dispatched: polls.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy poll-closing-scheduler --no-verify-jwt
```

Or via Supabase MCP deploy tool with `verify_jwt: false`.

- [ ] **Step 3: Smoke test**

First, find or create an active poll whose `end_date` is within the next 24 hours and has `closing_notified = false`. Then:

```bash
curl -X POST https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/poll-closing-scheduler \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

Expected: `{"dispatched":1,"results":[{"id":"...","ok":true}]}`

Verify in SQL:

```sql
SELECT id, closing_notified FROM polls WHERE id = '<poll_id>';
```

Expected: `closing_notified = true`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/poll-closing-scheduler/index.ts
git commit -m "feat(email): poll-closing-scheduler edge function with daily cron"
```

---

### Task 9: Add daily cron for `poll-closing-scheduler` (manual step)

**Files:** None — Supabase Dashboard only

- [ ] **Step 1: Create the cron job**

Supabase Dashboard → Database → Cron Jobs → Create a new cron job:

| Field    | Value                    |
| -------- | ------------------------ |
| Name     | `poll-closing-scheduler` |
| Schedule | `0 8 * * *`              |
| Type     | Supabase Edge Function   |
| Function | `poll-closing-scheduler` |
| Method   | POST                     |
| Timeout  | 5000 ms                  |

Click **Create cron job**.

- [ ] **Step 2: Verify**

The next day at 08:00 GMT, check:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'poll-closing-scheduler')
ORDER BY start_time DESC
LIMIT 5;
```

Expected: rows with `status = 'succeeded'`.

---

## Self-Review

### Spec coverage check

| Spec requirement                                      | Task      |
| ----------------------------------------------------- | --------- |
| Fix Outlook header in `_shared/email-templates.ts`    | Task 2 ✅ |
| Fix sender address in `send-donation-receipt`         | Task 3 ✅ |
| Fix sender address in `send-poll-notification`        | Task 4 ✅ |
| Fix sender address in `broadcast-dispatcher`          | Task 5 ✅ |
| New `send-welcome-email` edge function                | Task 6 ✅ |
| Wire welcome trigger in `adminService.verifyMember()` | Task 7 ✅ |
| DB migration `closing_notified` column                | Task 1 ✅ |
| New `poll-closing-scheduler` edge function            | Task 8 ✅ |
| Daily cron for poll scheduler                         | Task 9 ✅ |

### Deployment order from spec

Spec requires: migration → shared template → existing functions → send-welcome-email → poll-closing-scheduler → frontend → cron.

Plan order: Task 1 (migration) → Task 2 (shared template) → Tasks 3–5 (existing functions) → Task 6 (send-welcome-email) → Task 7 (frontend) → Task 8 (poll-closing-scheduler) → Task 9 (cron). ✅
