---
name: reports
description: Use when changing reports, analytics dashboards, exports, charts, finance reports, logistics reports, sentiment or ML intelligence, or operational summaries.
---

# Purpose

Guide report, analytics, export, chart, intelligence, finance, logistics, and dashboard reporting work.

# When to use

Use this skill when the task involves:

- Analytics dashboards, charts, exports, finance reports, logistics reports, sentiment/ML intelligence, compliance reports, or operational summaries.

# Project context

Report pages use admin/dashboard KPI patterns, Recharts, tables, service methods, and sometimes CSV/PDF export utilities.

# Inspect first

- `AGENTS.md`
- Target report page under `src/pages/admin`
- Related `*KPIs.tsx`, chart, table, and service files.
- `src/lib/currency.ts`

# Docs to check

- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
- Relevant audits for finance, logistics, sentiment, ML, or reports.

# Avoid touching

- Unrelated reports.
- Schema unless metrics require database changes.

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

Reuse KPI rules, chart wrappers, filters, status pills, and number/currency formatting. Keep report exports scoped.

# Validation

- `npm run typecheck`
- `npm run test:run` for changed calculations/helpers.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
