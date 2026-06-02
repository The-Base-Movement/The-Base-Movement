# Finance Analytics Dashboard — Design Spec

**Date:** 2026-06-02
**Feature:** Finance Officer analytics dashboard
**Route:** `/admin/finance-dashboard`

---

## Goal

A dedicated analytics page for Finance Officers and Super Admins showing platform-wide financial health: total donations received, total expenses, net balance, cashflow over time, expense category breakdown, and a combined recent transactions feed.

## Architecture

Single new page (`FinanceDashboard.tsx`) backed by a new `financeAnalyticsService.ts`. All data fetched from existing `donations` and `mobilization_ledger` tables. All time-bucketing done client-side. Charts rendered with Recharts (already a project dependency). No new migrations required.

**Tech Stack:** React + TypeScript + Recharts + Supabase JS client

---

## Section 1: Page Structure & Access

- **Route:** `/admin/finance-dashboard`
- **Access:** `FINANCE_OFFICER` and `SUPER_ADMIN` roles only
- **Sidebar:** New "Finance dashboard" link (icon: `analytics`) added to the Finance nav group, above the existing Donations link. Uses the existing `financeOfficerOnly` filter in `AdminLayout.tsx`.
- **Layout:** Standard admin page — `AdminPageHeader` at top, then content sections below.

---

## Section 2: KPI Row

Four items across the top:

| Position | Style                     | Label               | Value                                  | Data Source                                |
| -------- | ------------------------- | ------------------- | -------------------------------------- | ------------------------------------------ |
| 1 (hero) | Dark panel (`#0f1310` bg) | "The Base Movement" | Net Balance (large)                    | `totalIncome − totalExpenses`              |
| 2        | KPI tile, green bar       | Total Donations     | Sum of `amount` where `cleared = true` | `donations` table, `cleared = true` filter |
| 3        | KPI tile, red bar         | Total Expenses      | Sum of all ledger amounts              | `mobilization_ledger.amount` SUM           |
| 4        | KPI tile, gold bar        | Net Balance         | Income − Expenses                      | Computed                                   |

The hero card uses inline styles matching the dark sidebar bg (`#0f1310`), white text, with "The Base Movement" as the title and the net balance as the large figure. KPI tiles use the standard brand-bar pattern from CLAUDE.md.

All four values come from a single `getSummaryStats()` call (parallel Supabase queries).

---

## Section 3: Charts Row

Two-column `.sidebar-main` layout (chart wider on left, donut on right).

### 3a: Cashflow Bar Chart (left, ~60% width)

- **Library:** Recharts `<BarChart>` with `<Bar>` for Income and Expense
- **Bar colors:** Income = `hsl(var(--primary))` (green), Expense = `hsl(var(--on-surface))` (charcoal)
- **Period filter:** `Day | Week | Month | Year` tab buttons — default **Month**
- **X-axis:** Time labels matching selected period (e.g. "Jan", "Feb" for Month; "Mon", "Tue" for Day)
- **Y-axis:** Amount in GH₵, auto-scaled
- **Data source:** `getCashflowData(period)` — donations grouped by `created_at`, ledger entries grouped by `timestamp`, merged into `{ label, income, expense }[]`

### 3b: Expense Breakdown Donut (right, ~40% width)

- **Library:** Recharts `<PieChart>` with `innerRadius` (donut style)
- **Same period filter** as cashflow chart (shared state — one filter controls both)
- **Center label:** "Total Expenses" + period total amount
- **Legend:** Below chart — category name, amount, percentage
- **Categories:** Read dynamically from `category` field (free-text, no enum) — grouped client-side
- **Empty state:** "No expense data for this period" message when ledger is empty
- **Data source:** `getExpenseBreakdown(period)`

---

## Section 4: Recent Transactions Table

Full-width `.panel` below the charts row.

- Shows last **20 rows** by default, newest first
- Combines donations (income) and ledger entries (expenses) into one chronological list
- No additional date filter — this is a live activity feed

### Columns

| Column           | Income row                    | Expense row                     |
| ---------------- | ----------------------------- | ------------------------------- |
| Description      | Donor name or "Anonymous"     | Ledger `description`            |
| Type             | `pill-ok` "Income"            | `pill-err` "Expense"            |
| Date             | `donations.created_at`        | `mobilization_ledger.timestamp` |
| Chapter / Source | `payment_method` or `country` | `chapter`                       |
| Amount           | `+GH₵X,XXX` in green          | `−GH₵X,XXX` in red              |
| Status           | Donation `status` value       | — (blank)                       |

- "View all expenses →" link at bottom-right routes to `/admin/spending-ledger`
- "View all donations →" link at bottom-right routes to `/admin/donations`

---

## Section 5: Data Layer

**New file:** `src/services/financeAnalyticsService.ts`

### Types

```ts
export interface SummaryStats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

export interface CashflowBucket {
  label: string
  income: number
  expense: number
}

export interface ExpenseCategory {
  category: string
  amount: number
  percent: number
}

export interface TransactionRow {
  id: string
  kind: 'income' | 'expense'
  description: string
  date: string
  chapterOrSource: string
  amount: number
  status?: string
}

export type FinancePeriod = 'day' | 'week' | 'month' | 'year'
```

### Methods

**`getSummaryStats(): Promise<SummaryStats>`**

- Fires two parallel Supabase queries: `donations` sum (where `cleared = true`) and `mobilization_ledger` sum (all rows)
- Returns computed `netBalance = totalIncome - totalExpenses`

**`getCashflowData(period: FinancePeriod): Promise<CashflowBucket[]>`**

- Fetches all donations where `cleared = true` (`created_at`, `amount`) and all ledger entries (`timestamp`, `amount`)
- Groups client-side into time buckets:
  - `day`: last 7 days, label = "Mon", "Tue", etc.
  - `week`: last 8 weeks, label = "Wk 1", "Wk 2", etc.
  - `month`: last 12 months, label = "Jan", "Feb", etc.
  - `year`: last 5 years, label = "2022", "2023", etc.
- Returns array sorted chronologically

**`getExpenseBreakdown(period: FinancePeriod): Promise<ExpenseCategory[]>`**

- Fetches ledger entries where `timestamp` falls within the selected period window
- Groups by `category` field, sums amounts
- Computes percentage of total for each category
- Returns sorted by amount descending

**`getRecentTransactions(limit?: number): Promise<TransactionRow[]>`**

- Fetches last `limit` (default 20) donations ordered by `created_at` desc
- Fetches last `limit` ledger entries ordered by `timestamp` desc
- Maps each to `TransactionRow` with `kind` discriminator
- Merges arrays, sorts by date descending, returns top `limit` rows

---

## Section 6: Routing & Nav Changes

**`src/routes.tsx`**

- Add: `const FinanceDashboard = lazy(() => import('./pages/admin/FinanceDashboard'))`
- Register: `{ path: '/admin/finance-dashboard', element: <FinanceDashboard /> }` inside admin routes, adjacent to `/admin/finance-requests`

**`src/components/layouts/AdminLayout.tsx`**

- Add to Finance nav group (first item, before Donations):
  ```
  { to: '/admin/finance-dashboard', icon: 'analytics', label: 'Finance dashboard', financeOfficerOnly: true }
  ```

**`src/types/admin.ts`** — no changes needed

---

## Files Created / Modified

| File                                      | Action                           |
| ----------------------------------------- | -------------------------------- |
| `src/services/financeAnalyticsService.ts` | CREATE                           |
| `src/pages/admin/FinanceDashboard.tsx`    | CREATE                           |
| `src/routes.tsx`                          | MODIFY — add lazy import + route |
| `src/components/layouts/AdminLayout.tsx`  | MODIFY — add nav item            |

No new DB migrations required. No new Supabase edge functions required.

---

## Constraints & Notes

- **Donations have no `chapter` column** — the Chapter/Source column in the transactions table shows `payment_method` or `country` for income rows, not a chapter name. This is a known data limitation.
- **`mobilization_ledger.category` is free-text** — no enum constraint. Categories are read dynamically. If the ledger is empty, the donut chart shows an empty state.
- **`mobilization_ledger` uses `timestamp` not `created_at`** — all date comparisons on ledger entries must use the `timestamp` column.
- **Chart grouping is client-side** — acceptable while the ledger is small. If it grows large, a Supabase RPC with `date_trunc` grouping should replace the client-side bucketing.
- **Chapter scope is global** — no chapter filter. `chapter` values in the ledger cover both diaspora chapter names and Ghana constituency names; they display as-is.
