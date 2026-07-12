# Royalty Points Automation Design

## Goal

Create one auditable Royalty Points system that automatically rewards members for referrals, paid store purchases, paid monthly dues, and paid donations, with finance-officer management under the admin Finance section.

## Terminology

The product UI uses **Royalty Points**. Existing internal member_points naming remains to avoid unnecessary schema churn.

## Earning Rules

- Referral registration: 50 points.
- Referral verification: 25 points.
- Store purchases: 1 point per GH₵1 of paid merchandise subtotal, excluding shipping.
- Monthly dues: 1 point per GH₵1 successfully paid.
- Donations: 1 point per GH₵1 successfully paid.
- Financial awards round down to whole points.
- Anonymous or unlinked financial transactions earn no points.
- Failed, pending, cancelled, or unpaid transactions earn no points.
- Redemption and monetary value are out of scope.

## Architecture

member_points is the canonical signed ledger. Each entry records the member, signed point amount, source type, source reference, reason, and timestamp. A database uniqueness constraint on source type and reference makes awards idempotent.

A security-definer database RPC owns award calculation and insertion. Payment callbacks invoke it only after a store order, monthly-dues payment, or donation reaches its confirmed paid state. Referral RPCs also write into the same ledger while preserving their existing duplicate-award protection.

Rates live in a single database settings row with defaults matching the earning rules above. Finance officers can update future earning rates; rate changes never recalculate historical awards.

## Finance Management Page

Add /admin/finance/royalty-points under the existing Finance navigation. The page contains:

- KPI totals for points issued, members with balances, points issued this month, and manual adjustments.
- Configurable referral and per-GH₵ earning rates.
- Searchable member balances.
- Searchable and filterable point transaction ledger.
- Manual add or deduct action with member selection, non-zero whole-point amount, and mandatory reason.

The page reuses the existing admin design system, Material Symbols, responsive table/card patterns, and finance navigation conventions.

## Authorization and Audit

Finance-page access and all mutations require the existing finance permission system. Database RPCs verify the caller's admin finance permission rather than trusting page visibility.

Every rate change and manual adjustment records the acting administrator, timestamp, previous/new values or signed adjustment, member, and reason. Members may read only their own ledger entries. Finance-authorized admins may read the management views.

## Error Handling

- Duplicate payment callbacks return the existing award without inserting again.
- Missing member links return a no-award result without failing payment processing.
- Point-award failures are logged and do not reverse a successful financial payment.
- Manual deductions cannot reduce a member below zero.
- Invalid rates, zero adjustments, and blank reasons are rejected by the database.

## Existing Data

Existing member_points rows remain valid. Existing referral awards are migrated into the canonical ledger only when a matching canonical entry does not already exist. Existing paid financial transactions are not backfilled automatically in this release to avoid issuing unexpected historical balances.

## Verification

Tests cover each earning source, rate rounding, anonymous transactions, duplicate callbacks, referral idempotency, permission rejection, audit records, invalid adjustments, and insufficient balances. Run TypeScript checks, the relevant Vitest tests, and Supabase database tests before handoff.
