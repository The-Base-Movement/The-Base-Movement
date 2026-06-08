---
name: email-templates
description: Use when changing transactional emails, newsletter templates, welcome emails, donation receipts, OTP/password emails, SendGrid sync, or email webhooks.
---

# Purpose

Guide transactional email, newsletter, SendGrid/Resend, and Supabase email function changes.

# When to use

Use this skill when the task involves:

- Welcome emails, donation receipts, OTP/password emails, newsletters, SendGrid sync, webhook email flows, or email template markup.

# Project context

Email functions live under `supabase/functions`. Shared templates live in `supabase/functions/_shared/email-templates.ts`. Newsletter services live in `src/services/newsletterService.ts`.

# Inspect first

- `AGENTS.md`
- `supabase/functions/_shared/email-templates.ts`
- Target email function under `supabase/functions`
- `src/services/newsletterService.ts`
- `.env.example`

# Docs to check

- `docs/audits/email-templates-audit-2026-05-27.md`
- `docs/audits/newsletter-audit-2026-06-01.md`
- `docs/audits/resend-integration-guide-2026-05-27.md`
- `docs/audits/sendgrid-newsletter-sync-audit-2026-06-01.md`

# Avoid touching

- Unrelated functions or services.
- UI pages unless email preview/composer changes are requested.

# Workflow

1. Read AGENTS.md.
2. Check the listed docs only when relevant.
3. Inspect the smallest relevant file set.
4. Reuse existing project patterns.
5. Preserve custom inline styling and existing UI conventions.
6. Make the smallest safe patch.
7. Run only the relevant validation command.
8. Summarize changed files and why.

# Project rules

Keep templates compatible with email clients. Do not expose secrets. Preserve provider-specific webhook behavior.

# Validation

- `npm run typecheck`
- `npm run test:run` when newsletter tests are relevant.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
