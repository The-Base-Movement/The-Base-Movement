# Public Donate Hubtel and Visibility Design

## Scope

- Clarify public donate Hubtel authorization failures.
- Remove the public `View ledger` entry point.
- Hide the displayed raised amount for the default "General donation" public card while keeping its progress bar visible.

## Current Findings

- The public donate page creates a donation row and then calls the Supabase Edge Function `hubtel-initiate-payment`.
- The reported toast text, `Hubtel payment initiation failed (401): {"raw":""}`, shows the frontend already received a handled error from the edge function.
- A `401` from Hubtel with an empty body points more strongly to Hubtel credentials or account configuration than to a malformed React payload.

## Approved Design

### Hubtel error handling

- Keep the payment flow unchanged.
- Improve the error surfaced by `hubtel-initiate-payment` when Hubtel returns `401` with no useful body.
- The new message should state that Hubtel authorization failed and that operators should verify Hubtel API credentials and merchant account configuration.

### Public donate UI

- Remove the `View ledger` button from the public donate contribution desk.
- Keep the audit modal code untouched unless the button removal makes a prop unused.
- For strategic priority cards, use the existing `isDefault` flag to detect the default general donation card.
- On that one card only, replace the visible raised amount with non-sensitive copy while preserving the progress label and fill bar.

## Verification

- Run TypeScript checking.
- Review the public donate components for unused props after the button removal.
