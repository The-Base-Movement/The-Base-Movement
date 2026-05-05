# Admin Font Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Admin panel typography with frontend brand fonts (Public Sans / Work Sans).

**Architecture:** Replace inconsistent font classes (Inter, Outfit) with brand standard classes (`font-meta`, `font-body-md`).

**Tech Stack:** React, Tailwind CSS.

---

### Task 1: Update Admin Layout Typography

**Files:**
- Modify: `src/components/layouts/AdminLayout.tsx`

- [x] **Step 1: Replace font-inter with font-meta**
    The Admin panel currently uses `font-inter`, which isn't part of the brand's primary font set. We will switch the root container to `font-meta` (Public Sans).

```tsx
// src/components/layouts/AdminLayout.tsx
// Find: font-inter
// Replace with: font-meta
```

- [x] **Step 2: Commit**
```bash
git add src/components/layouts/AdminLayout.tsx
git commit -m "style: switch Admin panel base font to Public Sans (font-meta)"
```

---

### Task 2: Remove Inconsistent Font Classes from Admin Pages

**Files:**
- Modify: `src/pages/admin/Authors.tsx`
- Modify: `src/pages/admin/Blogs.tsx`

- [x] **Step 1: Remove font-outfit from Authors.tsx**
    Replace `font-outfit` with `font-meta`.

- [x] **Step 2: Update TinyMCE font-family in Blogs.tsx**
    Update the `content_style` to use "Public Sans".

- [x] **Step 3: Commit**
```bash
git add src/pages/admin/Authors.tsx src/pages/admin/Blogs.tsx
git commit -m "style: remove inconsistent font classes and update editor typography"
```

---

### Task 3: Global Font Audit & Refinement

- [x] **Step 1: Run a global search for deprecated fonts**
    Check for any remaining occurrences of `font-inter` or `font-outfit` in the `src/` directory.

- [x] **Step 2: Replace remaining instances**
    If found, replace them with `font-meta` or `font-body-md`.

- [x] **Step 3: Commit**
```bash
git commit -m "style: final global font unification"
```
