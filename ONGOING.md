# 🚀 Ongoing Integration & Automation Tasks

This file tracks the active implementation of enterprise-grade features and automated protocols as we move toward national deployment.

## Active Tasks

| Task                            | Priority         | Status         | Owner      |
| :------------------------------ | :--------------- | :------------- | :--------- |
| **Trash Auto-Purge Protocol**   | High (Quick Win) | ✅ COMPLETED   | Gemini CLI |
| **Enterprise KYC Integration**  | Critical         | ⚪️ PENDING     | TBD        |
| **GIS Supply Chain Map**        | High             | 🟡 IN PROGRESS | Gemini CLI |
| **Low-Bandwidth Network Audit** | Medium           | ⚪️ PENDING     | Gemini CLI |

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

**Objective**: Replace simulated ID verification with a production-ready provider (e.g., Smile Identity).

### Requirements

- [ ] Select and configure the Identity Verification provider.
- [ ] Refactor `tacticalService.verifyMemberID` to use live API.
- [ ] Implement biometric face-matching in the registration workflow.
- [ ] Validate Ghana Card & Voter ID OCR accuracy.

---

## 3. GIS Supply Chain Map 🗺️

**Objective**: Transition from SVG placeholders to a dynamic, real-time Mapbox GL implementation.

### Requirements

- [x] Integrate Mapbox GL JS and `react-map-gl` dependencies.
- [x] Implement `<LogisticsMap />` component with Ghana-centric viewport.
- [x] Plot regional markers with real-time fulfillment rates.
- [ ] Add `VITE_MAPBOX_TOKEN` to `.env.example`.
- [ ] Implement transport route visualization for resource mobilization.

---

## 4. Low-Bandwidth Network Audit 📡

**Objective**: Optimize platform performance for Ghana-specific network constraints.

### Requirements

- [ ] Conduct simulated 3G/2G network stress tests.
- [ ] Identify and optimize large assets or high-latency data fetches.
- [ ] Harden the user-toggleable "Low-Bandwidth Mode".
