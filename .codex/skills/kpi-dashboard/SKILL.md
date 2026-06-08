---
name: kpi-dashboard
description: Use when changing KPI strips, metric cards, TacticalKPI usage, dashboard analytics, chart panels, tables, filters, empty states, or stat number formatting.
---

# Purpose

Keep KPI, analytics, chart, table, and dashboard changes consistent with the existing admin/member patterns.

# When to use

Use this skill when the task involves:

- KPI strips, metric cards, dashboard summaries, charts, filters, search, tables, empty states, or stat formatting.

# Project context

KPI strips use `.kpis`. Admin pages usually use `TacticalKPI`; inline KPI panels use `.panel`, a 3px left bar, uppercase muted labels, and `fontSize: 'var(--kpi-num-size)'`.

# Inspect first

- `AGENTS.md`
- `src/components/admin/TacticalKPI.tsx`
- Target `*KPIs.tsx`, dashboard page, table, filter, and service file.
- `src/lib/currency.ts`

# Docs to check

- `docs/audits/kpi-stats-reference.md`
- `docs/audits/layout_guidelines.md`

# Avoid touching

- Unrelated dashboards.
- Database migrations unless metric data requires schema work.
- Route config unless adding/removing a page is explicitly requested.

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

Always wrap KPI cards in `.kpis`. Never hardcode stat number font sizes. Reuse status pills, loading panels, mobile card fallbacks, and service-layer data fetches. Use `toLocaleString()` or `Intl.NumberFormat` where existing code does.

# Validation

- `npm run typecheck`
- `npm run test:run` when metric logic is covered or changed.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
