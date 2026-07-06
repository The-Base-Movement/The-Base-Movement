# Deferred Production Secret Setup Checklist

Last updated: 2026-07-07

This file tracks the production configuration work that is still pending after the code-side security fixes were completed.

## You Need To Do

Set these as Supabase Edge Function secrets or project environment variables:

1. `ADMIN_GATE_PASSPHRASE`
   - Purpose: enables the admin gate even when `site_settings.admin_gate_passphrase` is missing.
   - Value: a strong private passphrase.

2. `MNOTIFY_CALLBACK_SECRET`
   - Purpose: authenticates SMS delivery callbacks.
   - Value: a new random secret.
   - Note: do not reuse the MNotify API key as the permanent secret.

3. `NEWSLETTER_UNSUBSCRIBE_SECRET`
   - Purpose: signs newsletter unsubscribe links with a dedicated secret.
   - Value: a new random secret.

4. `HUBTEL_CALLBACK_SECRET`
   - Purpose: signs and verifies Hubtel payment callbacks.
   - Value: a new random secret.

Optional database step:

5. Add or update `site_settings.admin_gate_passphrase`
   - Purpose: allows the passphrase to be managed from the IT admin UI.
   - Note: this is optional if `ADMIN_GATE_PASSPHRASE` is set, but recommended.

## I Still Need To Do After You Set Them

1. Verify `verify-admin-gate` accepts the correct passphrase and rejects bad attempts with lockout.
2. Verify `sms-callback` rejects unsigned or wrongly signed requests.
3. Verify newsletter unsubscribe links still validate with the dedicated secret.
4. Verify Hubtel callback signature validation still works with the dedicated secret.
5. Confirm production behavior is stable after the secret changes.

## Current Status

- Code-side hardening is already shipped.
- Remaining work is production configuration and post-change verification.
- The missing live `admin_gate_passphrase` is currently a config issue, not a repo issue.
