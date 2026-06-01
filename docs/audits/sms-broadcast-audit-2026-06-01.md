# SMS Gateway (Africa's Talking) — Broadcast Audit

**Date:** 2026-06-01
**Status:** ✅ Implemented — requires `AT_API_KEY` + `AT_USERNAME` secrets to activate
**Corresponds to:** `TODO_REMAINING.md` → Mobilization & Communication → SMS Gateway Integration

---

## What Was Built

Full SMS dispatch via [Africa's Talking](https://africastalking.com/) in the existing
`broadcast-dispatcher` Supabase Edge Function. Triggers on every **Urgent** broadcast
sent from the admin Broadcasts panel, reaching all members with a phone number in the
targeted region or constituency.

---

## Architecture

```
Admin sends Urgent broadcast
  └── broadcast-dispatcher (edge fn)
        ├── fetches matching users (region / constituency / all)
        ├── sends SendGrid bulk email  (to users with email)
        ├── dispatches Africa's Talking SMS  (to users with phone_number)
        └── fires send-push-notification  (fire-and-forget)
```

Non-Urgent broadcasts return immediately without any dispatch — no external API calls.

---

## Implementation Details (`supabase/functions/broadcast-dispatcher/index.ts`)

### Phone number normalisation

Ghana numbers arrive in multiple formats from the DB. The function normalises all of
them to E.164 (`+233XXXXXXXXX`) before dispatch:

```ts
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}` // 233241234567 → +233241234567
  if (digits.startsWith('0')) return `+233${digits.slice(1)}` // 0241234567 → +233241234567
  return `+${digits}` // already international
}
```

### Batching

Africa's Talking accepts up to **100 recipients per request**. The function slices
`numbers` into batches of 100 and fires one POST per batch:

```ts
const AT_BATCH = 100
for (let i = 0; i < numbers.length; i += AT_BATCH) {
  const batch = numbers.slice(i, i + AT_BATCH)
  // POST to https://api.africastalking.com/version1/messaging
}
```

### Request format

```
POST https://api.africastalking.com/version1/messaging
Content-Type: application/x-www-form-urlencoded
apiKey: <AT_API_KEY>
Accept: application/json

username=<AT_USERNAME>&to=+233241234567,+233501234567,...&message=<body>
```

### Graceful degradation

If `AT_API_KEY` or `AT_USERNAME` are not set, the function logs a warning and continues
without throwing — email and push still go out:

```ts
} else {
  console.warn(`[SMS] AT_API_KEY/AT_USERNAME not set — would send to ${phoneRecipients.length} numbers`)
}
```

---

## Required Secrets (Supabase Dashboard → Settings → Edge Function Secrets)

| Secret        | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `AT_API_KEY`  | Africa's Talking API key — found in AT Dashboard → Settings → API Key  |
| `AT_USERNAME` | Your AT application username (e.g. `thebase` or `sandbox` for testing) |

Set via CLI:

```bash
supabase secrets set AT_API_KEY=<your-key>
supabase secrets set AT_USERNAME=<your-username>
```

---

## Africa's Talking Dashboard Setup

1. Sign in at [https://account.africastalking.com/](https://account.africastalking.com/)
2. Create a production application (or use the sandbox for testing)
3. Go to **Settings → API Key** — copy the key
4. Note your **application username** (shown at the top of the dashboard)
5. Fund your AT wallet (SMS in Ghana ≈ GHS 0.04–0.08 per message depending on network)

### Sandbox testing

Set `AT_USERNAME=sandbox` and use the AT sandbox API
(`https://api.sandbox.africastalking.com/version1/messaging`) to test without charges.

> ⚠️ The current implementation always points to the production endpoint. For sandbox
> testing, temporarily swap the URL in the edge function or add a `VITE_AT_SANDBOX` toggle.

---

## Channel Matrix (Urgent Broadcasts)

| Channel | Provider         | Trigger condition          | Credentials needed          |
| ------- | ---------------- | -------------------------- | --------------------------- |
| Email   | SendGrid         | user has `email`           | `SENDGRID_API_KEY`          |
| SMS     | Africa's Talking | user has `phone_number`    | `AT_API_KEY`, `AT_USERNAME` |
| Push    | Web Push / VAPID | user has push subscription | `VAPID_*` keys              |

All three channels fire in the same edge function invocation. Each degrades gracefully
if its credential is missing.

---

## Targeting Logic

The `broadcast-dispatcher` accepts a `targetType` field:

| `targetType`      | Behaviour                                            |
| ----------------- | ---------------------------------------------------- |
| `REGION`          | Sends to all users with `region = targetValue`       |
| `CONSTITUENCY`    | Sends to all users with `constituency = targetValue` |
| _(anything else)_ | Sends to **all** users                               |

---

## Security Notes

- `AT_API_KEY` lives only in Supabase Edge Function secrets — never exposed to the frontend
- The dispatcher is only invoked from the admin Broadcasts page (`AdminLayout` auth guard)
- Phone numbers are never logged — only recipient counts appear in `console.warn`

---

## Deployment

```bash
# Re-deploy broadcast-dispatcher (no code change needed — just ensure secrets are set)
supabase functions deploy broadcast-dispatcher

# Set Africa's Talking secrets
supabase secrets set AT_API_KEY=<your-key>
supabase secrets set AT_USERNAME=<your-username>
```

---

## Remaining / Future

- [ ] Fund AT wallet before first production broadcast
- [ ] Consider adding a `VITE_AT_SANDBOX` environment toggle for development testing
- [ ] Delivery report webhook — AT can POST delivery receipts to a configurable URL
- [ ] Consider adding `senderId` to the AT request for branded SMS (requires AT approval for Ghana)
