# The Base Movement Platform — Remaining Tasks & Audit Report

This report presents a high-fidelity audit of all remaining work required to bring the platform from its current **Stabilized** state to **National Production Deployment Readiness**.

It is divided into two areas:

1. **The Audits Folder (`docs/audits`)**: Operational gaps, migrations-on-touch, and system polishes already documented but not yet fully finished or deployed.
2. **The Codebase & Project Operations**: Core technical modules, external service integrations, security reviews, and upcoming features requiring developer attention.

---

## 📋 1. Action Items from the Audits Folder

While the recent engineering sprints have completed all major UI migrations (such as typography no-bold alignment and loading-state skeletons), several operational audits contain pending tasks.

### 📐 A. Border Radius Token Migration

- **Source**: [border-radius-token-audit-2026-05-26.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/border-radius-token-audit-2026-05-26.md)
- **Status**: In Progress (Migrate-on-Touch)
- **What is left to do**:
  - **409 hardcoded radius occurrences** remain across **156 `.tsx` files**. The current directive is to **migrate on touch** (do not mass-replace automatically to avoid visual breaks).
  - High-priority components that should be refactored next:
    - `src/components/DashboardLayout.tsx`
    - `src/components/layouts/AdminLayout.tsx`
    - `src/components/MemberProfileCard.tsx`
    - `src/components/ChapterCard.tsx`
    - `src/components/Navbar.tsx`
  - **Off-spec radius values** in `src/index.css` that need visual alignment:
    - `.panel` variant (~line 633): currently `6px` → change to `var(--radius-sm)` (4px) or `var(--radius-md)` (8px)
    - Form group (~line 978): currently `6px` → change to `var(--radius-sm)` or `var(--radius-md)`
    - Table wrapper (~line 1161): currently `6px` → change to `var(--radius-sm)` or `var(--radius-md)`
    - BrandLine strip (~line 523): currently `10px` → change to `var(--radius-md)` (8px) or `var(--radius-lg)` (12px)

### 📧 B. Resend Domain Verification & Email Dispatch

- **Source**: [RESEND_DOMAIN_TODO.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/RESEND_DOMAIN_TODO.md) & [email-templates-audit-2026-05-27.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/email-templates-audit-2026-05-27.md)
- **Status**: Awaiting Key & DNS Propagation (Blocked)
- **What is left to do**:
  - Add `RESEND_API_KEY` to Supabase Edge Function secrets.
  - Complete the domain verification process for `thebasemovement.com` inside the Resend Console (requires adding generated MX/TXT records at the domain registrar).
  - Deploy all **4 core transactional email edge functions** once keys are loaded:
    - `notify-leads` (welcome emails)
    - `broadcast-dispatcher` (urgent alerts)
    - `send-donation-receipt` (donation confirmation)
    - `send-poll-notification` (poll warnings)
  - **Optional Polish**: Wire PDF receipt generation and upload it to Supabase storage to pass `receiptPdfUrl` in `donationReceiptEmail`.
  - **Optional Automation**: Create a Supabase cron job to invoke `send-poll-notification` automatically 24 hours before any active poll closing date.

> [!WARNING]
> Until the DNS records for `thebasemovement.com` propagate and are verified in Resend, outbound emails will be rejected. The temporary workaround is to change the `from` sender to `onboarding@resend.dev` in the Edge Functions.

### 💬 C. Discord Webhook Security & Functional Gaps

- **Source**: [discord-webhook-audit-2026-05-29.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/discord-webhook-audit-2026-05-29.md)
- **Status**: Complete (Operational) with Future Gaps
- **What is left to do**:
  - **Edge Function Proxy**: Move the webhook caller server-side (to a Supabase Edge Function). Currently, `VITE_DISCORD_WEBHOOK_URL` is defined in client-side `.env` files, making it readable in the public JavaScript bundle by technical users.
  - **Functional gaps to wire**:
    - **Store order placed**: Wire Discord notification when the `store_orders` database insertions are centralized.
    - **Chapter join request**: Hook into `joinChapter()` in `chapterService.ts` to alert chapter leaders.
    - **Donation verified by admin**: Wire `donationService.verifyDonation()` to post a "Donation Confirmed ✅" embed when processed.

### 🖼️ D. Upload Image Compression Alignment

- **Source**: [image-compression-audit-2026-05-29.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/image-compression-audit-2026-05-29.md)
- **Status**: Complete
- **What is left to do**:
  - **Branding Assets**: `uploadBrandingAsset` (in `adminService.ts`) has no active frontend caller yet. Once a branding/logo upload interface is added to the Admin Settings panel, make sure it routes uploaded assets through the compression utilities.

---

## 🛠️ 2. Core Codebase & System Gaps

Beyond the audit files, there are several foundational and enterprise-level modules on the roadmap to support national-scale political and social mobilization.

### 🗺️ A. GIS Logistics Supply Chain Map

- **Source**: [TODO_REMAINING.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/TODO_REMAINING.md)
- **Status**: ✅ **100% Completed**
- **Findings**:
  - **Warehouse inventory markers**: Fully implemented. Dynamically maps stock counts by region in the `<LogisticsMap />` component, displaying them as custom green/gold/red markers depending on stock thresholds.
  - **Fulfillment transport routes**: Fully implemented. Active dispatch routes from the Accra central hub to regional targets are plotted dynamically on the Mapbox GL map using LineString layers.

### 🧠 B. Machine Learning (ML) Intelligence Microservice

- **Source**: [TODO_REMAINING.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/TODO_REMAINING.md)
- **Status**: Not Started
- **What is left to do**:
  - Provision a Python/FastAPI service reading Supabase data.
  - Implement **propensity modeling** for members to predict high-likelihood donors.
  - Deploy **sentiment-based mobilization forecasting** using historical engagement logs.

### 📡 C. SMS Gateway Operational Verification

- **Source**: [TODO_REMAINING.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/TODO_REMAINING.md) & `supabase/functions/broadcast-dispatcher/index.ts`
- **Status**: Code Complete, Awaiting Credentials
- **What is left to do**:
  - The Africa's Talking SMS integration is written inside the Deno edge function.
  - The project needs `AT_API_KEY` and `AT_USERNAME` securely set in the Supabase Edge Function secrets for the live gateway to work.

### 👥 D. Bulk CSV Member Import & Mobile OTP Password Flow

- **Source**: [csv-member-password-flow.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/csv-member-password-flow.md)
- **Status**: Not Started
- **What is left to do**:
  - This flow allows leaders to batch-insert members from remote handwritten paper logs without email addresses.
  - **Edge Function**: Create the `create-csv-member-accounts` Edge Function to securely process the files, generate 10-character temporary codes, save them in the DB, and dispatch them via Africa's Talking SMS.
  - **Password Redirect Guard**: Implement `must_change_password` redirect logic in `DashboardLayout.tsx` to force first-time loggers to `/dashboard/change-password`.
  - **Forgot Password (OTP Code)**: Implement phone reset OTP database tables, SMS dispatcher, and input screens.

### 🛡️ E. Production Row Level Security (RLS) Audit

- **Source**: [TODO_REMAINING.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/TODO_REMAINING.md)
- **Status**: Not Started
- **What is left to do**:
  - Conduct a security review of all tables to guarantee that no unauthorized users can read PII (especially full names, registration details, and phone numbers).
  - Verify that the `users` table selection restrictions (column-level SELECT queries excluding `national_id`) are maintained.

### 📊 F. Privacy-Respecting Analytics

- **Source**: [TODO_REMAINING.md](file:///c:/MAMP/htdocs/The-Base/docs/audits/TODO_REMAINING.md)
- **Status**: ✅ **100% Completed**
- **Findings**:
  - Umami analytics is fully integrated. `src/components/Analytics.tsx` loads the script in production via `VITE_UMAMI_WEBSITE_ID` and the `trackEvent()` helper is wired across all major transaction/registration flows.

---

## 🧪 3. System Health & Test Validation

- **Status**: ✅ **100% Passing**
- **Verification Command**: `npm run test:run`
- **Audit Execution**:
  - The Vitest suite executed successfully on May 31, 2026.
  - **Results**:
    - **3/3 Test Files Passed** (`imageUtils.test.ts`, `seo.test.tsx`, `ErrorBoundary.test.tsx`).
    - **11/11 Individual Unit Tests Passed**.
    - Image compression utilities correctly demonstrated safe error recovery contracts (gracefully falling back to raw upload payloads when simulated Out-Of-Memory/OOM faults are encountered).

---

## 🎯 4. Next Steps & Recommendations

> [!TIP]
> **Priority Recommendations**:
>
> 1. **Complete the Resend DNS Configuration**: This is the highest priority technical block as transactional alerts will otherwise fail silently once deployed.
> 2. **Implement the CSV / Phone Password Flow**: Offline registration is crucial for grassroots operations in rural regions where members lack reliable internet/emails.
> 3. **Proxy the Discord Webhook**: Moving the webhook to a server-side Edge Function will resolve a security gap before public launch.
