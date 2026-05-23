# BrandLine Component Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded `.bl` div blocks with the `<BrandLine />` component across 30 files to enforce the new design system standard.

**Architecture:** Systematic batch refactoring. Each file will have the `BrandLine` component imported and the hardcoded div replaced.

**Tech Stack:** React, TypeScript, Tailwind CSS.

---

### Task 1: Batch 1 - Admin Core Pages (1-8)

**Files:**

- Modify: `src/pages/admin/Dashboard.tsx`
- Modify: `src/pages/admin/LeadershipHub.tsx`
- Modify: `src/pages/admin/MobilizationMetrics.tsx`
- Modify: `src/pages/admin/PollingStations.tsx`
- Modify: `src/pages/admin/WarRoomCommand.tsx`
- Modify: `src/pages/admin/DeployMission.tsx`
- Modify: `src/pages/admin/DonationVerification.tsx`
- Modify: `src/pages/admin/FieldDirectives.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/Dashboard.tsx`**
  - Import `BrandLine` from `@/components/ui/BrandLine`.
  - Replace `<div className="bl">...</div>` with `<BrandLine />`.
- [ ] **Step 2: Refactor `src/pages/admin/LeadershipHub.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/MobilizationMetrics.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/PollingStations.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/WarRoomCommand.tsx`**
- [ ] **Step 6: Refactor `src/pages/admin/DeployMission.tsx`**
- [ ] **Step 7: Refactor `src/pages/admin/DonationVerification.tsx`**
- [ ] **Step 8: Refactor `src/pages/admin/FieldDirectives.tsx`**
- [ ] **Step 9: Commit changes**
  ```bash
  git add src/pages/admin/Dashboard.tsx src/pages/admin/LeadershipHub.tsx src/pages/admin/MobilizationMetrics.tsx src/pages/admin/PollingStations.tsx src/pages/admin/WarRoomCommand.tsx src/pages/admin/DeployMission.tsx src/pages/admin/DonationVerification.tsx src/pages/admin/FieldDirectives.tsx
  git commit -m "refactor: replace hardcoded BrandLine in admin core pages (batch 1)"
  ```

---

### Task 2: Batch 2 - Admin Core Pages (9-16)

**Files:**

- Modify: `src/pages/admin/GroundGameCommand.tsx`
- Modify: `src/pages/admin/MediaLibrary.tsx`
- Modify: `src/pages/admin/MemberVerification.tsx`
- Modify: `src/pages/admin/NewBroadcast.tsx`
- Modify: `src/pages/admin/Orders.tsx`
- Modify: `src/pages/admin/PlanManager.tsx`
- Modify: `src/pages/admin/Settings.tsx`
- Modify: `src/pages/admin/Store.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/GroundGameCommand.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/MediaLibrary.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/MemberVerification.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/NewBroadcast.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/Orders.tsx`**
- [ ] **Step 6: Refactor `src/pages/admin/PlanManager.tsx`**
- [ ] **Step 7: Refactor `src/pages/admin/Settings.tsx`**
- [ ] **Step 8: Refactor `src/pages/admin/Store.tsx`**
- [ ] **Step 9: Commit changes**
  ```bash
  git add src/pages/admin/GroundGameCommand.tsx src/pages/admin/MediaLibrary.tsx src/pages/admin/MemberVerification.tsx src/pages/admin/NewBroadcast.tsx src/pages/admin/Orders.tsx src/pages/admin/PlanManager.tsx src/pages/admin/Settings.tsx src/pages/admin/Store.tsx
  git commit -m "refactor: replace hardcoded BrandLine in admin core pages (batch 2)"
  ```

---

### Task 3: Batch 3 - Admin Pages & Headers (17-24)

**Files:**

- Modify: `src/pages/admin/StrategicPriorities.tsx`
- Modify: `src/pages/admin/Trash.tsx`
- Modify: `src/pages/admin/administrators/AdminsHeader.tsx`
- Modify: `src/pages/admin/authors/index.tsx`
- Modify: `src/pages/admin/blogs/BlogsHeader.tsx`
- Modify: `src/pages/admin/polls/PollsHeader.tsx`
- Modify: `src/pages/admin/rally/RallyHeader.tsx`
- Modify: `src/pages/admin/sentimentintelligence/SentimentHeader.tsx`

- [ ] **Step 1: Refactor `src/pages/admin/StrategicPriorities.tsx`**
- [ ] **Step 2: Refactor `src/pages/admin/Trash.tsx`**
- [ ] **Step 3: Refactor `src/pages/admin/administrators/AdminsHeader.tsx`**
- [ ] **Step 4: Refactor `src/pages/admin/authors/index.tsx`**
- [ ] **Step 5: Refactor `src/pages/admin/blogs/BlogsHeader.tsx`**
- [ ] **Step 6: Refactor `src/pages/admin/polls/PollsHeader.tsx`**
- [ ] **Step 7: Refactor `src/pages/admin/rally/RallyHeader.tsx`**
- [ ] **Step 8: Refactor `src/pages/admin/sentimentintelligence/SentimentHeader.tsx`**
- [ ] **Step 9: Commit changes**
  ```bash
  git add src/pages/admin/StrategicPriorities.tsx src/pages/admin/Trash.tsx src/pages/admin/administrators/AdminsHeader.tsx src/pages/admin/authors/index.tsx src/pages/admin/blogs/BlogsHeader.tsx src/pages/admin/polls/PollsHeader.tsx src/pages/admin/rally/RallyHeader.tsx src/pages/admin/sentimentintelligence/SentimentHeader.tsx
  git commit -m "refactor: replace hardcoded BrandLine in admin pages and headers (batch 3)"
  ```

---

### Task 4: Batch 4 - Public Pages (25-30)

**Files:**

- Modify: `src/pages/Donate.tsx`
- Modify: `src/pages/chapterhub/ChapterHubHeader.tsx`
- Modify: `src/pages/chapters/PublicHeader.tsx`
- Modify: `src/pages/home/FoundationSection.tsx`
- Modify: `src/pages/home/HeroSection.tsx`
- Modify: `src/pages/impact/PublicImpactView.tsx`

- [ ] **Step 1: Refactor `src/pages/Donate.tsx`**
- [ ] **Step 2: Refactor `src/pages/chapterhub/ChapterHubHeader.tsx`**
- [ ] **Step 3: Refactor `src/pages/chapters/PublicHeader.tsx`**
- [ ] **Step 4: Refactor `src/pages/home/FoundationSection.tsx`**
- [ ] **Step 5: Refactor `src/pages/home/HeroSection.tsx`**
- [ ] **Step 6: Refactor `src/pages/impact/PublicImpactView.tsx`**
- [ ] **Step 7: Commit changes**
  ```bash
  git add src/pages/Donate.tsx src/pages/chapterhub/ChapterHubHeader.tsx src/pages/chapters/PublicHeader.tsx src/pages/home/FoundationSection.tsx src/pages/home/HeroSection.tsx src/pages/impact/PublicImpactView.tsx
  git commit -m "refactor: replace hardcoded BrandLine in public pages (batch 4)"
  ```

---

### Task 5: Final Verification

- [ ] **Step 1: Search for remaining `.bl` div blocks**
      Run: `grep -r "className=\"bl\"" src/`
      Expected: No results in target files.
- [ ] **Step 2: Verify application builds**
      Run: `npm run build` (or `tsc --noEmit`)
      Expected: Success.
