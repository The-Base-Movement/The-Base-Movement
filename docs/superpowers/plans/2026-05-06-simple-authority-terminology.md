# Simple Authority Terminology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic terminology with grounded, simple, high-authority words like "The Plan", "Supplies", "Verified", and "Updates" across the platform UI and metadata.

**Architecture:** This is a UI-level refactoring. We will surgically replace text strings in navigation, page headings, buttons, and SEO metadata while keeping underlying routes and logic stable.

**Tech Stack:** React (TypeScript), Tailwind CSS.

---

### Task 1: Navigation Unification (Navbar & Footer)

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Update Navbar links**
Change "Our Agenda" to "The Plan", "Blog" to "Updates", and "Store" to "Supplies".

- [ ] **Step 2: Update Footer links**
Ensure Footer matches Navbar terminology. Update headings from "Movement" to "Foundation".

- [ ] **Step 3: Commit**
```bash
git add src/components/Navbar.tsx src/components/Footer.tsx
git commit -m "style: update navigation to simple authority terms"
```

### Task 2: Dashboard Sidebar & Layout

**Files:**
- Modify: `src/components/DashboardLayout.tsx`

- [ ] **Step 1: Update Sidebar menu items**
Replace generic labels with:
- "Dashboard" -> "Overview"
- "Our Agenda" -> "The Plan"
- "Blog" -> "Updates"
- "Store" -> "Supplies"
- "Members" -> "Verified"
- "Polls" -> "Feedback"

- [ ] **Step 2: Commit**
```bash
git add src/components/DashboardLayout.tsx
git commit -m "style: update dashboard sidebar labels"
```

### Task 3: Public Page Headings & Metadata

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/OurAgenda.tsx`
- Modify: `src/pages/Blog.tsx`
- Modify: `src/pages/Store.tsx`

- [ ] **Step 1: Update Home Page Hero & Sections**
Change "Our Agenda" call-to-actions to "The Plan". Update section titles.

- [ ] **Step 2: Update "Our Agenda" Page Title & Content**
Change page title and primary heading to "The Plan".

- [ ] **Step 3: Update "Blog" Page Title & Content**
Change page title and primary heading to "Updates".

- [ ] **Step 4: Update "Store" Page Title & Content**
Change page title and primary heading to "Supplies".

- [ ] **Step 5: Commit**
```bash
git add src/pages/Home.tsx src/pages/OurAgenda.tsx src/pages/Blog.tsx src/pages/Store.tsx
git commit -m "style: update public page headings and titles"
```

### Task 4: Member Status & Verification Labels

**Files:**
- Modify: `src/components/MembershipCard.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Members.tsx`

- [ ] **Step 1: Update Membership Card labels**
Ensure status labels use "Verified" instead of "Active" where appropriate.

- [ ] **Step 2: Update Dashboard status badges**
Standardize status labels to "VERIFIED", "PENDING", or "REVIEW".

- [ ] **Step 3: Commit**
```bash
git add src/components/MembershipCard.tsx src/pages/Dashboard.tsx src/pages/Members.tsx
git commit -m "style: standardize verification and status labels"
```

### Task 5: SEO & Document Title Synchronization

**Files:**
- Modify: `index.html`
- Modify: `src/App.tsx` (If titles are managed via side effects or Helmet)

- [ ] **Step 1: Update index.html metadata**
Update `<title>` and `<meta name="description">` to use the new terminology.

- [ ] **Step 2: Commit**
```bash
git add index.html
git commit -m "seo: update document metadata with simple authority terms"
```
