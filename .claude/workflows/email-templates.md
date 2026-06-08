# Email Templates Workflow

## Purpose

Creating and modifying email templates used by The Base Movement's transactional email system (Resend) and edge functions.

## When to use

Use this workflow when the task involves:

- Modifying a welcome email, donation receipt, OTP, or newsletter template
- Adding a new transactional email type
- Changing email HTML/styling
- Debugging email delivery (Resend, Africa's Talking SMS)
- Modifying the shared email template file used by edge functions

## Project context

- Email provider: Resend (API key: `RESEND_API_KEY` in Supabase secrets)
- SMS provider: Africa's Talking (`AT_API_KEY`, `AT_USERNAME`)
- Shared email templates: `supabase/functions/_shared/email-templates.ts`
- Edge functions that send email:
  - `supabase/functions/send-welcome-email/` — registration welcome
  - `supabase/functions/send-donation-receipt/` — donation confirmation
  - `supabase/functions/send-newsletter/` — newsletter dispatch
  - `supabase/functions/send-otp/` — OTP via SMS
  - `supabase/functions/verify-otp-and-reset/` — OTP + password reset
  - `supabase/functions/broadcast-dispatcher/` — broadcasts
- Email template docs: `docs/Messaging-Templates/` — messaging template reference

## Inspect first

- `supabase/functions/_shared/email-templates.ts` — shared templates
- The specific edge function: `supabase/functions/<name>/index.ts`
- `docs/Messaging-Templates/` — for approved messaging language and brand voice

## Docs to check

- `docs/Messaging-Templates/` — brand-approved messaging templates

## Avoid touching

- `src/services/` — email is sent from edge functions, not client services
- Other edge functions unrelated to the email change
- `supabase/migrations/` — email changes do not require schema changes

## Workflow

1. Check `docs/Messaging-Templates/` for the approved messaging language.
2. Read `supabase/functions/_shared/email-templates.ts`.
3. Read the specific edge function that sends this email.
4. Modify the HTML template — keep brand colors (`#006B3F` green, `#DAA520` gold, `#CE1126` red).
5. Use inline CSS for email HTML (email clients strip `<style>` blocks).
6. Test that the Deno function still compiles (TypeScript check if possible).
7. Deploy: `supabase functions deploy <function-name>`.
8. Summarize what changed.

## Project rules

- Email HTML must use inline CSS — not external stylesheets or Tailwind.
- Brand colors for email: green `#006B3F`, gold `#DAA520`, red `#CE1126`.
- Always preserve the unsubscribe link in newsletters (`newsletter-unsubscribe` edge function handles it).
- SMS messages via Africa's Talking must be concise (160 chars for single SMS).
- Edge functions run on Deno — use Deno-compatible imports from `supabase/import_map.json`.
- Resend API key is a server-side secret — never expose it to the client.

## Validation

```bash
supabase functions deploy <function-name>
```

Frontend typecheck: not applicable for edge function changes.

## Token-saving behavior

- Read only the specific edge function and shared templates file.
- Do not scan all edge functions.
- Do not read frontend service files for email tasks.
- Stop after the template change and deploy are complete.
