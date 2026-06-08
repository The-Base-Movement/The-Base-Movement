# KPI Dashboard Workflow

## Purpose

Adding, modifying, or fixing KPI tiles, stat cards, charts, tables, and metric panels in the admin dashboard or member dashboard pages of The Base Movement.

## When to use

Use this workflow when the task involves:

- Adding a new KPI tile or stat card
- Changing a KPI metric, label, or value source
- Adding or editing a Recharts chart (bar, line, pie, area)
- Modifying the `.kpis` grid or panel layout
- Fixing data loading for dashboard stats
- Adding empty states or loading skeletons for dashboard sections
- Changing table columns or row data in an admin dashboard view

## Project context

- Admin dashboard: `src/pages/admin/Dashboard.tsx` (and subcomponents in `src/pages/admin/dashboard/`)
- Member dashboard: `src/pages/Dashboard.tsx`
- Executive dashboard: `src/pages/admin/ExecutiveDashboard.tsx`
- KPI data mostly comes from `adminService.ts` (92 KB) and `donationService.ts`, `financeAnalyticsService.ts`
- Chart library: Recharts — already installed, do not add another charting library
- KPI tile pattern: `.panel` wrapper + 3px left bar + uppercase label + `var(--kpi-num-size)` number
- `.kpis` class creates a 4-column responsive grid

## Inspect first

- `src/pages/admin/Dashboard.tsx` — admin dashboard page
- `src/pages/admin/dashboard/` — dashboard subcomponents (StatCards, RecentActivityPanel, etc.)
- `src/pages/Dashboard.tsx` — member dashboard page
- `src/pages/dashboard/components/` — member dashboard subcomponents
- Grep `src/services/adminService.ts` for the specific data-fetching function needed
- `src/lib/currency.ts` — for money formatting

## Docs to check

- not available

## Avoid touching

- `src/routes.tsx`
- `supabase/migrations/` — unless a new DB column is needed for the metric
- `src/context/AuthContext.tsx` — dashboard data does not change auth

## Workflow

1. Read CLAUDE.md for KPI tile pattern and CSS variable rules.
2. Identify which dashboard page/component needs the change.
3. Grep `adminService.ts` for the relevant data fetch function (do NOT read the full 92 KB file).
4. Inspect only the specific dashboard component file.
5. Apply the KPI tile pattern exactly as specified in CLAUDE.md.
6. Use `var(--kpi-num-size)` for number size — never hardcode.
7. Format currency via `src/lib/currency.ts`.
8. For charts: reuse existing Recharts `<ResponsiveContainer>` patterns already in the file.
9. Run `npm run typecheck`.
10. Summarize what changed and why.

## Project rules

- KPI numbers: `fontSize: 'var(--kpi-num-size)'` — never hardcoded.
- KPI labels: 10px, uppercase, `hsl(var(--on-surface-muted))`, `letterSpacing: '0.05em'`.
- Left bar width: exactly 3px. Bar colors: `hsl(var(--primary))` green, `hsl(var(--accent))` gold, `hsl(var(--destructive))` red, `hsl(var(--on-surface))` charcoal.
- KPI tile padding: `'16px 18px 16px 22px'` (extra left for bar).
- Panel wrapper: `className="panel"` with `position: 'relative', overflow: 'hidden'`.
- Money: always use `src/lib/currency.ts` — never format inline.
- Empty states: use muted text with a centered message, no external empty-state libraries.
- Loading: use a simple skeleton or spinner — do not introduce a new loading library.

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Do not read `adminService.ts` in full — grep for the function name.
- Do not read the full dashboard page — inspect only the KPI section.
- Recharts patterns are already established — replicate, do not reinvent.
- Stop after the KPI/chart task is complete.
