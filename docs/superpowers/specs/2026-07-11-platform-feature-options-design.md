# Platform Feature Implementation Options — Design Spec

**Date:** 2026-07-11  
**Status:** Approved portfolio design

## Goal

Improve the existing platform without rebuilding working systems. Sequence work by risk: protect privileged data and money first, then strengthen mobilization, commerce, operations, growth, and intelligence.

## Portfolio Decision

Use a risk-first programme:

1. Trust — admin permission boundaries. Donation and receipt hardening is already implemented.
2. Mobilization — constituency integrity, push delivery visibility, and newsletter consent/recovery.
3. Commerce — atomic checkout, inventory reservation, payment idempotency, and fulfilment reconciliation.
4. Operations — gradual helpdesk convergence and database-enforced asset custody.
5. Growth — safe referrals, transaction history, payment recovery, and SMS reliability.
6. Intelligence — explainable operational analytics with strict limits on political profiling.

Each phase verifies the current end-to-end flow before changing it. Reuse existing services, RPCs, Edge Functions, policies, tables, and UI patterns. Add no new provider or framework unless production evidence shows the existing approach cannot meet an approved requirement.

## Phase 1 — Trust

### Admin permissions

Three approaches were considered:

- **Boundary coverage matrix — selected.** Keep the existing role catalog and test each sensitive operation across UI visibility, route access, services, Edge Functions, RPC grants, and RLS.
- **Database-authoritative permissions.** Centralizes runtime permissions but adds migration, availability, and session-refresh complexity.
- **Signed permission claims.** Reduces reads but creates stale-claim risk and is unsuitable as the sole authority for immediate revocation.

Create one table-driven regression matrix covering member records, national IDs, donations, reports, exports, newsletters, notifications, store administration, helpdesk attachments, and assets. Fix verified mismatches at the closest backend boundary. Preserve privileged-device controls, session-storage behavior, and the admin-gated national-ID RPC.

### Completion criteria

- Unauthorized roles fail at the backend when UI controls are bypassed.
- National-ID access, exports, financial actions, and administrative overrides are attributable.
- No new permission framework is introduced without measured maintenance failure in the current catalog.

## Phase 2 — Mobilization

### Constituency integrity

Keep `users.constituency` as the current assignment source. Validate assignments against `ghana_constituencies` through a database constraint or secured RPC and provide reconciliation for missing, invalid, and stale assignments. Ghana members use constituencies; Diaspora members use chapters. Introduce assignment history only if transfers become an operational requirement.

### Push notifications

Keep the existing Web Push/VAPID implementation. Add an aggregate delivery ledger recording intended, sent, expired, and failed counts. Apply preferences before every dispatch, remove terminal subscriptions, bound retries, and restrict deep links to valid application routes. Do not store unnecessary recipient-level engagement histories.

### Newsletter

Extend the existing campaign flow to `draft → queued → sending → sent | partial | failed`. Claim a campaign atomically so scheduler and administrator retries cannot dispatch it twice. Apply consent, unsubscribe, and suppression rules before each batch. Keep Supabase as audience authority and SendGrid as delivery provider.

### Shared audience boundary

Use one normalized audience resolver for region, constituency, chapter, and role targeting. Push and newsletters consume the same targeting rules but retain independent channel preferences and consent evidence.

### Completion criteria

- Ghana and Diaspora assignment models cannot silently cross.
- Invalid assignments are detectable without exposing member PII.
- Opted-out recipients are excluded at dispatch time.
- Administrators can distinguish complete, partial, failed, expired, and suppressed outcomes.

## Phase 3 — Commerce

### Selected approach: transactional checkout RPC

Create one Postgres transaction that locks requested products, validates authoritative prices and stock, creates the pending order and line items, reserves inventory, and returns the order reference for Hubtel initiation.

The signed callback locks the order and applies one terminal payment transition. Successful payment commits the stock movement; failed or expired payment releases the reservation. Conditional service-layer checks alone are rejected because concurrent requests can oversell multi-item orders. Moving to an external commerce platform is deferred because it would split member identity and Ghana-specific payment operations.

Keep payment, order, and inventory state distinct:

- Payment: `Unpaid`, `Paid`, `Failed`, `Refunded`.
- Order: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
- Inventory: `Reserved`, `Committed`, `Released`, `Adjusted`.

Provide reconciliation for paid orders with uncommitted stock, stale reservations, and impossible status combinations. Preserve guest-order access through its existing scoped lookup. Require actor and reason evidence for refunds, cancellations, adjustments, and fulfilment reversals.

### Completion criteria

- Concurrent checkout cannot oversell tracked stock.
- Duplicate callbacks cannot duplicate orders or inventory effects.
- Manual corrections are attributable and operationally reversible where safe.

## Phase 4 — Operations

### Helpdesk

Use shared authorization with gradual migration. Keep legacy IT tickets readable while routing new IT tickets into the general department-based helpdesk. Align role, status, comment, notification, and attachment rules before migrating historical records.

Helpdesk attachments must use a private Storage bucket. Generate short-lived signed URLs only after verifying the requester can view the parent ticket. Internal comments remain handler-only. Avoid deleting tickets; closure preserves history.

Immediate consolidation is rejected because it risks losing comments and references. Permanent separate systems are rejected because they duplicate permissions and reporting indefinitely.

### Asset inventory

Add a partial unique constraint allowing one active assignment per asset. Use transactional RPCs for checkout, check-in, request approval, condition changes, and missing-asset escalation. A service-layer preflight alone is insufficient under concurrency. A full custody-event rewrite is deferred because existing assignment and maintenance tables are adequate once their invariants are enforced.

### Completion criteria

- New helpdesk writes no longer deepen the legacy split.
- Ticket ownership, internal comments, and attachments follow department permissions.
- Assets cannot have conflicting active assignments.
- Overrides and exceptional states record actor, reason, and timestamp.

## Phase 5 — Growth

### Referrals

Use one-level, idempotent referral rewards backed by unique award events. Show members their own referrals and totals. Public leaderboards must be opt-in or pseudonymous because recruitment activity reveals political participation. Multi-level rewards and monetary redemption are out of scope.

### Member transaction history

Expose a secured, read-only timeline that normalizes owned donations and store orders without copying them into a second financial table. Each item links to its existing receipt or order detail.

### Failed-payment recovery

Show the current state, existing internal reference, a safe new payment attempt, and a support path that carries only the internal donation/order ID. Never reuse a completed provider transaction or duplicate the underlying record. Do not automatically retry payments that require active user authorization.

### SMS

Harden the existing MNotify-oriented `sendSms` integration. Add explicit consent, channel preferences, Ghana/Diaspora number normalization, bounded batches, suppression, provider callbacks, aggregate delivery metrics, and terminal-failure handling. Add a second provider only after measured outages justify the duplicate-delivery and operational complexity.

### Completion criteria

- Referral awards cannot duplicate and do not unnecessarily expose political participation.
- Members can understand donation and order history from one secured surface.
- Failed payments recover without duplicate financial records.
- SMS respects consent and exposes actionable aggregate delivery outcomes.

## Phase 6 — Intelligence

### Selected approach: operational analytics first

Use existing Supabase views, RPCs, reports, and KPI patterns for registration, verification backlog, constituency coverage, financial reconciliation, delivery outcomes, inventory, fulfilment, helpdesk, and asset exceptions.

Apply minimum group-size thresholds and data minimization. Every metric shows its definition, source period, sample size, and freshness. Exports inherit source permissions and audit requirements.

The Python ML service is optional and receives only scoped, minimized aggregates. Its endpoints must require service authentication before further use. Limited forecasting may later support aggregate stock, support-volume, or membership planning after the underlying metrics are trustworthy.

Individual donation likelihood, mobilization potential, sentiment, influence, or voter-propensity scoring is not approved. Such models combine sensitive political, location, identity, donation, and engagement data and require separate legal, ethical, security, and leadership review.

### Completion criteria

- Operational decisions use explainable, traceable metrics.
- Sensitive ML endpoints are authenticated.
- No automated adverse action or messaging is triggered by prediction.
- Analytics datasets exclude national IDs, raw contact details, and unnecessary message content.

## Shared Error Handling and Observability

- Use existing Sentry and audit facilities.
- Return actionable administrator states instead of raw provider or database errors.
- Bound every retry and make financial, dispatch, and assignment operations idempotent.
- Never log secrets, payment credentials, national IDs, or unnecessary member PII.
- Keep risky changes reversible and verify migrations against representative data before production use.

## Verification Strategy

For every implementation slice:

1. Trace the current end-to-end flow and trust boundaries.
2. Add the smallest regression check demonstrating the confirmed gap.
3. Fix the shared root boundary rather than individual callers.
4. Run targeted tests and typecheck; run the build for routing or cross-surface changes.
5. Use browser verification only for rendered interaction and responsive behavior.
6. Require compliance review for donation and store production changes.

## Delivery Sequence

Deliver one independently reviewable plan at a time:

1. Admin permission coverage.
2. Constituency assignment integrity.
3. Push delivery visibility and preference enforcement.
4. Newsletter idempotency, consent, and reconciliation.
5. Store checkout and inventory atomicity.
6. Helpdesk access and gradual convergence.
7. Asset assignment integrity.
8. Referrals and private member progress.
9. Unified member transaction history and payment recovery.
10. SMS consent and delivery reconciliation.
11. ML endpoint authentication and operational analytics governance.

This order can change only when a production incident or compliance requirement raises another item to P0/P1.
