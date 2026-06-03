# Audit: Executive Dashboard & Finance Approval Chain

**Date:** 2026-06-03  
**Branch:** `feat/executive-dashboard-finance-approval-chain`  
**PR:** [#3](https://github.com/Styphler17/The-Base-Movement/pull/3)  
**Status:** Open — awaiting review

---

## 1. Scope of Work

This audit covers five discrete feature areas delivered in a single branch:

1. Executive role permissions & nav filtering
2. Executive Dashboard page
3. Finance Review Inbox (extracted subpage)
4. 3-tier fund approval chain with visual tracker
5. Administrator Roster role filter

---

## 2. Database Changes

### `finance_requests` table

| Change     | SQL                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------- |
| New column | `ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS approval_tier integer NOT NULL DEFAULT 1;` |

`approval_tier` tracks which tier currently holds a pending request (1 = Finance Officer, 2 = Executives, 3 = Founder/Appointed). Value increments on each Acknowledge action. Only `status = 'Pending'` rows are eligible for acknowledgement.

### `site_settings` table — new keys seeded

| Key                 | Default value | Purpose                                       |
| ------------------- | ------------- | --------------------------------------------- |
| `finance_tier1_max` | `50`          | GHS ceiling for Bottom tier (Finance Officer) |
| `finance_tier2_max` | `100`         | GHS ceiling for Middle tier (Executives)      |

Both keys are upserted with `ON CONFLICT (key) DO NOTHING` — existing custom values are preserved.

---

## 3. Permission System Changes

### `src/types/admin.ts`

**15 new `action` values added to `AdminPermission`:**

```
VIEW_FINANCE · VIEW_WAR_ROOM · VIEW_DEPLOYMENT_METRICS · VIEW_CONSTITUENCY_OPS
VIEW_POLLING_STATIONS · VIEW_MASS_MOBILIZATION · VIEW_DIRECTIVES · VIEW_DEPLOY_ASSET
VIEW_STRATEGIC_FOCUS · VIEW_POLLS · VIEW_MISSION_PLAN · VIEW_ROADMAP
VIEW_PARTY_OFFICIALS · VIEW_ADMINS · VIEW_MEMBER_DIRECTORY
```

**5 new `resource` values added:**

```
FINANCE · OPERATIONS · STRATEGY · PARTY · ADMINS
```

### `src/pages/admin/RolesManager.tsx`

New permission groups added to the UI catalogue:

- **Members** — `VIEW_MEMBER_DIRECTORY` (view-only, prepended before VERIFY/DELETE)
- **Polls** — `VIEW_POLLS` (read-only, prepended before MANAGE_POLLS)
- **Finance** — `VIEW_FINANCE`
- **Operations** — `VIEW_WAR_ROOM`, `VIEW_DEPLOYMENT_METRICS`, `VIEW_CONSTITUENCY_OPS`, `VIEW_POLLING_STATIONS`, `VIEW_MASS_MOBILIZATION`, `VIEW_DIRECTIVES`, `VIEW_DEPLOY_ASSET`
- **Strategy** — `VIEW_STRATEGIC_FOCUS`, `VIEW_MISSION_PLAN`, `VIEW_ROADMAP`
- **Party & Administration** — `VIEW_PARTY_OFFICIALS`
- **Admins (Read-Only)** — `VIEW_ADMINS`

### EXECUTIVE role (created in Supabase)

```sql
INSERT INTO admin_roles (name, description, is_system)
VALUES ('EXECUTIVE', 'Senior party executive with oversight access', false);
```

15 permissions inserted into `admin_role_permissions`:

| Action                  | Resource   |
| ----------------------- | ---------- |
| VIEW_FINANCE            | FINANCE    |
| VIEW_WAR_ROOM           | OPERATIONS |
| VIEW_DEPLOYMENT_METRICS | OPERATIONS |
| VIEW_CONSTITUENCY_OPS   | OPERATIONS |
| VIEW_POLLING_STATIONS   | OPERATIONS |
| VIEW_MASS_MOBILIZATION  | OPERATIONS |
| VIEW_DIRECTIVES         | OPERATIONS |
| VIEW_DEPLOY_ASSET       | OPERATIONS |
| VIEW_STRATEGIC_FOCUS    | STRATEGY   |
| VIEW_POLLS              | POLLS      |
| VIEW_MISSION_PLAN       | STRATEGY   |
| VIEW_ROADMAP            | STRATEGY   |
| VIEW_PARTY_OFFICIALS    | PARTY      |
| VIEW_ADMINS             | ADMINS     |
| VIEW_MEMBER_DIRECTORY   | MEMBERS    |

---

## 4. Files Created

| File                                                          | Purpose                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/pages/admin/ExecutiveDashboard.tsx`                      | Executive Dashboard page at `/admin/executive`                            |
| `src/pages/admin/FinanceReviewInbox.tsx`                      | Review Inbox subpage at `/admin/finance-requests/review-inbox`            |
| `src/pages/admin/settings/components/FinanceApprovalsTab.tsx` | Finance Approvals settings tab                                            |
| `src/lib/fundApproval.ts`                                     | Pure fund approval rule engine                                            |
| `src/pages/admin/administrators/roleFilterOptions.ts`         | Role filter options constant (split from component for ESLint compliance) |

---

## 5. Files Modified

| File                                                 | What changed                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/admin.ts`                                 | +15 action types, +5 resource types to `AdminPermission`                                                                                                                  |
| `src/pages/admin/RolesManager.tsx`                   | +7 permission groups rendered in modal                                                                                                                                    |
| `src/components/layouts/AdminLayout.tsx`             | `EXECUTIVE_ALLOWED_PATHS` constant; `executiveOnly` nav flag; nav item for Executive Dashboard; review inbox added to both allowlists; filtering logic for EXECUTIVE role |
| `src/routes.tsx`                                     | Routes added: `/admin/executive`, `/admin/finance-requests/review-inbox`                                                                                                  |
| `src/services/financeService.ts`                     | `approval_tier` field on `FinanceRequest` interface; `acknowledgeRequest()` method                                                                                        |
| `src/pages/admin/FinanceRequests.tsx`                | Review Inbox panel/modal removed; `FinanceSubNav` tabs added; header action button for reviewers                                                                          |
| `src/pages/admin/Settings.tsx`                       | `'finance'` tab type added; `FinanceApprovalsTab` import + render                                                                                                         |
| `src/pages/admin/Administrators.tsx`                 | `roleFilter` state; `filteredAdmins` memo extended with role match                                                                                                        |
| `src/pages/admin/administrators/AdminsSearchBar.tsx` | Role filter dropdown + clear button; props extended                                                                                                                       |

---

## 6. Feature Detail

### 6.1 Executive Dashboard (`/admin/executive`)

- 3 KPI tiles: Requested Funds (total), Approved Funds, Rejected Funds — all sourced live from `finance_requests`
- Quick-access link grid to 6 key pages (Finance Requests, Finance Dashboard, War Room, Deployment Metrics, Strategic Focus, Mission Roadmap)
- Nav item `corporate_fare` icon; visible to EXECUTIVE, SUPER_ADMIN, FOUNDER

### 6.2 Executive Nav Filtering

Role `EXECUTIVE` sees only the 18 paths in `EXECUTIVE_ALLOWED_PATHS`. All other nav items are hidden. Pattern mirrors the existing `FINANCE_OFFICER` allowlist.

`executiveOnly: true` flag on the Executive Dashboard nav item hides it from non-executive roles (except SUPER_ADMIN and FOUNDER for admin access).

### 6.3 Finance Review Inbox (`/admin/finance-requests/review-inbox`)

Extracted from the bottom panel of Finance Requests. Additions over the original:

- **KPI strip**: Pending / Approved / Rejected counts at the top
- **"Awaiting Your Decision"** panel: only shows requests at the current user's tier
- **"In Progress — Other Tiers"** panel: pending requests not yet at the user's tier (visible, not actionable), opacity 0.75
- **Per-request chain tracker**: 3-node horizontal stepper; active node glows green with "Awaiting" badge; past nodes show filled checkmark; future nodes muted
- **Resolved history table**: all actioned requests with requester, type, amount, status, tier resolved at, date, officer comment
- **Sub-nav tabs**: Finance Requests · Review Inbox (with gold pending badge)
- **Access guard**: non-reviewers see a lock message

### 6.4 Fund Approval Rule Engine (`src/lib/fundApproval.ts`)

Pure function — no side effects, no imports.

```
processFundRequest(tier, amount, action, tier1Max?, tier2Max?)
  → { outcome: ApprovalOutcome, message: string }
```

| Outcome               | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| `PROCESSED_BOTTOM`    | Finance Officer approved/denied within ceiling |
| `PROCESSED_MIDDLE`    | Executive approved/denied within ceiling       |
| `PROCESSED_TOP`       | Founder/Appointed approved/denied (no ceiling) |
| `PASS_UP`             | Acknowledged — move to next tier               |
| `ERROR_NOT_QUALIFIED` | Bottom tier attempted approve above ceiling    |
| `ERROR_NEEDS_TOP`     | Middle tier attempted approve above ceiling    |
| `ERROR_INVALID`       | No rule matched                                |

`isPermitted(outcome)` and `isPassUp(outcome)` helper predicates used by the UI to gate DB writes.

Role → tier mapping in the inbox:
| DB Role | Tier |
|---|---|
| `FINANCE_OFFICER` | Bottom (1) |
| `EXECUTIVE`, `ORGANIZER` | Middle (2) |
| `SUPER_ADMIN`, `FOUNDER`, `ADMIN` | Top (3) |

### 6.5 Finance Approvals Settings Tab (`/admin/settings?tab=finance`)

- 3 tier cards with brand-color left bars matching the chain tracker
- Live GHS range badge updates as the user types (reactive to `tier1Max`/`tier2Max` state)
- Tier 1 & 2: GHS-prefixed number inputs
- Tier 3: "No ceiling — unlimited" display
- Validates: Tier 1 must be > 0; Tier 2 must exceed Tier 1
- Saves both thresholds in a single `Promise.all` to `site_settings`

### 6.6 Administrator Roster Role Filter

Dropdown with 13 display labels mapped to DB `AdminRole` values:

| Display               | DB value                 |
| --------------------- | ------------------------ |
| Admin                 | `ADMIN`                  |
| Chapter Leader        | `ORGANIZER`              |
| Chapter Secretary     | `REGIONAL_CORRESPONDENT` |
| Authors               | `CHIEF_EDITOR`           |
| Communication Officer | `SENIOR_EDITOR`          |
| Finance Officer       | `FINANCE_OFFICER`        |
| Constituency Lead     | `CONSTITUENCY_LEAD`      |
| Field Agent           | `VERIFIER`               |
| Founder               | `FOUNDER`                |
| IT Manager            | `SUPER_ADMIN`            |
| Movement Leader       | `EXECUTIVE`              |
| Store Manager         | `EDITOR`                 |
| Youth Leader          | `JUNIOR_EDITOR`          |

Filtering is computed in `useMemo` — updates on every state change with no network call or page reload. Active filter highlights the dropdown border green. "Clear ×" pill appears when a filter is active.

---

## 7. ESLint Fix

The initial commit was blocked by `react-refresh/only-export-components` — ESLint disallows exporting non-component values (`ROLE_FILTER_OPTIONS`) from a `.tsx` component file. Fixed by moving the constant to `roleFilterOptions.ts` and importing it from there.

---

## 8. Known Constraints & Phase Notes

- **Phase 1 only**: Executive nav filtering uses a path allowlist (same pattern as Finance Officer). Future phases should migrate to permission-based filtering driven by the `VIEW_*` permissions already assigned to the role.
- **Approval thresholds are loaded at inbox mount**: Changes in settings take effect on next page load, not live. No real-time subscription wired.
- **`acknowledgeRequest` is not idempotent**: Calling it twice on the same request would push `approval_tier` to 3 then beyond. RLS or a DB constraint should be added if concurrent reviews become a risk.
- **`REGIONAL_DIRECTOR` not mapped** to Middle tier intentionally — it was not included in the Executive role spec. Revisit if regional directors need inbox access.
