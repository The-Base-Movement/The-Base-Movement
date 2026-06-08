# Reports & Analytics Workflow

## Purpose

Building, modifying, and debugging analytics pages, reports, and intelligence dashboards in The Base Movement admin panel.

## When to use

Use this workflow when the task involves:

- Adding or changing metrics on the admin analytics page
- Modifying the finance dashboard or spending ledger
- Working on mobilization metrics or ground game analytics
- Changing sentiment intelligence or ML intelligence views
- Modifying the pulse report component
- Adding charts (Recharts) to an analytics or reporting page
- Exporting data (CSV, PDF) from an admin report

## Project context

- Admin analytics: `src/pages/admin/AdminAnalytics.tsx`
- Executive dashboard: `src/pages/admin/ExecutiveDashboard.tsx`
- Finance dashboard: `src/pages/admin/FinanceDashboard.tsx`
- Mobilization metrics: `src/pages/admin/MobilizationMetrics.tsx`
- Sentiment intelligence: `src/pages/admin/SentimentIntelligence.tsx`
- ML intelligence: `src/pages/admin/MLIntelligence.tsx`
- Ground game: `src/pages/admin/GroundGameCommand.tsx`
- Pulse report component: `src/components/admin/PulseReport.tsx`
- Analytics services: `src/services/financeAnalyticsService.ts`, `src/services/intelligenceService.ts`
- Chart library: Recharts — `ResponsiveContainer`, `BarChart`, `LineChart`, `PieChart`, `AreaChart`
- PDF export: `jspdf` (already installed)
- Analytics tracking: `src/lib/analytics.ts`

## Inspect first

- The specific analytics page file
- Grep `financeAnalyticsService.ts` or `intelligenceService.ts` for the data function
- `src/lib/currency.ts` — for money formatting in finance reports
- `src/components/admin/TacticalKPI.tsx` — for tactical KPI card patterns

## Docs to check

- not available for analytics specifically

## Avoid touching

- `src/routes.tsx`
- `supabase/migrations/` — unless a new metrics query requires a schema change
- Other analytics pages not being worked on

## Workflow

1. Read CLAUDE.md for KPI tile and chart patterns.
2. Identify the specific analytics page.
3. Grep the relevant analytics service for the data function.
4. Use Recharts `ResponsiveContainer` wrappers — do not introduce a new chart library.
5. Apply KPI tile pattern for stat cards (3px left bar, `var(--kpi-num-size)` for number).
6. Format currency via `src/lib/currency.ts`.
7. For PDF export: use `jspdf` (already installed).
8. Run `npm run typecheck`.
9. Summarize what changed.

## Project rules

- KPI tile numbers: `fontSize: 'var(--kpi-num-size)'` — never hardcoded.
- All money values: format via `src/lib/currency.ts`.
- Chart tooltips: use `hsl(var(--on-surface))` for text color.
- Do not introduce D3, Victory, Chart.js, or any other charting library — Recharts only.
- PDF export via `jspdf` — do not add a new PDF library.

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Grep analytics services rather than reading them fully.
- Read only the specific analytics page being modified.
- Do not scan all admin pages.
- Stop after the analytics change is complete.
