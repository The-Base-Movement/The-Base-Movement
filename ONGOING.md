# 🚀 Ongoing Integration & Automation Tasks

This file tracks the active implementation of enterprise-grade features and automated protocols as we move toward national deployment.

## Active Tasks

| Task                            | Priority         | Status       | Owner      |
| :------------------------------ | :--------------- | :----------- | :--------- |
| **Trash Auto-Purge Protocol**   | High (Quick Win) | ✅ COMPLETED | Gemini CLI |
| **Enterprise KYC Integration**  | Critical         | ✅ COMPLETED | Gemini CLI |
| **GIS Supply Chain Map**        | High             | ✅ COMPLETED | Gemini CLI |
| **Low-Bandwidth Network Audit** | Medium           | ⚪️ PENDING   | Gemini CLI |

---

## 1. Trash Auto-Purge Protocol 🗑️

**Objective**: Automate the permanent deletion of items in the Trash Vault that are older than 30 days.

### Requirements

- [x] Implement PostgreSQL function `purge_expired_trash` to identify and purge expired records.
- [x] Provide `pg_cron` scheduling script for 24-hour intervals.
- [x] Integrate audit logging for automated purge actions.
- [x] Support all 5 trash types (Members, Blogs, Products, Media, Authors).
- [x] Documentation saved to `docs/database-sql-files/trash-auto-purge.sql`.

---

## 2. Enterprise KYC Integration 🆔

**Objective**: Replace simulated ID verification with a production-ready biometric protocol.

### Requirements

- [x] Implemented Supabase Edge Function `kyc-verify` to proxy biometric validation requests.
- [x] Refactored `tacticalService.verifyMemberID` to support live API uplinks and selfie payloads.
- [x] Integrated biometric selfie capture into the Member Registration workflow (Step 3).
- [x] Verified Ghana Card & selfie dual-capture UI with real-time feedback checkmarks.
- [x] Preserved all existing registration fields for alignment with physical forms.

---

## 3. GIS Supply Chain Map 🗺️

**Objective**: Transition from SVG placeholders to a dynamic, real-time Mapbox GL implementation.

### Requirements

- [x] Integrate Mapbox GL JS and `react-map-gl/mapbox` dependencies.
- [x] Implement `<LogisticsMap />` component with Ghana-centric viewport.
- [x] Plot regional markers with real-time fulfillment rates.
- [x] Provisioned `VITE_MAPBOX_TOKEN` configuration in `.env.example`.

---

## 4. Low-Bandwidth Network Audit 📡

**Objective**: Optimize platform performance for Ghana-specific network constraints.

### Requirements

- [ ] Conduct simulated 3G/2G network stress tests.
- [ ] Identify and optimize large assets or high-latency data fetches.
- [ ] Harden the user-toggleable "Low-Bandwidth Mode".
