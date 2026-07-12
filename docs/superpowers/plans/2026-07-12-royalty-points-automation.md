# Royalty Points Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Automatically award auditable Royalty Points for referrals and confirmed member payments, backfill linked historical donations, and add a finance-officer management page.

**Architecture:** A Supabase migration makes member_points the canonical signed ledger, stores configurable rates, and exposes permission-checked RPCs for awards, reporting, settings, and adjustments. Existing payment finalization paths call one idempotent award RPC; a small React service powers one Finance admin page.

**Tech Stack:** PostgreSQL/Supabase RLS and RPCs, Supabase Edge Functions, React 19, TypeScript, Vite, Vitest

## Global Constraints

- UI terminology is Royalty Points; internal member_points naming remains.
- Financial awards round down to whole points.
- Store awards exclude shipping.
- No redemption behavior or point-to-cash value.
- Historical donation backfill uses donations.member_id only and never guesses identity.
- Manual deductions cannot create a negative member balance.
- All mutations require finance authorization and audit records.
- Reuse the custom admin design system and Material Symbols; add no dependencies.

---

### Task 1: Canonical Royalty Points Database

**Files:**
- Create: supabase/migrations/20260712000000_royalty_points_automation.sql
- Test: supabase/tests/royalty_points_automation.sql

**Interfaces:**
- Produces tables royalty_points_settings and royalty_points_audit.
- Extends member_points with source_type, source_reference, and awarded_by.
- Produces RPCs award_royalty_points, get_royalty_points_admin, update_royalty_points_settings, and adjust_member_royalty_points.

- [ ] **Step 1: Write failing SQL assertions**

Assert that award_royalty_points gives floor(amount * rate), returns the same ledger row on a repeated source reference, rejects unpaid sources, and skips null members. Assert manual deductions reject a resulting negative balance and non-finance callers.

- [ ] **Step 2: Run the database test before the migration**

Run: supabase db test supabase/tests/royalty_points_automation.sql

Expected: failure because the Royalty Points RPCs do not exist.

- [ ] **Step 3: Add the migration**

Create the settings singleton with defaults referral_registration=50, referral_verification=25, store_per_ghs=1, monthly_dues_per_ghs=1, and donation_per_ghs=1. Add nullable source metadata columns to member_points and a unique partial index on (source_type, source_reference) where both are non-null.

Implement award_royalty_points(p_user_id uuid, p_source_type text, p_source_reference uuid, p_amount_ghs numeric default null) as SECURITY DEFINER. Accept store_purchase, monthly_dues, donation, referral_registration, and referral_verification; compute the configured award; insert once; and return the ledger row ID and points.

Implement finance-authorized settings, reporting, and adjustment RPCs. Each mutation inserts royalty_points_audit with auth.uid(), action, member, signed points, reason, and before/after settings where applicable.

Backfill verified or confirmed-paid donations with non-null member_id through the same ledger uniqueness key. Convert existing referral_awards into ledger entries without altering referral_awards.

- [ ] **Step 4: Run database tests**

Run: supabase db test supabase/tests/royalty_points_automation.sql

Expected: all Royalty Points SQL assertions pass.

---

### Task 2: Award Confirmed Payments and Referrals

**Files:**
- Modify: supabase/functions/hubtel-payment-callback/index.ts
- Modify: supabase/functions/hubtel-check-status/index.ts
- Modify: src/services/registrationService.ts
- Modify: src/services/memberService.ts
- Test: supabase/functions/hubtel-payment-callback/royalty-points.test.ts

**Interfaces:**
- Consumes: award_royalty_points RPC from Task 1.
- Produces idempotent award calls at every successful payment and referral transition.

- [ ] **Step 1: Write callback decision tests**

Cover donation, store_purchase, and monthly_dues success decisions, plus failed payments, missing member IDs, and repeated callback references.

- [ ] **Step 2: Run the focused tests before implementation**

Run: deno test supabase/functions/hubtel-payment-callback/royalty-points.test.ts

Expected: failure because award decisions are not wired.

- [ ] **Step 3: Add minimal award calls**

After each payment has atomically transitioned to paid, invoke award_royalty_points using the linked member UUID, source type, transaction row UUID, and qualifying GHS amount. Log award failures without changing the already-successful payment response.

Replace direct users.points referral increments with calls to the canonical award RPC while retaining referral_awards as the referral audit/idempotency source.

- [ ] **Step 4: Run focused tests**

Run: deno test supabase/functions/hubtel-payment-callback/royalty-points.test.ts

Expected: all Royalty Points callback tests pass.

---

### Task 3: Finance Service, Route, and Navigation

**Files:**
- Create: src/types/royaltyPoints.ts
- Create: src/services/royaltyPointsService.ts
- Modify: src/routes.tsx
- Modify: src/components/layouts/admin/AdminSidebar.tsx
- Test: src/test/royaltyPointsService.test.ts

**Interfaces:**
- Produces RoyaltyPointsSettings, RoyaltyPointsSummary, RoyaltyPointsMemberBalance, and RoyaltyPointsLedgerEntry.
- Produces royaltyPointsService.getAdminData(), updateSettings(), and adjustMemberPoints().
- Adds /admin/finance/royalty-points with the existing finance permission metadata.

- [ ] **Step 1: Write failing service tests**

Mock Supabase RPC calls and assert exact RPC names and payloads for loading, settings updates, positive adjustments, and negative adjustments.

- [ ] **Step 2: Run focused Vitest**

Run: npm run test:run -- src/test/royaltyPointsService.test.ts

Expected: failure because royaltyPointsService does not exist.

- [ ] **Step 3: Implement types and service**

Map RPC rows to camelCase types. Keep validation authoritative in PostgreSQL; surface RPC errors to the page.

- [ ] **Step 4: Add lazy route and Finance navigation item**

Lazy-load src/pages/admin/RoyaltyPoints.tsx. Add the Finance child labeled Royalty Points with Material Symbol workspace_premium and the same finance permission used by Finance Dashboard.

- [ ] **Step 5: Run focused Vitest**

Run: npm run test:run -- src/test/royaltyPointsService.test.ts

Expected: all service tests pass.

---

### Task 4: Finance Royalty Points Page

**Files:**
- Create: src/pages/admin/RoyaltyPoints.tsx
- Test: src/test/RoyaltyPoints.test.tsx

**Interfaces:**
- Consumes royaltyPointsService from Task 3.
- Produces the Finance management UI at /admin/finance/royalty-points.

- [ ] **Step 1: Write failing page tests**

Assert the page renders four KPI values, earning-rate fields, member balance search, source filter, ledger rows, and the manual adjustment dialog. Assert blank reasons and zero adjustments do not call the service.

- [ ] **Step 2: Run focused page tests**

Run: npm run test:run -- src/test/RoyaltyPoints.test.tsx

Expected: failure because the page does not exist.

- [ ] **Step 3: Implement the minimal page**

Use AdminPageHeader, TacticalKPI inside .kpis, .panel and .ph wrappers, compact desktop tables, mobile cards, .pill status/source badges, and Material Symbols. Use one modal for signed manual adjustments and one settings form for the five rates.

- [ ] **Step 4: Run focused page tests**

Run: npm run test:run -- src/test/RoyaltyPoints.test.tsx

Expected: all page tests pass.

---

### Task 5: Full Verification and Graph Refresh

**Files:**
- Update: graphify-out/GRAPH_REPORT.md
- Update: graphify-out/graph.json

- [ ] **Step 1: Run project validation**

Run: npm run typecheck

Run: npm run test:run

Expected: TypeScript succeeds and all Vitest tests pass.

- [ ] **Step 2: Refresh Graphify**

Run: graphify update .

Expected: the code graph rebuilds successfully.

- [ ] **Step 3: Review the final diff**

Run: git diff --check

Expected: no whitespace errors and no unrelated files.
