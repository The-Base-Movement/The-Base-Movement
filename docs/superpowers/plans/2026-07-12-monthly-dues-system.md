# Monthly Dues System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build voluntary monthly dues with finance configuration, member consent, manual and recurring Hubtel payments, reminders, Discord finance alerts, analytics, receipts, and exports.

**Architecture:** Keep Hubtel, Supabase, the existing finance permission vocabulary, notification helpers, currency conversion, and dashboard design system. Store immutable monthly obligations and consent history in Postgres; perform payment, cancellation, reminder, export, and callback mutations through authenticated RPCs or Edge Functions. Implement in independently testable slices and keep recurring enrollment disabled until live configuration is approved.

**Tech Stack:** React 19, TypeScript, Vite 7, Supabase Postgres/RLS/Edge Functions/Cron, Hubtel Checkout and Recurring Invoice, Vitest, Deno tests, Recharts, existing email/MNotify/Discord helpers.

## Global Constraints

- Do not store or commit the Discord webhook URL; read `MONTHLY_DUES_DISCORD_WEBHOOK_URL` only in server code.
- Rotate the webhook exposed during planning before configuring any environment.
- Never handle raw card or mobile-money credentials.
- Finance mutations require `MANAGE_DONATIONS:DONATIONS`.
- Members may access only their own enrollment, consent, payments, receipts, and exports.
- Hubtel callbacks, not browser state, determine successful payment.
- Consent history is append-only; payment and audit history is never deleted on opt-out.
- Use one finance-defined GHS amount and snapshot the member-local currency conversion per obligation.
- Reminder stages are three days before due, due date, and three days overdue.
- Recurring enrollment remains disabled until sandbox and production callback verification pass.
- Reuse custom CSS, Material Symbols, existing finance/member UI components, and service-layer patterns.
- Add no payment abstraction, UI library, or new role framework.

---

### Task 1: Monthly dues schema, constraints, and RLS

**Files:**
- Create with `supabase migration new monthly_dues_core`: the CLI-generated migration ending `_monthly_dues_core.sql`
- Create: `supabase/tests/monthly_dues_core.sql`

**Interfaces:**
- Produces: `monthly_dues_settings`, `monthly_dues_enrollments`, `monthly_dues_consents`, `monthly_dues_payments`, `monthly_dues_reminders`.
- Produces: `get_current_monthly_dues_settings()`, `set_monthly_dues_consent(boolean, boolean, text)`, and database constraints used by all later tasks.

- [ ] **Step 1: Create the migration using the CLI**

Run:

```bash
supabase migration new monthly_dues_core
```

Expected: one timestamped migration path printed. Use that exact path below.

- [ ] **Step 2: Write failing SQL contract tests**

Create `supabase/tests/monthly_dues_core.sql` with transactions that assert:

```sql
begin;
select plan(8);
select has_table('public', 'monthly_dues_settings');
select has_table('public', 'monthly_dues_enrollments');
select has_table('public', 'monthly_dues_consents');
select has_table('public', 'monthly_dues_payments');
select has_table('public', 'monthly_dues_reminders');
select col_is_unique('public', 'monthly_dues_enrollments', 'member_id');
select col_is_unique('public', 'monthly_dues_payments', array['member_id', 'dues_month']);
select col_is_unique('public', 'monthly_dues_reminders', array['payment_id', 'channel', 'reminder_stage']);
select * from finish();
rollback;
```

- [ ] **Step 3: Implement the minimal schema and RLS**

Define the exact statuses from the design as check constraints, use `date_trunc('month', dues_month) = dues_month`, restrict due day to 1-28, enable RLS on every table, grant only required columns/operations, and create member ownership SELECT policies using `auth.uid() = member_id`. Finance writes must call existing admin-permission RPC logic rather than trusting JWT user metadata.

Make consent rows immutable:

```sql
create policy "members insert own dues consent"
on public.monthly_dues_consents for insert to authenticated
with check (auth.uid() = member_id);

revoke update, delete on public.monthly_dues_consents from authenticated, anon;
```

- [ ] **Step 4: Run schema tests**

Run:

```bash
supabase db reset
supabase test db supabase/tests/monthly_dues_core.sql
```

Expected: 8 assertions pass. If the known older migration-order defect blocks reset, capture the exact failure and run the test against a linked disposable database before completion.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/*_monthly_dues_core.sql supabase/tests/monthly_dues_core.sql
git commit -m "Add monthly dues data model"
```

### Task 2: Dues domain calculations and service layer

**Files:**
- Create: `src/lib/monthlyDues.ts`
- Create: `src/services/monthlyDuesService.ts`
- Create: `src/test/monthlyDues.test.ts`

**Interfaces:**
- Produces: `getDuesMonth(date)`, `getDuesDates(month, dueDay, gracePeriodDays)`, `getReminderStage(now, obligation)`, `getMemberDuesSummary(payments)`.
- Produces: typed service methods for member state, finance state, enrollment, consent, filters, and exports.

- [ ] **Step 1: Write failing calculation tests**

Cover due-day clamping, month identity, paid reminder suppression, pre-due/due/overdue stages, and summary totals:

```ts
expect(getDuesDates('2026-02-01', 28, 7)).toEqual({
  dueDate: '2026-02-28',
  overdueDate: '2026-03-07',
})
expect(getReminderStage(new Date('2026-02-25T09:00:00Z'), obligation)).toBe('pre_due')
expect(getReminderStage(new Date('2026-02-28T09:00:00Z'), paidObligation)).toBeNull()
```

- [ ] **Step 2: Run the test to verify failure**

```bash
npm run test:run -- src/test/monthlyDues.test.ts
```

Expected: FAIL because `@/lib/monthlyDues` does not exist.

- [ ] **Step 3: Implement pure helpers and typed service calls**

Use UTC calendar dates, existing `getCurrencyForCountry`, Supabase service-layer conventions, and explicit result types. Do not query Supabase directly from pages.

- [ ] **Step 4: Run tests and typecheck**

```bash
npm run test:run -- src/test/monthlyDues.test.ts
npm run typecheck
```

Expected: all focused tests and TypeScript pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/monthlyDues.ts src/services/monthlyDuesService.ts src/test/monthlyDues.test.ts
git commit -m "Add monthly dues domain service"
```

### Task 3: Server-authorized enrollment, consent, and obligations

**Files:**
- Create with CLI: the CLI-generated migration ending `_monthly_dues_operations.sql`
- Create: `supabase/tests/monthly_dues_operations.sql`

**Interfaces:**
- Produces RPCs: `enroll_monthly_dues(p_payment_mode text, p_email boolean, p_sms boolean, p_policy_version text)`, `opt_out_monthly_dues()`, `ensure_monthly_dues_obligation(p_member_id uuid, p_month date)`.
- Consumes Task 1 tables and Task 2 date/currency rules.

- [ ] **Step 1: Write failing SQL tests**

Test member-bound identity, append-only consent, idempotent obligation creation, settings snapshots, opt-out history preservation, and rejection of cross-member writes.

- [ ] **Step 2: Run tests to verify failure**

```bash
supabase test db supabase/tests/monthly_dues_operations.sql
```

Expected: RPC-not-found failures.

- [ ] **Step 3: Implement transactional RPCs**

Use `auth.uid()` for member operations, validate active settings, insert consent before changing enrollment, and return only identifiers/status. Keep any privileged helper outside the exposed schema where possible; if an existing exposed admin RPC pattern must be followed, revoke public execution and grant only the minimum role.

- [ ] **Step 4: Run SQL tests**

Expected: all operations tests pass without exposing another member's data.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/*_monthly_dues_operations.sql supabase/tests/monthly_dues_operations.sql
git commit -m "Secure monthly dues enrollment"
```

### Task 4: Member Monthly Dues tab and manual Hubtel payment

**Files:**
- Modify: `src/pages/MyDonations.tsx`
- Create: `src/components/dues/MonthlyDuesTab.tsx`
- Create: `src/components/dues/DuesPaymentHistory.tsx`
- Modify: `src/components/payment/hubtelCheckout.ts`
- Modify: `supabase/functions/hubtel-initiate-payment/index.ts`
- Modify: `supabase/functions/hubtel-payment-callback/index.ts`
- Create: `src/test/monthlyDuesMemberFlow.test.tsx`
- Create: `supabase/functions/hubtel-payment-callback/monthly-dues.test.ts`

**Interfaces:**
- Adds checkout type `monthly_dues` with an obligation reference.
- Callback atomically transitions only matching pending dues obligations.

- [ ] **Step 1: Write failing UI and callback tests**

Assert Donations/Monthly Dues tabs, local/GHS amounts, **Pay this month**, paid receipt state, retry state, mismatched amount rejection, and duplicate callback idempotency.

- [ ] **Step 2: Run focused tests to verify failure**

```bash
npm run test:run -- src/test/monthlyDuesMemberFlow.test.tsx
npx -y deno test --no-check --no-lock supabase/functions/hubtel-payment-callback/monthly-dues.test.ts
```

- [ ] **Step 3: Implement the smallest member flow**

Reuse `HubtelPaymentModal`, existing checkout initiation, currency helpers, `.panel`, `.ph`, `.pill`, and Material Symbols. The browser submits only the obligation ID; server code reloads and validates amount/member/status before sending GHS to Hubtel.

- [ ] **Step 4: Run focused tests and typecheck**

```bash
npm run test:run -- src/test/monthlyDuesMemberFlow.test.tsx
npx -y deno test --no-check --no-lock supabase/functions/hubtel-payment-callback/monthly-dues.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyDonations.tsx src/components/dues src/components/payment/hubtelCheckout.ts supabase/functions/hubtel-initiate-payment/index.ts supabase/functions/hubtel-payment-callback src/test/monthlyDuesMemberFlow.test.tsx
git commit -m "Add member monthly dues payments"
```

### Task 5: Profile notification consent and reminder dispatcher

**Files:**
- Modify: `src/pages/ProfileSettings.tsx`
- Create: `src/components/settings/MonthlyDuesNotificationSettings.tsx`
- Create: `supabase/functions/monthly-dues-reminder/index.ts`
- Create: `supabase/functions/monthly-dues-reminder/index.test.ts`
- Create: `src/test/monthlyDuesConsent.test.tsx`
- Modify: `supabase/config.toml`

**Interfaces:**
- Consumes latest append-only consent.
- Produces idempotent `pre_due`, `due`, and `overdue` email/SMS sends.

- [ ] **Step 1: Write failing consent and reminder tests**

Cover independent toggles, consent timestamps, disabled-channel suppression, paid suppression, opt-out suppression, unique-stage claims, and retryable failures.

- [ ] **Step 2: Run tests to verify failure**

```bash
npm run test:run -- src/test/monthlyDuesConsent.test.tsx
npx -y deno test --no-check --no-lock supabase/functions/monthly-dues-reminder/index.test.ts
```

- [ ] **Step 3: Implement settings and daily dispatcher**

Reuse existing email templates and `_shared/sms.ts`. Configure JWT/service-role behavior consistently with other scheduled functions. Never infer consent from contact-field presence.

- [ ] **Step 4: Run tests and typecheck**

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProfileSettings.tsx src/components/settings/MonthlyDuesNotificationSettings.tsx src/test/monthlyDuesConsent.test.tsx supabase/functions/monthly-dues-reminder supabase/config.toml
git commit -m "Add dues consent and reminders"
```

### Task 6: Hubtel Recurring Invoice lifecycle

**Files:**
- Create: `supabase/functions/monthly-dues-recurring/index.ts`
- Create: `supabase/functions/monthly-dues-recurring/index.test.ts`
- Create: `supabase/functions/monthly-dues-recurring-callback/index.ts`
- Create: `supabase/functions/monthly-dues-recurring-callback/index.test.ts`
- Modify: `src/services/monthlyDuesService.ts`
- Modify: `src/components/dues/MonthlyDuesTab.tsx`

**Interfaces:**
- Actions: `create`, `verify`, `cancel`.
- Environment: Hubtel credentials already used by checkout plus recurring-invoice base URL/config; no credentials in the client.

- [ ] **Step 1: Write failing Hubtel contract tests**

Fixture tests must assert authentication headers, create payload schedule/amount/callback, verify mapping, cancel mapping, signed reference checks, duplicate callbacks, pending cancellation, and provider-error preservation.

- [ ] **Step 2: Run Deno tests to verify failure**

```bash
npx -y deno test --no-check --no-lock supabase/functions/monthly-dues-recurring/index.test.ts supabase/functions/monthly-dues-recurring-callback/index.test.ts
```

- [ ] **Step 3: Implement the Hubtel-specific lifecycle**

Use fetch injection for tests, existing admin/auth/callback helpers, bounded response parsing, and server-side amount validation. Activate an enrollment only after a successful provider result. On cancel failure keep `cancellation_pending` and expose retry.

- [ ] **Step 4: Run Deno tests, Vitest, and typecheck**

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/monthly-dues-recurring supabase/functions/monthly-dues-recurring-callback src/services/monthlyDuesService.ts src/components/dues/MonthlyDuesTab.tsx
git commit -m "Integrate Hubtel recurring dues"
```

### Task 7: Secure Discord finance alerts

**Files:**
- Create: `supabase/functions/_shared/monthly-dues-discord.ts`
- Create: `supabase/functions/_shared/monthly-dues-discord.test.ts`
- Modify: dues callback, recurring, cancellation, and reminder functions from Tasks 5-6.

**Interfaces:**
- Produces: `sendMonthlyDuesDiscordAlert(event, options?): Promise<{ sent: boolean }>`.
- Reads only `MONTHLY_DUES_DISCORD_WEBHOOK_URL` server-side.

- [ ] **Step 1: Write failing redaction tests**

Assert allowed fields (event, shortened operational reference, month, amount/currency, status, authorized admin link) and absence of email, phone, national ID, consent payload, secrets, and raw provider response.

- [ ] **Step 2: Run test to verify failure**

```bash
npx -y deno test --no-check --no-lock supabase/functions/_shared/monthly-dues-discord.test.ts
```

- [ ] **Step 3: Implement non-blocking alerts**

Return `{ sent: false }` when the secret is absent or Discord fails. Never throw into payment-state code. Send success, activation, cancellation, callback anomaly, reminder summary, and reconciliation events only.

- [ ] **Step 4: Run all affected Deno tests**

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/monthly-dues-discord.ts supabase/functions/_shared/monthly-dues-discord.test.ts supabase/functions/monthly-dues-*
git commit -m "Add secure dues Discord alerts"
```

### Task 8: Finance dashboard Monthly Dues operations and analytics

**Files:**
- Modify: `src/pages/admin/FinanceDashboard.tsx`
- Modify: `src/services/financeAnalyticsService.ts`
- Create: `src/components/admin/finance/MonthlyDuesPanel.tsx`
- Create: `src/components/admin/finance/MonthlyDuesSettings.tsx`
- Create: `src/test/monthlyDuesFinanceDashboard.test.tsx`

**Interfaces:**
- Adds Overview/Donations/Monthly Dues/Expenses tabs.
- Adds dues KPIs, income-source breakdown, combined cashflow, search/filter/sort, provider reconciliation, offline verification, and consent history.

- [ ] **Step 1: Write failing finance-dashboard tests**

Assert permission gating, settings validation, six KPI values, filtered table behavior, dues in combined totals/charts, offline notes requirement, and provider payments not manually marked paid.

- [ ] **Step 2: Run test to verify failure**

```bash
npm run test:run -- src/test/monthlyDuesFinanceDashboard.test.tsx
```

- [ ] **Step 3: Implement using existing finance patterns**

Use `.kpis`, `TacticalKPI`, `.panel`, `.ph`, existing Recharts dependency, compact tables, and mobile cards. Keep calculations in `financeAnalyticsService`, not JSX.

- [ ] **Step 4: Run test and typecheck**

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/FinanceDashboard.tsx src/services/financeAnalyticsService.ts src/components/admin/finance src/test/monthlyDuesFinanceDashboard.test.tsx
git commit -m "Add finance monthly dues dashboard"
```

### Task 9: Member and finance CSV/PDF exports

**Files:**
- Create: `supabase/functions/export-monthly-dues/index.ts`
- Create: `supabase/functions/export-monthly-dues/index.test.ts`
- Create: `src/services/monthlyDuesExportService.ts`
- Modify: member and finance dues components.

**Interfaces:**
- Member scope: own dues or combined contributions.
- Finance scope: current authorized filters with minimal PII.
- Formats: CSV and PDF using existing installed export/PDF capabilities; add no dependency.

- [ ] **Step 1: Write failing authorization and content tests**

Assert member ownership, finance permission, filters, stable columns, local and GHS amounts, formula-injection-safe CSV cells, no national ID, and no partial response on failure.

- [ ] **Step 2: Run tests to verify failure**

- [ ] **Step 3: Implement server-authorized exports and UI actions**

- [ ] **Step 4: Run tests, typecheck, and inspect one CSV/PDF fixture**

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/export-monthly-dues src/services/monthlyDuesExportService.ts src/components/dues src/components/admin/finance
git commit -m "Export monthly dues records"
```

### Task 10: End-to-end verification and controlled activation

**Files:** Modify only when a check exposes a defect.

**Interfaces:**
- Verifies all prior tasks without enabling live recurring enrollment.

- [ ] **Step 1: Run focused Vitest suites**

```bash
npm run test:run -- src/test/monthlyDues.test.ts src/test/monthlyDuesMemberFlow.test.tsx src/test/monthlyDuesConsent.test.tsx src/test/monthlyDuesFinanceDashboard.test.tsx
```

- [ ] **Step 2: Run all dues Deno suites**

```bash
npx -y deno test --no-check --no-lock supabase/functions/_shared/monthly-dues-discord.test.ts supabase/functions/monthly-dues-reminder/index.test.ts supabase/functions/monthly-dues-recurring/index.test.ts supabase/functions/monthly-dues-recurring-callback/index.test.ts supabase/functions/export-monthly-dues/index.test.ts
```

- [ ] **Step 3: Run database, static, and build validation**

```bash
supabase test db supabase/tests/monthly_dues_core.sql supabase/tests/monthly_dues_operations.sql
npm run typecheck
npx eslint src/lib/monthlyDues.ts src/services/monthlyDuesService.ts src/services/monthlyDuesExportService.ts src/components/dues src/components/admin/finance src/pages/MyDonations.tsx src/pages/ProfileSettings.tsx src/pages/admin/FinanceDashboard.tsx
npm run build
git diff --check
```

- [ ] **Step 4: Run Hubtel sandbox verification**

Verify create, manual payment, recurring create, verify, callback, duplicate callback, cancel, callback failure, Discord failure isolation, consent suppression, and reminder deduplication. Keep `recurring_enrollment_enabled=false` afterward.

- [ ] **Step 5: Update the project graph and confirm status**

```bash
graphify update .
git status --short
```

Expected: graph succeeds and only intentionally committed changes remain.

If verification exposes a defect, return to the task that owns the file, add a focused regression test, rerun that task's checks, and commit the correction before repeating this task. Do not deploy Edge Functions or enable recurring enrollment without explicit production authorization and rotated secrets.