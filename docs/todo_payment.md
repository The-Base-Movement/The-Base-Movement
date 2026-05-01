# Payment Integration - TODO List

This document outlines the remaining steps for implementing payment systems for store purchases and donations.

## 1. Paystack Integration (Primary)
- [ ] Set up Paystack test accounts.
- [ ] Implement secure transaction logging in `payments` table.
- [ ] Create frontend checkout workflow with dynamic GHS pricing.
- [ ] Handle webhooks for successful/failed transactions.

## 2. Mobile Money (MoMo)
- [ ] Verify MTN/Vodafone/AirtelTigo MoMo merchant configurations.
- [ ] Implement MoMo-specific checkout UI triggers.
- [ ] Add donation tiers for rapid grassroots funding.

## 3. Financial Auditing
- [ ] Ensure every transaction is linked to a `user_id`.
- [ ] Generate automated receipts for verified members.
- [ ] Implement regional donation tracking for chapters.
