# Admin Page Header Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize admin page headers using the new `<AdminPageHeader />` component across 27 files.

**Architecture:** Replace manual header implementations (divs with class `top` or `ph`) with the `AdminPageHeader` component. Normalize titles, icons, descriptions, and actions.

**Tech Stack:** React, TypeScript, Tailwind CSS (via `cn` utility).

---

### Task 1: Refactor Group 1 Stand-alone Pages

**Files:**

- Modify: `src/pages/admin/Chapters.tsx`
- Modify: `src/pages/admin/DeployMission.tsx`
- Modify: `src/pages/admin/DonationVerification.tsx`
- Modify: `src/pages/admin/FieldDirectives.tsx`
- Modify: `src/pages/admin/GroundGameCommand.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/Chapters.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/DeployMission.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/DonationVerification.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/FieldDirectives.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/GroundGameCommand.tsx`**

---

### Task 2: Refactor Group 2 Stand-alone Pages

**Files:**

- Modify: `src/pages/admin/LeadershipHub.tsx`
- Modify: `src/pages/admin/MediaLibrary.tsx`
- Modify: `src/pages/admin/MemberVerification.tsx`
- Modify: `src/pages/admin/MobilizationMetrics.tsx`
- Modify: `src/pages/admin/NewBroadcast.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/LeadershipHub.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/MediaLibrary.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/MemberVerification.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/MobilizationMetrics.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/NewBroadcast.tsx`**

---

### Task 3: Refactor Group 3 Stand-alone Pages

**Files:**

- Modify: `src/pages/admin/Orders.tsx`
- Modify: `src/pages/admin/PartyOfficials.tsx`
- Modify: `src/pages/admin/PollingStations.tsx`
- Modify: `src/pages/admin/Regions.tsx`
- Modify: `src/pages/admin/Roadmap.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/Orders.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/PartyOfficials.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/PollingStations.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/Regions.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/Roadmap.tsx`**

---

### Task 4: Refactor Group 4 Stand-alone Pages

**Files:**

- Modify: `src/pages/admin/Settings.tsx`
- Modify: `src/pages/admin/Store.tsx`
- Modify: `src/pages/admin/StrategicPriorities.tsx`
- Modify: `src/pages/admin/Trash.tsx`
- Modify: `src/pages/admin/WarRoomCommand.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/Settings.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/Store.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/StrategicPriorities.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/Trash.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/WarRoomCommand.tsx`**

---

### Task 5: Refactor Group 5 Header sub-components

**Files:**

- Modify: `src/pages/admin/administrators/AdminsHeader.tsx`
- Modify: `src/pages/admin/blogs/BlogsHeader.tsx`
- Modify: `src/pages/admin/broadcasts/BroadcastHeader.tsx`
- Modify: `src/pages/admin/members/MembersHeader.tsx`
- Modify: `src/pages/admin/polls/PollsHeader.tsx`
- Modify: `src/pages/admin/rally/RallyHeader.tsx`
- Modify: `src/pages/admin/sentimentintelligence/SentimentHeader.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/administrators/AdminsHeader.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/blogs/BlogsHeader.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/broadcasts/BroadcastHeader.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/members/MembersHeader.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/polls/PollsHeader.tsx`**
- [ ] **Step 6: Refactor `src/pages/admin/rally/RallyHeader.tsx`**
- [ ] **Step 7: Refactor `src/pages/admin/sentimentintelligence/SentimentHeader.tsx`**

---

### Task 6: Final Verification

- [ ] **Step 1: Verify all 27 files are updated and build passes.**
- [ ] **Step 2: Run lint check.**

Run: `npm run lint`
Expected: No new lint errors related to headers.
