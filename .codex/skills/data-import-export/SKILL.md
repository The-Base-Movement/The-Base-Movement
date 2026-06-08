---
name: data-import-export
description: Use when changing CSV/PDF import or export flows, OCR scanning, KYC verification, media sync, seed scripts, generated data files, or scan helpers.
---

# Purpose

Guide CSV, PDF, OCR, media, seed, import, export, and scan workflows.

# When to use

Use this skill when the task involves:

- CSV member import, export buttons, PDF scanning, OCR verification, media sync, seed scripts, or generated data files.

# Project context

The repo has CSV/password flow docs, scan scripts, Supabase edge functions for OCR/KYC/scan, export logic in admin pages, and maintenance scripts under `scripts`.

# Inspect first

- `AGENTS.md`
- Target import/export page or service.
- `scripts/`
- `src/lib/scanForm.ts`
- `supabase/functions/scan-form`
- `supabase/functions/ocr-verify`
- `supabase/functions/kyc-verify`

# Docs to check

- `docs/audits/csv-member-password-flow.md`
- `docs/database-sql-files/kyc-integration-plan.md`
- `docs/member-cards/`

# Avoid touching

- Unrelated seed data.
- Live database migrations unless explicitly required.

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

Keep import/export behavior scoped and reversible. Do not expose national ID directly. Preserve existing upload/storage buckets.

# Validation

- `npm run typecheck`
- `npm run test:run` when helpers are covered.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
