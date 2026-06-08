---
name: forms
description: Use when changing forms, inputs, validation, uploads, registration, checkout, donations, profile settings, admin modals, CSV import, or submit flows.
---

# Purpose

Handle form, modal, input, validation, upload, and submission changes with existing UI/service conventions.

# When to use

Use this skill when the task involves:

- Registration, login, settings, admin modals, CSV import, uploads, checkout, donation, or profile forms.

# Project context

Forms commonly use inline styles, radius tokens, Material Symbols, loading states, toast/error messages, and Supabase services.

# Inspect first

- `AGENTS.md`
- Target form/page/modal.
- Related `src/services/*Service.ts`.
- Related types in `src/types`.
- `src/lib/scanForm.ts` for OCR/scan flows.

# Docs to check

- `docs/audits/csv-member-password-flow.md`
- `docs/database-sql-files/kyc-integration-plan.md`
- Relevant feature plan/spec docs.

# Avoid touching

- Unrelated forms.
- Supabase migrations unless the form needs schema changes.
- Auth/session code unless the form is auth-related.

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

Inputs must use `boxSizing: 'border-box'`. Use radius tokens, `hsl(var(...))`, existing submit/loading/error patterns, and service-layer writes.

# Validation

- `npm run typecheck`
- `npm run test:run` when behavior is tested.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
