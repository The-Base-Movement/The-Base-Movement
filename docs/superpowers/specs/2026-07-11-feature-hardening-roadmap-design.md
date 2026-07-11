# Feature Hardening Roadmap — Design Spec

**Date:** 2026-07-11  
**Status:** Approved for implementation planning

## Goal

Prioritize improvements across eight existing feature areas without rebuilding working systems. Protect money and sensitive member data first, then improve mobilization, commerce, and internal operations.

## Decision

Use a risk-first sequence:

1. Trust — donations, receipts, and admin permission boundaries.
2. Mobilization — constituencies, push notifications, and newsletters.
3. Commerce — storefront payment, inventory, and fulfilment consistency.
4. Operations — helpdesk consolidation and asset reconciliation.

Each workstream starts with verification of the current flow. Add UI, schema, services, or dependencies only when a verified gap cannot be fixed within an existing component, service, RPC, policy, or Edge Function.

## Existing Baseline

All selected areas already have substantial implementations:

| Area | Existing foundation | Primary gap to investigate |
|---|---|---|
| Donations and receipts | Payment initiation, verification, receipts, reminders, reporting | Reconciliation, webhook idempotency, recovery, audit completeness |
| Membership and constituencies | Ghana/Diaspora split, assignment, leader hubs, routes, services | Assignment integrity, stale leadership data, scoped access |
| Admin permissions | Role catalog, provisioning, RLS, device controls, tests | One authoritative permission matrix and boundary coverage |
| Push notifications | Subscriptions, client hook, service worker, sender, triggers | Delivery visibility, stale subscription cleanup, preferences |
| Newsletter | Composer, audiences, scheduler, unsubscribe, analytics | Consent evidence, suppression, retry and delivery reconciliation |
| Storefront | Catalog, product pages, cart, checkout, orders, inventory | Concurrent stock safety and payment/fulfilment consistency |
| Helpdesk | Ticket schema, comments, departments, email, member/admin UI | Overlap between IT and general helpdesk paths; attachment access |
| Asset inventory | Assets, assignments, requests, alerts, QR, depreciation | Operational reconciliation and real-world usage validation |

## Workstream 1 — Trust

### Donations and receipts

- Trace one successful, failed, cancelled, duplicated, and delayed payment from browser through Hubtel callback to receipt availability.
- Make callback processing idempotent using the existing provider reference and donation record.
- Ensure status changes and manual approvals have actor, timestamp, and reason evidence.
- Keep raw card data outside the platform and preserve signed callback verification.
- Provide safe retry or reconciliation for paid transactions whose receipt generation failed.

### Admin permissions

- Derive one matrix from the existing role catalog, route guards, service checks, and RLS policies.
- Test sensitive actions: member data, national ID RPC, donations, exports, newsletters, store administration, helpdesk attachments, and assets.
- Fix enforcement at the shared boundary closest to the data, preferring RLS or RPC checks over page-only hiding.
- Preserve current session-storage and privileged-device controls.

### Completion criteria

- Duplicate callbacks cannot duplicate financial effects.
- Every privileged financial action is attributable.
- Sensitive actions fail for unauthorized roles at the backend boundary.
- Receipt failure can be detected and safely recovered.

## Workstream 2 — Mobilization

### Constituencies

- Reconcile member assignment with the 275-constituency source data.
- Verify Ghana members use constituencies and Diaspora members use chapters.
- Detect missing or stale leader assignments without exposing member PII.
- Keep public counts aggregate and server-derived.

### Push notifications

- Respect explicit user opt-in and stored preferences before every send.
- Remove expired subscriptions after terminal provider responses.
- Record aggregate send outcomes without storing unnecessary message-level PII.
- Limit retries and keep deep links restricted to valid application routes.

### Newsletter

- Preserve consent and unsubscribe evidence.
- Apply suppression before audience dispatch.
- Reconcile queued, sent, partially failed, and failed campaigns.
- Prevent duplicate dispatch when scheduler or administrator retries overlap.

### Completion criteria

- Membership assignment rules are consistent across public, member, and admin surfaces.
- Opted-out recipients are excluded from push and email sends.
- Administrators can distinguish complete, partial, and failed delivery.

## Workstream 3 — Commerce

- Confirm stock is reserved or decremented atomically at the existing checkout boundary.
- Prevent duplicated payment callbacks from duplicating orders or stock movement.
- Reconcile payment status, order status, inventory movement, and fulfilment audit history.
- Preserve guest-order access through the existing scoped RPC.
- Defer ratings, search enhancements, and new merchandising features until transaction integrity is verified.

### Completion criteria

- Concurrent checkout cannot oversell tracked stock.
- Payment retries cannot create duplicate orders.
- Every fulfilment state change is attributable and reversible where operationally safe.

## Workstream 4 — Operations

### Helpdesk

- Map IT tickets and general helpdesk tickets to determine whether both paths remain necessary.
- Prefer a shared department and permission model; migrate or remove duplication only with evidence that records and workflows are preserved.
- Verify submitter, handler, comment, and attachment access at the database and storage boundaries.

### Asset inventory

- Reconcile asset, assignment, request, maintenance, and alert states.
- Validate check-in/check-out behavior against actual operational use.
- Keep QR labels and depreciation calculations as existing capabilities; add no new modules until a measured gap appears.

### Completion criteria

- Ticket ownership and attachment access match department permissions.
- Assets cannot be simultaneously assigned through conflicting active records.
- Overdue, missing, and maintenance states are derived consistently.

## Error Handling and Observability

- Use existing Sentry and audit facilities for unexpected failures and privileged actions.
- Expose actionable administrator states rather than raw provider or database errors.
- Keep retries bounded and idempotent.
- Never log secrets, payment credentials, national IDs, or unnecessary member PII.

## Verification Strategy

For each workstream:

1. Document the current end-to-end flow and trust boundaries.
2. Add the smallest regression check that demonstrates each confirmed gap.
3. Apply the fix at the shared root boundary.
4. Run targeted tests and typecheck; run the build for cross-surface or deployment changes.
5. Verify relevant browser behavior only where rendered interaction matters.

## Delivery Boundaries

- Plan and deliver one workstream at a time.
- Workstream 1 must complete before changes that increase payment or privileged-data traffic.
- No new UI library, auth system, payment processor, notification provider, or state framework.
- No broad refactor of `AdminService`; extract or consolidate only when required by a verified feature gap.
- Donation and store changes require compliance review before production deployment.

## Deferred Work

- New storefront ratings or merchandising features.
- New asset modules.
- Custom notification infrastructure.
- A new permission framework.
- Consolidation performed only for architectural neatness.

These become candidates only after production evidence shows the existing implementation cannot meet an approved requirement.
