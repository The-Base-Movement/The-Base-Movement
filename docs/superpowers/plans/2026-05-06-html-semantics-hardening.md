# HTML Semantics & Accessibility Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the platform's structural integrity by replacing generic `<div>` containers with semantic HTML elements (<article>, <aside>, <section>, <dl>) to improve SEO, accessibility, and AI data extraction.

**Architecture:** This is a UI-layer refactoring. We will surgically replace tags in component templates while maintaining existing CSS classes and logic.

**Tech Stack:** React (TypeScript), Tailwind CSS.

---

### Task 1: Navigation & Layout Semantics

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Breadcrumbs.tsx`
- Modify: `src/components/DashboardLayout.tsx`

- [ ] **Step 1: Add ARIA labels to navigation**
In `Navbar.tsx`, update the `<nav>` tag:
```tsx
<nav aria-label="Main Navigation" className="...">
```

- [ ] **Step 2: Update Breadcrumbs semantics**
In `Breadcrumbs.tsx`, ensure the `<nav>` has a descriptive ARIA label:
```tsx
<nav aria-label="Breadcrumb" className="...">
```

- [ ] **Step 3: Update Dashboard Sidebar semantics**
In `DashboardLayout.tsx`, change the sidebar container to `<aside aria-label="Dashboard Sidebar">` if it's currently a generic `nav` or `div`.

- [ ] **Step 4: Commit**
```bash
git add src/components/Navbar.tsx src/components/Breadcrumbs.tsx src/components/DashboardLayout.tsx
git commit -m "style: add semantic labels to navigation and sidebars"
```

### Task 2: Component-Level Semantics (Articles & Units)

**Files:**
- Modify: `src/components/BlogPostCard.tsx`
- Modify: `src/components/MemberProfileCard.tsx`
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Standardize Blog Cards**
Ensure `BlogPostCard.tsx` uses `<article>` (currently likely used, but verify).

- [ ] **Step 2: Update Member Profile Cards**
In `MemberProfileCard.tsx`, change the outer `<div>` to `<article aria-labelledby="member-name">` to signal a self-contained identity unit.

- [ ] **Step 3: Update Product Cards**
In `ProductCard.tsx`, change the outer container to `<article aria-labelledby="product-name">`.

- [ ] **Step 4: Commit**
```bash
git add src/components/BlogPostCard.tsx src/components/MemberProfileCard.tsx src/components/ProductCard.tsx
git commit -m "style: upgrade cards to semantic <article> elements"
```

### Task 3: Statistical Data Semantics (Home & Dashboard)

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/admin/Dashboard.tsx`

- [ ] **Step 1: Use Description Lists for Stats on Home**
In `Home.tsx`, replace the stats `<div>` grid with a `<dl>` (Description List) and use `<dt>` for labels and `<dd>` for counts.

- [ ] **Step 2: Use Description Lists for Admin Stats**
In `admin/Dashboard.tsx`, apply the same `<dl>`, `<dt>`, `<dd>` pattern for the metrics cards.

- [ ] **Step 3: Commit**
```bash
git add src/pages/Home.tsx src/pages/admin/Dashboard.tsx
git commit -m "style: implement semantic description lists for statistical data"
```

### Task 4: Sectional Hierarchy Polish

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/OurAgenda.tsx`

- [ ] **Step 1: Add ARIA linking on Home**
In `Home.tsx`, ensure every `<section>` is linked to its heading:
```tsx
<section aria-labelledby="updates-heading">
  <h2 id="updates-heading">Latest Updates</h2>
</section>
```

- [ ] **Step 2: Update Agenda Pillars**
In `OurAgenda.tsx`, wrap each pillar in a `<section aria-labelledby="...">` with unique IDs for each heading.

- [ ] **Step 3: Commit**
```bash
git add src/pages/Home.tsx src/pages/OurAgenda.tsx
git commit -m "style: harden sectional hierarchy and ARIA linking"
```
