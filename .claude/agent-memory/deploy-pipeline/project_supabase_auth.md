---
name: Supabase CLI authentication requirement for edge function deploys
description: Edge function deploys fail with 401 if CLI is not authenticated — requires supabase login or SUPABASE_ACCESS_TOKEN env var
type: project
---

Edge function deploys via `npx supabase functions deploy` require an active Supabase CLI session.

If the session is missing, every deploy fails with: `unexpected deploy status 401: {"message":"Unauthorized"}`

**Fix options:**

- Interactive: `npx supabase login` (opens browser OAuth flow)
- Non-interactive: set `$env:SUPABASE_ACCESS_TOKEN = "<personal-access-token>"` before running deploy commands

**Active edge functions to deploy (in any order):**

- `ocr-verify`
- `broadcast-dispatcher`
- `notify-leads`

**DO NOT deploy** `scan-form` — abandoned dead code, requires `ANTHROPIC_API_KEY` which is intentionally unconfigured. Browser-side Tesseract.js (`src/lib/scanForm.ts`) replaced it.

**Why:** The CLI session does not persist between terminal sessions on this machine. Docker also is not running (warning appears but does not block remote deploys).

**How to apply:** At the start of every deploy session, verify CLI auth with `npx supabase projects list` before running deploy commands. If it returns 401, authenticate first.
