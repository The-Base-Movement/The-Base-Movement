# Donation Verification — Audit Report

**Date:** 2026-05-27  
**Scope:** Admin donation verification page — feature improvements + live-data sweep  
**Status:** Complete

---

## Changes Made

### 1. Live phone-history check (`DonationDetailSidebar.tsx`)

**Problem:** The "First donation from this phone" check was scoped to the currently loaded tab (e.g. Pending only). A donor with prior Verified donations would incorrectly appear as first-time.

**Fix:** Removed `donations: DonationDetail[]` prop from `DonationDetailSidebar`. Added `getDonationCountByPhone(phone, excludeId)` to `adminService.ts` which runs a cross-status `COUNT` query:

```ts
supabase
  .from('donations')
  .select('id', { count: 'exact', head: true })
  .eq('phone', phone)
  .neq('id', excludeId)
```

The component now shows "Checking…" while the query runs, "Review carefully" if count is 0, and "N previous" otherwise.

### 2. Automated vs Manual checks split (`DonationDetailSidebar.tsx`)

**Problem:** The checks list mixed automatable items (phone, reference format, prior history) with items that have no automated data source (name vs wallet holder, AML watchlist). The UI implied all checks were automated.

**Fix:** Split into two labelled sections:

- **Automated checks** — 3 items backed by live DB data: phone on record, reference format valid, prior donation count from this phone
- **Manual review required** — 2 permanently-manual items: name vs wallet holder, AML watchlist (note: no Ghanaian AML API is available for civilian use; officer must verify manually)

### 3. Filter button (`DonationVerification.tsx`)

**Problem:** The "Filters" button had no `onClick`, no state, and no associated UI. Clicking it did nothing.

**Fix:** Implemented a full filter panel with 4 dimensions:

| Dimension | Values                   |
| --------- | ------------------------ |
| Method    | All · MoMo · Card · Cash |
| Origin    | All · Local · Diaspora   |
| Amount    | Min / Max (GHS)          |
| Date      | From / To                |

The filter button turns gold (`btn-accent`) when any filter is active. An active-filter summary strip appears below the search bar showing which filters are on and how many results match. A "Clear all" link resets all filters.

---

## Live-Data Sweep

### Files Verified Clean (no hardcoded data)

| File                                     | Verdict | Notes                                                                                 |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `DonationVerification.tsx`               | ✅ Live | Stats from `adminService.getDonationStats()`; list from `adminService.getDonations()` |
| `DonationDetailSidebar.tsx`              | ✅ Live | All fields from `selectedDonation` prop + live DB phone count                         |
| `DonationsTable.tsx`                     | ✅ Live | Purely renders `filteredDonations` prop                                               |
| `ReceiptViewerModal.tsx`                 | ✅ Live | Renders `receiptUrl` prop as `<img>`; no data                                         |
| `DonationListCard.tsx`                   | ✅ Live | All fields from `DonationDetail` prop                                                 |
| `adminService.getDonationStats()`        | ✅ Live | `supabase.from('donations').select('amount, status')`                                 |
| `adminService.getDonations()`            | ✅ Live | Delegates to `donationService.getDonations()`                                         |
| `adminService.getDonationCountByPhone()` | ✅ Live | `COUNT` query across all statuses                                                     |

### Bug Fixed: `reference` field was UUID-derived, not DB-sourced

**Finding:** `donationService.getDonations()` and 3 other methods all used `d.id.substring(0, 8)` as the `reference` value — ignoring the actual `reference` column in the `donations` table.

**DB check:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'donations'` confirmed a `reference text NULLABLE` column exists.

**Fix applied** (`donationService.ts`) — 5 call sites updated:

- `getDonations()` — line 56
- `getPublicDonationFeed()` — line 259
- `getMemberDonations()` — line 288
- `subscribeToPublicDonations()` (INSERT handler) — line 325
- `subscribeToPublicDonations()` (UPDATE handler) — line 365

All now use: `d.reference ?? d.id.substring(0, 8).toUpperCase()`  
The UUID fallback is kept for legacy rows where `reference` is null.

### Intentionally Redacted Fields (not hardcoded data)

`getPublicDonationFeed()` and `subscribeToPublicDonations()` map `phone: ''`, `country: ''`, `receiptUrl: ''`, `campaignId: ''`, `memberId: ''`. These are privacy redactions for the member-facing public donation feed — correct as-is.

---

## Files Changed

| File                                                             | Change                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/services/donationService.ts`                                | Fixed `reference` field in 5 map callbacks to read from DB column                          |
| `src/services/adminService.ts`                                   | Added `getDonationCountByPhone()`; added fire-and-forget `send-donation-receipt` on verify |
| `src/pages/admin/donationverification/DonationDetailSidebar.tsx` | Removed `donations` prop; live phone count; split auto/manual checks                       |
| `src/pages/admin/DonationVerification.tsx`                       | Removed `donations` prop pass; added full filter panel (method, origin, amount, date)      |

---

## Design Tokens (noted for future touch)

- `DonationListCard.tsx:125` — `borderRadius: 3` should be `var(--radius-xs)` per token audit
- `ReceiptViewerModal.tsx` — two hardcoded radius values (`8` and `4`) not yet migrated
