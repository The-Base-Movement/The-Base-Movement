# Typographic and Branding Normalization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perform a comprehensive typographic and branding normalization across the remaining Field & Strategy modules in the administrative command center.

**Architecture:** Surgical application of the BrandLine component and typographic adjustments to ensure brand consistency and legibility across all admin pages.

**Tech Stack:** React, Tailwind CSS, Lucide Icons, BrandLine component.

---

### Task 1: Normalize Dashboard.tsx
**Files:**
- Modify: `src/pages/admin/Dashboard.tsx`

- [ ] **Step 1: Audit and refine Dashboard.tsx**
Ensure BrandLine is correctly placed and typography matches standards.
(Note: Dashboard.tsx already seems to have BrandLine, check for `font-black` and `uppercase` violations).

### Task 2: Normalize StrategicPriorities.tsx
**Files:**
- Modify: `src/pages/admin/StrategicPriorities.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography**
Import `BrandLine`, add it below H1. Ensure H1 is `font-bold`. Replace `font-black` and `uppercase` where necessary.

### Task 3: Normalize Roadmap.tsx
**Files:**
- Modify: `src/pages/admin/Roadmap.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography**
Import `BrandLine`, add it below H1. Ensure H1 is `font-bold`. Replace `font-black uppercase` on CTA buttons with `font-bold capitalize`.

### Task 4: Normalize Polls.tsx
**Files:**
- Modify: `src/pages/admin/Polls.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography**
Import `BrandLine`, add it below H1.

### Task 5: Normalize Broadcasts.tsx & NewBroadcast.tsx
**Files:**
- Modify: `src/pages/admin/Broadcasts.tsx`
- Modify: `src/pages/admin/NewBroadcast.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography**

### Task 6: Normalize Field Operations Modules
**Files:**
- Modify: `src/pages/admin/GroundGameCommand.tsx`
- Modify: `src/pages/admin/ChapterLeadHub.tsx`
- Modify: `src/pages/admin/Chapters.tsx`
- Modify: `src/pages/admin/LeadershipHub.tsx`
- Modify: `src/pages/admin/MobilizationMetrics.tsx`
- Modify: `src/pages/admin/RallyCommand.tsx`
- Modify: `src/pages/admin/Regions.tsx`
- Modify: `src/pages/admin/WarRoomCommand.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography across all field operation files**

### Task 7: Normalize Support & System Modules
**Files:**
- Modify: `src/pages/admin/SentimentIntelligence.tsx`
- Modify: `src/pages/admin/Settings.tsx`
- Modify: `src/pages/admin/Trash.tsx`

- [ ] **Step 1: Inject BrandLine and adjust typography across support files**

### Task 8: Verification
- [ ] **Step 1: Run build and lint**
Run: `npm run build`
Run: `npm run lint`
