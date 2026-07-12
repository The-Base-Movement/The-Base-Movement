# Monthly Dues System Design

## Goal

Add a complete monthly-dues system beside member donations. Finance officers configure the dues policy and monitor collection. Members may enroll, pay one month manually through Hubtel Checkout, enable Hubtel recurring invoices, opt out, control reminder consent, review history, and export their records.

## Scope

This design includes:

- member enrollment and opt-out;
- one-time and recurring Hubtel payments;
- separate email and SMS consent with append-only history;
- finance settings, operations, analytics, search, filtering, and exports;
- member analytics and donation/dues exports;
- automated reminders and delivery deduplication;
- payment receipts, callback reconciliation, and auditability;
- local-currency display with GHS settlement and reporting.

It does not introduce a generic payment-provider framework. Hubtel is the only provider. Recurring enrollment remains disabled until production credentials and callback configuration pass compliance testing.

## Confirmed Product Rules

- The finance officer sets one base monthly amount in GHS.
- The finance officer sets one due day and one grace-period end day for all enrolled members.
- Diaspora members see the converted equivalent in their country currency; Hubtel and finance reporting use GHS.
- Exchange-rate details are snapshotted on each monthly charge so historical figures do not change later.
- Members can pay a single month with the existing one-time Hubtel checkout.
- Members can separately enroll in Hubtel Recurring Invoice.
- Enrollment and recurring payment are voluntary and may be cancelled by the member.
- Email and SMS reminder consent are independent.
- Consent changes are append-only and timestamped.
- Reminder schedule is three days before due, on the due date, and three days overdue.
- Reminders stop after payment, opt-out, or channel-consent withdrawal.
- Opting out cancels the Hubtel recurring invoice but never deletes payment or consent history.
- Hubtel callbacks, not the browser, determine successful payment.

## Existing Patterns to Reuse

- Existing Hubtel initiation, signed callbacks, status handling, checkout modal, and GHS settlement.
- Existing country-to-currency mapping and configured GHS exchange-rate conversion.
- Existing donation receipt access patterns and transactional email/SMS helpers.
- Existing `MANAGE_DONATIONS:DONATIONS` finance permission boundary.
- Existing finance dashboard cards, charts, tables, filters, responsive fallbacks, and export conventions.
- Existing member Profile Settings notification area.

## Data Model

### `monthly_dues_settings`

Singleton active policy:

- `id`
- `amount_ghs`
- `due_day` (1-28)
- `grace_period_days`
- `recurring_enrollment_enabled`
- `policy_version`
- `effective_from`
- `updated_by`
- timestamps

Only an authorized finance administrator may write. Authenticated members may read the currently effective public payment terms through a restricted view or RPC.

### `monthly_dues_enrollments`

One current enrollment per member:

- `id`
- `member_id` (unique)
- `status`: `active`, `opted_out`, `pending_activation`, `cancellation_pending`
- `payment_mode`: `manual`, `recurring`
- `hubtel_invoice_id` / provider reference
- `enrolled_at`
- `opted_out_at`
- `provider_cancelled_at`
- timestamps

Enrollment state changes must run through server-authorized operations. A member can only change their own enrollment.

### `monthly_dues_consents`

Append-only consent evidence:

- `id`
- `member_id`
- `email_enabled`
- `sms_enabled`
- `dues_enrollment_enabled`
- `recurring_payment_authorized`
- `policy_version`
- `source`: `enrollment`, `profile_settings`, `opt_out`, `admin_correction`
- `recorded_at`

The latest row is the current preference. Rows are never updated or deleted through the client.

### `monthly_dues_payments`

One obligation/payment row per member and dues month:

- `id`
- `member_id`
- `dues_month`
- `due_date`
- `amount_ghs`
- `display_amount`
- `display_currency`
- `exchange_rate_to_ghs`
- `payment_mode`: `manual_hubtel`, `recurring_hubtel`, `offline`
- `status`: `due`, `pending`, `paid`, `failed`, `overdue`, `waived`, `cancelled`
- `hubtel_reference`
- `provider_transaction_id`
- `paid_at`
- `verified_by`
- `verification_notes`
- receipt fields and timestamps

A unique constraint on `(member_id, dues_month)` prevents duplicate obligations. Provider transaction identifiers are unique where present.

### `monthly_dues_reminders`

Delivery ledger:

- `id`
- `payment_id`
- `member_id`
- `channel`: `email`, `sms`
- `reminder_stage`: `pre_due`, `due`, `overdue`
- `status`: `queued`, `sent`, `failed`, `skipped`
- `provider_reference`
- `attempted_at`
- `failure_reason`

A unique constraint on `(payment_id, channel, reminder_stage)` prevents duplicate sends.

## Security and Permissions

- Enable RLS on every exposed table.
- Members may read only their own enrollment, consent, payments, reminders, and receipts.
- Members may request changes only through validated RPCs or Edge Functions that bind operations to the authenticated user ID.
- Finance operations require `MANAGE_DONATIONS:DONATIONS`; no new role framework is added.
- Finance exports use server-authorized queries and exclude national ID and unnecessary PII.
- Service-role access is limited to callbacks, scheduled obligation creation, reminders, and reconciliation.
- Hubtel callback authenticity and reference binding follow the existing signed callback approach.
- Callback updates are atomic and idempotent.
- Raw payment credentials are never stored.
- Consent evidence and financial audit history cannot be deleted from member-facing clients.

## Hubtel Integration

### Manual monthly payment

1. Server creates or retrieves the member's obligation for the selected month.
2. Member selects **Pay this month**.
3. The existing checkout flow receives the member-local display currency and amount.
4. Server converts and validates the GHS settlement amount against the stored obligation.
5. Hubtel callback atomically marks the obligation paid and records the transaction.
6. Receipt delivery is claimed and retried using existing receipt-hardening patterns.

### Recurring enrollment

1. Member reviews the current amount, schedule, cancellation terms, and notification choices.
2. Server records consent and creates a pending enrollment.
3. A Hubtel recurring invoice is created with authenticated server credentials and a signed callback URL.
4. Provider identifiers are saved only after a valid Hubtel response.
5. Enrollment becomes active when provider activation is confirmed.
6. Recurring callbacks map to the correct dues month and update the obligation idempotently.

### Cancellation

1. Member confirms cancellation in the Monthly Dues tab.
2. Enrollment becomes `cancellation_pending`.
3. Server calls Hubtel Cancel Invoice.
4. Successful provider cancellation changes enrollment to `opted_out`, records consent withdrawal, and suppresses future obligations/reminders.
5. A provider failure leaves cancellation pending and provides a safe retry; the UI never claims cancellation succeeded prematurely.

### Verification and reconciliation

- Hubtel Verify Invoice supports manual reconciliation of uncertain provider states.
- Finance users can retry verification but cannot directly mark a Hubtel payment paid.
- Offline payments may be verified manually with notes and administrator attribution.

## Reminder Processing

A scheduled Edge Function runs daily:

1. Determine the current effective settings.
2. Create missing monthly obligations for active enrollments idempotently.
3. Select unpaid obligations at the three reminder stages.
4. Load the member's latest consent state.
5. Skip opted-out, already-paid, or disabled-channel recipients.
6. Claim a unique reminder ledger row before dispatch.
7. Send through existing email and MNotify helpers.
8. Record success or a bounded failure reason without logging message bodies or unnecessary PII.

Payment success suppresses all later reminders for that obligation.

## Member Experience

### Donations page tabs

The existing member Donations page gains:

- **Donations**: current donation experience and history.
- **Monthly Dues**: enrollment, current obligation, payment actions, history, analytics, and exports.

Monthly Dues includes:

- local amount and GHS equivalent;
- due date and current status;
- **Pay this month** action;
- **Enable recurring payments** and **Stop recurring payments** actions;
- current email/SMS reminder status with a link to notification settings;
- payment history with receipt access and retry states;
- CSV and PDF export of monthly dues or combined contribution history;
- totals and a compact monthly trend / donations-versus-dues breakdown.

### Profile Settings

Profile Settings remains the canonical location for ongoing notification preferences:

- Monthly dues email reminders toggle.
- Monthly dues SMS reminders toggle.
- Clear explanation that disabling a channel immediately stops future dues reminders on that channel.

Enrollment collects the same choices contextually, but both surfaces write to the same append-only consent mechanism.

## Finance Experience

### Finance dashboard navigation

Finance dashboard uses tabs:

- **Overview**
- **Donations**
- **Monthly Dues**
- **Expenses**

### Overview analytics

- total donations;
- total monthly dues;
- combined income;
- expenses and net balance;
- cashflow trend including dues;
- income-source chart for donations versus dues;
- recent transactions combining donations, dues, and expenses.

### Monthly Dues tab

- settings card for amount, due day, grace period, and recurring availability;
- KPIs: enrolled, paid, due, overdue, opted out, collected total;
- searchable member table;
- filters for status, month/date, Ghana/Diaspora network, country, payment mode, and consent channel;
- sorting by member, due date, amount, status, and payment date;
- payment detail, provider state, receipt, reminder attempts, and consent history;
- CSV/PDF finance exports based on active filters;
- offline payment verification with required notes;
- Hubtel verification/cancellation retry actions with audit attribution.

## Exports

Member exports include only the signed-in member's permitted data:

- date/month;
- contribution type;
- local amount/currency;
- GHS amount;
- status;
- method;
- reference and receipt link where allowed.

Finance exports apply current filters and contain the minimum operational member identity needed. Export actions are authorized server-side and audit logged. CSV is the primary machine-readable export; PDF is the readable statement/report format.

## Error Handling

- No provider error may mark a payment paid or a cancellation complete.
- Network timeouts preserve a recoverable pending state.
- Duplicate callbacks and reminder jobs are harmless through unique keys and atomic claims.
- Invalid callback references are rejected and surfaced to existing operational alerts.
- Missing currency mappings fall back visibly to GHS rather than silently presenting an incorrect currency.
- Exchange-rate snapshots are immutable after obligation creation.
- Export failures do not expose partial files or raw backend errors.

## Testing Strategy

### Database

- RLS ownership and finance-permission tests.
- Unique obligation and reminder constraints.
- Append-only consent enforcement.
- Atomic callback transition and duplicate callback tests.
- Opt-out and cancellation state tests.

### Edge Functions

- Hubtel create, verify, callback, and cancel contract tests.
- Signed callback and reference-binding tests.
- Reminder consent, schedule, deduplication, and paid-suppression tests.
- Currency conversion validation and snapshot tests.
- Export authorization tests.

### React and services

- member tab and state rendering;
- enrollment and cancellation flows;
- Profile Settings consent toggles;
- finance search, filter, sort, analytics, and export behavior;
- error, loading, empty, and mobile states.

### Release verification

- TypeScript, focused Vitest/Deno tests, ESLint, production build, and `git diff --check`.
- Local database verification where the migration chain permits it.
- Hubtel sandbox tests for create, verify, callback, cancel, and duplicate callback behavior.
- Production recurring enrollment stays disabled until finance/compliance sign-off and live callback verification.

## Delivery Boundaries

The implementation should be delivered in independently verifiable slices:

1. schema, RLS, consent, settings, and obligation rules;
2. member manual dues experience and exports;
3. finance configuration, operations, and analytics;
4. reminders and Profile Settings consent controls;
5. Hubtel recurring create/verify/callback/cancel integration;
6. end-to-end verification and controlled activation.

