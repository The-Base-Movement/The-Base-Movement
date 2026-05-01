# Implementation Plan: Paystack MoMo Integration

This document outlines the steps required to transition "The Base" donation and store systems from manual receipt uploads to automated, real-time payments via **Paystack**.

## Phase 1: Paystack Setup & Configuration
- [ ] **Create Paystack Account**: Register at [paystack.com](https://paystack.com) and complete the compliance form for Ghana.
- [ ] **API Keys**: Retrieve `PUBLIC_KEY` and `SECRET_KEY` from the Paystack Dashboard.
- [ ] **Environment Variables**: Add keys to the `.env` file:
  ```env
  VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
  ```
- [ ] **Webhook Setup**: Configure a webhook URL (e.g., `https://api.thebase.com/webhooks/paystack`) to listen for `charge.success` events.

## Phase 2: Technical Integration
- [ ] **Install Dependencies**:
  ```bash
  npm install react-paystack
  ```
- [ ] **Create Payment Component**: Develop a reusable `PaystackButton` wrapper in `src/components/Payment/PaystackAction.tsx`.
- [ ] **Transaction Metadata**: Ensure each payment sends custom fields:
  ```json
  {
    "custom_fields": [
      {
        "display_name": "Membership ID",
        "variable_name": "membership_id",
        "value": "GH-2028-XXXXXX"
      }
    ]
  }
  ```

## Phase 3: Donation Page Refactoring (`Donate.tsx`)
- [ ] **Remove Step 3 (Manual Upload)**: Replace the receipt upload zone with a "Pay Now" trigger.
- [ ] **State Management**: Implement a loading state while the Paystack modal initializes.
- [ ] **Success Callback**: 
  - Show a high-fidelity "Success" screen immediately upon payment approval.
  - Automatically trigger a profile update to reflect the "Verified Donor" status.

## Phase 4: Store Integration (`Store.tsx`)
- [ ] **Checkout Flow**: Replace the "Order via WhatsApp" or manual flow with a direct Paystack checkout.
- [ ] **Inventory Sync**: Ensure inventory is only deducted after the Paystack webhook confirms successful payment.

## Phase 5: Dashboard Updates
- [ ] **Donation History**: Create a "Transactions" tab in the member dashboard to show Paystack reference IDs and status.
- [ ] **Auto-Verification**: Transition from manual "Pending" status to automated "Verified" for all Paystack-processed contributions.

## Security & Best Practices
- [ ] **Never expose Secret Keys** in the frontend code.
- [ ] **Checksum Validation**: Verify all webhook payloads using the `x-paystack-signature` header.
- [ ] **Fallback Logic**: Maintain a manual support link for users whose banks/networks fail during processing.

---
**Status**: 🛠️ In Planning
**Priority**: High (Member UX & Financial Automation)
