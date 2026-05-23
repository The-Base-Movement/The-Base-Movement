# Remove Manual Admin Breadcrumbs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove redundant manual breadcrumb blocks from all admin pages to favor the new global Breadcrumbs component in AdminLayout.

**Architecture:** Surgical removal of the `<div className="crumbs">...</div>` block from each specified file. Cleanup of unused `Link` imports from `react-router-dom` to maintain code cleanliness.

**Tech Stack:** React, TypeScript, React Router

---

### Task 1: Remove crumbs from src/pages/admin/Chapters.tsx

**Files:**

- Modify: `src/pages/admin/Chapters.tsx`

- [ ] **Step 1: Remove the crumbs div**
- [ ] **Step 2: Remove unused Link import**

### Task 2: Remove crumbs from src/pages/admin/Dashboard.tsx

**Files:**

- Modify: `src/pages/admin/Dashboard.tsx`

- [ ] **Step 1: Remove the crumbs div**

### Task 3: Remove crumbs from src/pages/admin/DeployMission.tsx

... [and so on for all 23 files]
