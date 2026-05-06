# Em Dash Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all em dash characters "—" across the project and replace them with standard hyphens "-" or " - " (if used as a separator).

**Architecture:** Surgical replacement of characters in documentation and source code files.

**Tech Stack:** React, TypeScript, Markdown

---

### Task 1: Documentation Cleanup

**Files:**
- Modify: `README.md`
- Modify: `docs/project-docs/branding-and-design.md`
- Modify: `docs/project-docs/the-base-rebuild.md`

- [ ] **Step 1: Replace em dashes in README.md**
- [ ] **Step 2: Replace em dashes in branding-and-design.md**
- [ ] **Step 3: Replace em dashes in the-base-rebuild.md**

### Task 2: Source Code Cleanup (Components & Pages)

**Files:**
- Modify: `src/components/Breadcrumbs.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace em dashes in Breadcrumbs.tsx**
- [ ] **Step 2: Replace em dashes in Dashboard.tsx**
- [ ] **Step 3: Replace em dashes in Home.tsx**

### Task 3: Admin Pages Cleanup

**Files:**
- Modify: `src/pages/admin/MemberVerification.tsx`
- Modify: `src/pages/admin/Orders.tsx`
- Modify: `src/pages/admin/Polls.tsx`
- Modify: `src/pages/admin/Regions.tsx`

- [ ] **Step 1: Replace em dashes in MemberVerification.tsx**
- [ ] **Step 2: Replace em dashes in Orders.tsx**
- [ ] **Step 3: Replace em dashes in Polls.tsx**
- [ ] **Step 4: Replace em dashes in Regions.tsx**

### Task 4: Final Verification

- [ ] **Step 1: Run a final grep to ensure no em dashes remain in target areas**
- [ ] **Step 2: Verify build passes**
