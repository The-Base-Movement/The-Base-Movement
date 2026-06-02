# Finance Dashboard Chapter Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a nullable `chapter` column to the `donations` table and a chapter filter dropdown to the Finance Dashboard so income and expenses can be viewed per chapter/constituency.

**Architecture:** A DB migration adds `chapter TEXT NULL` to `donations` with column-level SELECT grants. `financeAnalyticsService` gains an optional `chapter` parameter on all four methods plus a new `getChapters()` helper. `FinanceDashboard.tsx` gets a chapter dropdown that re-fetches all data when changed. Historical donations with no chapter remain visible under "All Chapters" and are excluded from per-chapter views (known data limitation, communicated in the UI).

**Tech Stack:** Supabase (migration + RLS), React 18 + TypeScript, existing design system CSS tokens

---

### Task 1: DB Migration — Add `chapter` to `donations`

**Files:**

- Create: `supabase/migrations/20260602150000_add_chapter_to_donations.sql`

**Context:** The `donations` table currently has no `chapter` column. The `mobilization_ledger` table already has one. Per `CLAUDE.md`, every new column added to a public table must receive column-level SELECT grants for `authenticated` and `anon`. The migration naming format is `YYYYMMDDHHMMSS_description.sql`; the last migration is `20260602140001`.

- [ ] **Step 1: Create the migration file**

  Create `supabase/migrations/20260602150000_add_chapter_to_donations.sql`:

  ```sql
  -- Add nullable chapter column to donations table.
  -- Covers both diaspora chapter names and Ghana constituency names.
  -- NULL = not yet assigned (historical records).
  ALTER TABLE public.donations
    ADD COLUMN IF NOT EXISTS chapter TEXT;

  -- Column-level SELECT grants required for all new columns (CLAUDE.md rule).
  GRANT SELECT (chapter) ON TABLE public.donations TO authenticated;
  GRANT SELECT (chapter) ON TABLE public.donations TO anon;
  ```

- [ ] **Step 2: Apply the migration**

  Use the Supabase MCP tool to apply the migration:

  ```
  mcp__supabase__apply_migration
    name: "add_chapter_to_donations"
    query: <contents of the SQL file above>
  ```

- [ ] **Step 3: Verify the column exists**

  Run via Supabase MCP `execute_sql`:

  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'donations'
    AND column_name = 'chapter';
  ```

  Expected: one row — `chapter | text | YES`

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/migrations/20260602150000_add_chapter_to_donations.sql
  git commit -m "feat(db): add nullable chapter column to donations"
  ```

---

### Task 2: Service Update — Chapter parameter + `getChapters()`

**Files:**

- Modify: `src/services/financeAnalyticsService.ts`

**Context:** The current service has four methods with no chapter filter. All four need an optional `chapter?: string` parameter. When provided, donations queries add `.eq('chapter', chapter)` and ledger queries add `.eq('chapter', chapter)`. A new fifth method `getChapters()` fetches distinct non-null chapter values from `mobilization_ledger` for the dropdown.

The current file is at `C:\MAMP\htdocs\The-Base\src\services\financeAnalyticsService.ts`. Read it before editing.

- [ ] **Step 1: Replace the full file content**

  Overwrite `src/services/financeAnalyticsService.ts` with:

  ```ts
  import { supabase } from '@/lib/supabase'

  export type FinancePeriod = 'day' | 'week' | 'month' | 'year'

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

  function getPeriodStart(period: FinancePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      case 'week': {
        const d = new Date(now)
        d.setDate(now.getDate() - 8 * 7)
        d.setHours(0, 0, 0, 0)
        return d
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 11, 1)
      case 'year':
        return new Date(now.getFullYear() - 4, 0, 1)
    }
  }

  function bucket(
    period: FinancePeriod,
    donations: { created_at: string; amount: number }[],
    ledger: { timestamp: string; amount: number }[]
  ): CashflowBucket[] {
    const now = new Date()
    const buckets: CashflowBucket[] = []

    if (period === 'month') {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
        const label = start.toLocaleString('default', { month: 'short' })
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label, income, expense })
      }
    } else if (period === 'year') {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i
        const start = new Date(year, 0, 1)
        const end = new Date(year + 1, 0, 1)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: String(year), income, expense })
      }
    } else if (period === 'week') {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now)
        start.setDate(now.getDate() - i * 7 - now.getDay())
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + 7)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: `Wk ${8 - i}`, income, expense })
      }
    } else {
      // day — last 7 days
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const end = new Date(start)
        end.setDate(start.getDate() + 1)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: DAYS[start.getDay()], income, expense })
      }
    }

    return buckets
  }

  export const financeAnalyticsService = {
    /** Returns all distinct non-null chapter values from the ledger, sorted A–Z. */
    async getChapters(): Promise<string[]> {
      const { data, error } = await supabase
        .from('mobilization_ledger')
        .select('chapter')
        .eq('transaction_type', 'Expenditure')
        .not('chapter', 'is', null)
      if (error) throw new Error(error.message)
      const unique = [...new Set((data ?? []).map((r) => r.chapter as string).filter(Boolean))]
      return unique.sort()
    },

    async getSummaryStats(chapter?: string): Promise<SummaryStats> {
      let donQuery = supabase.from('donations').select('amount').eq('status', 'Verified')
      let ledQuery = supabase
        .from('mobilization_ledger')
        .select('amount')
        .eq('transaction_type', 'Expenditure')
      if (chapter) {
        donQuery = donQuery.eq('chapter', chapter)
        ledQuery = ledQuery.eq('chapter', chapter)
      }
      const [donRes, ledRes] = await Promise.all([donQuery, ledQuery])
      if (donRes.error) throw new Error(donRes.error.message)
      if (ledRes.error) throw new Error(ledRes.error.message)
      const totalIncome = (donRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0)
      const totalExpenses = (ledRes.data ?? []).reduce((s, l) => s + Number(l.amount), 0)
      return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses }
    },

    async getCashflowData(period: FinancePeriod, chapter?: string): Promise<CashflowBucket[]> {
      const start = getPeriodStart(period).toISOString()
      let donQuery = supabase
        .from('donations')
        .select('created_at, amount')
        .eq('status', 'Verified')
        .gte('created_at', start)
      let ledQuery = supabase
        .from('mobilization_ledger')
        .select('timestamp, amount')
        .eq('transaction_type', 'Expenditure')
        .gte('timestamp', start)
      if (chapter) {
        donQuery = donQuery.eq('chapter', chapter)
        ledQuery = ledQuery.eq('chapter', chapter)
      }
      const [donRes, ledRes] = await Promise.all([donQuery, ledQuery])
      if (donRes.error) throw new Error(donRes.error.message)
      if (ledRes.error) throw new Error(ledRes.error.message)
      return bucket(period, donRes.data ?? [], ledRes.data ?? [])
    },

    async getExpenseBreakdown(period: FinancePeriod, chapter?: string): Promise<ExpenseCategory[]> {
      const start = getPeriodStart(period).toISOString()
      let query = supabase
        .from('mobilization_ledger')
        .select('category, amount')
        .eq('transaction_type', 'Expenditure')
        .gte('timestamp', start)
      if (chapter) {
        query = query.eq('chapter', chapter)
      }
      const { data, error } = await query
      if (error) throw new Error(error.message)
      const entries = data ?? []
      const totals: Record<string, number> = {}
      for (const e of entries) {
        const key = e.category || 'Uncategorized'
        totals[key] = (totals[key] ?? 0) + Number(e.amount)
      }
      const grand = Object.values(totals).reduce((s, v) => s + v, 0)
      return Object.entries(totals)
        .map(([category, amount]) => ({
          category,
          amount,
          percent: grand > 0 ? Math.round((amount / grand) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
    },

    async getRecentTransactions(limit = 20, chapter?: string): Promise<TransactionRow[]> {
      let donQuery = supabase
        .from('donations')
        .select('id, created_at, amount, full_name, payment_method, country, status, chapter')
        .order('created_at', { ascending: false })
        .limit(limit)
      let ledQuery = supabase
        .from('mobilization_ledger')
        .select('id, timestamp, amount, description, chapter')
        .eq('transaction_type', 'Expenditure')
        .order('timestamp', { ascending: false })
        .limit(limit)
      if (chapter) {
        donQuery = donQuery.eq('chapter', chapter)
        ledQuery = ledQuery.eq('chapter', chapter)
      }
      const [donRes, ledRes] = await Promise.all([donQuery, ledQuery])
      if (donRes.error) throw new Error(donRes.error.message)
      if (ledRes.error) throw new Error(ledRes.error.message)
      const income: TransactionRow[] = (donRes.data ?? []).map((d) => ({
        id: d.id,
        kind: 'income' as const,
        description: d.full_name || 'Anonymous',
        date: d.created_at,
        // Prefer chapter when set, then fall back to payment method / country
        chapterOrSource: d.chapter || d.payment_method || d.country || '—',
        amount: Number(d.amount),
        status: d.status,
      }))
      const expense: TransactionRow[] = (ledRes.data ?? []).map((l) => ({
        id: l.id,
        kind: 'expense' as const,
        description: l.description,
        date: l.timestamp,
        chapterOrSource: l.chapter || '—',
        amount: Number(l.amount),
      }))
      return [...income, ...expense]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    },
  }
  ```

- [ ] **Step 2: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add src/services/financeAnalyticsService.ts
  git commit -m "feat(services): add chapter filter param and getChapters() to financeAnalyticsService"
  ```

---

### Task 3: Dashboard UI — Chapter Filter Dropdown

**Files:**

- Modify: `src/pages/admin/FinanceDashboard.tsx`

**Context:** The current page has `period` state and two `useEffect` hooks. The first loads `getSummaryStats` and `getRecentTransactions` (deps: `[]`). The second loads chart data (deps: `[period]`). After this task:

- Both effects gain `chapter` as a dependency
- All service calls receive `chapter ?? undefined`
- A new `getChapters()` call on mount populates a dropdown
- A banner appears when a chapter is active warning about historical donation exclusion

Read the current file at `src/pages/admin/FinanceDashboard.tsx` before editing.

- [ ] **Step 1: Add chapter state and getChapters effect**

  After the `chartsLoading` state declaration (line ~53), add:

  ```tsx
  const [chapter, setChapter] = useState<string | null>(null)
  const [chapters, setChapters] = useState<string[]>([])
  ```

  Add a new `useEffect` that loads the chapter list once on mount (after the existing two effects):

  ```tsx
  useEffect(() => {
    financeAnalyticsService
      .getChapters()
      .then(setChapters)
      .catch(() => {
        /* silent — dropdown just won't show */
      })
  }, [])
  ```

- [ ] **Step 2: Update the first useEffect to depend on chapter**

  Change:

  ```tsx
  useEffect(() => {
    financeAnalyticsService
      .getSummaryStats()
      .then(setStats)
      .catch(() => setStatsError(true))
    financeAnalyticsService
      .getRecentTransactions(20)
      .then(setTransactions)
      .catch(() => {
        /* silent */
      })
  }, [])
  ```

  To:

  ```tsx
  useEffect(() => {
    setStats(null)
    setStatsError(false)
    financeAnalyticsService
      .getSummaryStats(chapter ?? undefined)
      .then(setStats)
      .catch(() => setStatsError(true))
    financeAnalyticsService
      .getRecentTransactions(20, chapter ?? undefined)
      .then(setTransactions)
      .catch(() => {
        /* silent — table shows empty state */
      })
  }, [chapter])
  ```

- [ ] **Step 3: Update the second useEffect to depend on chapter**

  Change `financeAnalyticsService.getCashflowData(period)` to `financeAnalyticsService.getCashflowData(period, chapter ?? undefined)`.

  Change `financeAnalyticsService.getExpenseBreakdown(period)` to `financeAnalyticsService.getExpenseBreakdown(period, chapter ?? undefined)`.

  Change the deps array from `[period]` to `[period, chapter]`.

- [ ] **Step 4: Add chapter filter dropdown to the JSX**

  After the `<AdminPageHeader>` and before the KPI row `<div>`, insert:

  ```tsx
  {
    /* ── Chapter filter ── */
  }
  {
    chapters.length > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Chapter:
        </span>
        <select
          value={chapter ?? ''}
          onChange={(e) => setChapter(e.target.value || null)}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid hsl(var(--border))',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            fontFamily: "'Public Sans', sans-serif",
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <option value="">All Chapters</option>
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {chapter && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setChapter(null)}
            style={{ fontSize: 12 }}
          >
            Clear
          </button>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 5: Add historical donation warning banner**

  After the chapter filter block and before the KPI grid, insert:

  ```tsx
  {
    chapter && (
      <div
        style={{
          background: 'hsl(var(--container-low))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          fontSize: 12,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          marginBottom: 16,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
        >
          info
        </span>
        Income figures show only donations explicitly assigned to{' '}
        <strong style={{ color: 'hsl(var(--on-surface))' }}>{chapter}</strong>. Historical donations
        without a chapter assignment are excluded.
      </div>
    )
  }
  ```

- [ ] **Step 6: TypeScript check and lint**

  Run: `npx tsc --noEmit && npm run lint`
  Expected: no errors

- [ ] **Step 7: Commit and push**

  ```bash
  git add src/pages/admin/FinanceDashboard.tsx
  git commit -m "feat(ui): add chapter filter dropdown to FinanceDashboard"
  git push
  ```

---

## Self-Review

### Spec Coverage

| Requirement                                                               | Task                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| Add `chapter TEXT NULL` to `donations` table                              | Task 1                                             |
| Column-level SELECT grants for new column                                 | Task 1                                             |
| `getChapters()` returns distinct chapters from ledger                     | Task 2                                             |
| All 4 service methods accept optional `chapter` param                     | Task 2                                             |
| Chapter filter scopes both income (donations) and expenses (ledger)       | Task 2                                             |
| `chapterOrSource` for income rows prefers `chapter` over `payment_method` | Task 2                                             |
| Chapter dropdown in dashboard UI                                          | Task 3                                             |
| "Clear" button to return to all-chapters view                             | Task 3                                             |
| Historical donation exclusion warning when chapter selected               | Task 3                                             |
| All data re-fetches when chapter changes                                  | Task 3 (deps: `[chapter]` and `[period, chapter]`) |
