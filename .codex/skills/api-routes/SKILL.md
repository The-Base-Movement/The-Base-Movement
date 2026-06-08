---
name: api-routes
description: Use when changing Supabase Edge Functions, payment callbacks, newsletters, OTP, OCR/KYC, push notifications, webhooks, or client service calls to functions.
---

# Purpose

Guide Supabase Edge Function and service-call changes.

# When to use

Use this skill when the task involves:

- `supabase/functions`, payment callbacks, newsletters, OTP, OCR/KYC, push notifications, webhooks, or service calls into functions.

# Project context

The repo has Supabase Edge Functions under `supabase/functions`, shared email templates under `_shared`, and client service calls under `src/services`.

# Inspect first

- `AGENTS.md`
- Target `supabase/functions/<name>/index.ts`
- `supabase/functions/_shared/*`
- Calling `src/services/*Service.ts`
- `.env.example`

# Docs to check

- `docs/audits/API_INTEGRATION_GUIDE.md`
- Feature-specific audits/specs.

# Avoid touching

- Unrelated edge functions.
- UI pages unless the API change requires wiring.
- Migrations unless schema changes are required.

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

Keep secrets in env variables. Preserve CORS/error response conventions in the target function. Prefer existing shared helpers.

# Validation

- `npm run typecheck`
- `npm run test:run` when service behavior is covered.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
