# 🆔 Enterprise KYC Integration Plan (Smile Identity)

## Objective

Replace the current simulated identity verification in `tacticalService` and the existing basic OCR scan in `Register.tsx` with a production-ready, enterprise-grade KYC (Know Your Customer) solution using **Smile Identity**. This will enable secure, automated verification of Ghana Cards and biometric face-matching.

## Why Smile Identity?

- **Regional Authority**: Best-in-class coverage for Ghana (NIA/Ghana Card integration).
- **Biometric Integrity**: Built-in liveness detection and face-matching (Selfie vs ID Photo).
- **Automation**: Real-time extraction (OCR) and validation against government databases.

## Scope & Impact

- **Module**: `tacticalService.ts` (Core logic replacement).
- **Workflow**: `Register.tsx` (Integration into Step 3: Verify ID).
- **Security**: Verification status in the `users` table will be updated based on live API responses.

## Technical Architecture

### 1. Integration Method

We will use the **Smile ID Web SDK** for a seamless, cross-platform mobile-first experience.

- **Frontend**: Captures ID image and selfie with liveness check.
- **Backend**: Supabase Edge Function handles the secure API communication with Smile ID using the Server Role key.

### 2. Implementation Steps

#### Phase 1: Environment Setup

- [ ] Register for Smile ID Developer account.
- [ ] Add `SMILE_ID_PARTNER_ID` and `SMILE_ID_API_KEY` to Supabase Vault/Secrets.
- [ ] Update `ONGOING.md` requirements.

#### Phase 2: Supabase Edge Function (`kyc-verify`)

- [ ] Create a new Deno-based Edge Function to securely proxy requests.
- [ ] Implement "Enhanced KYC" job type (ID + Biometrics).
- [ ] Handle callback/webhook to update the `users.verification_status` and `users.verification_notes`.

#### Phase 3: Tactical Service Refactor

- [ ] Replace `verifyMemberID` mock with a call to the new `kyc-verify` Edge Function.
- [ ] Update the return type to include `smile_job_id` and specific failure reasons (e.g., "Spoof detected").

#### Phase 4: Registration UI Update

- [ ] Refactor `handleIdScan` in `Register.tsx` to launch the Smile ID Web SDK.
- [ ] Map the SDK response (success/failure) to the `formStep` progression.
- [ ] Display detailed verification status on the Success page.

## Verification & Testing

- **Test Case 1**: Successful Ghana Card scan with matching selfie -> Status: `Verified`.
- **Test Case 2**: Intentional mismatch or poor lighting -> Status: `Flagged` (Manual review).
- **Test Case 3**: expired ID or fake document -> Status: `Rejected`.

## Alternatives Considered

- **Onfido**: Excellent global reach, but Smile Identity has superior direct integration with the National Identification Authority (NIA) of Ghana.
- **Manual Review Only**: _Rejected_ for Phase 2 as it does not scale for national deployment.

---

**Implementation Lead**: Gemini CLI | **Priority**: Critical
