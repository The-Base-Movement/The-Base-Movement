# 🛡️ Project Audit & Refactoring Plan

This document outlines the tasks required to harden "The Base" platform's codebase, ensuring structural integrity, semantic excellence, and component modularity.

## 1. HTML Integrity & Structural Fixes (Priority: High)
Audit results indicate several potential tag mismatches and unclosed elements in large files.
- [ ] **`src/pages/Register.tsx`**: Fix mismatched `</div>` and `</Button>` tags identified in the `submitted` and `choice` blocks.
- [ ] **`src/pages/Dashboard.tsx`**: Resolve structural issues in the stats and grid layouts.
- [ ] **`src/pages/admin/Settings.tsx`**: Fix numerous tag mismatches caused by high complexity and nesting.
- [ ] **`src/pages/admin/Store.tsx`**: Repair table and dialog nesting issues.
- [ ] **`src/pages/ProfileSettings.tsx`**: Correct mismatched tags in form sections.

## 2. Component Modularization (Refactoring)
Large files (>30KB) should be split into focused sub-components to improve maintainability and readability.

### A. Registration Flow (`src/pages/Register.tsx`)
- [x] Create `src/pages/register/components/` directory.
- [x] Extract `ChoiceStep` component.
- [x] Extract `RegistrationForm` (with internal sub-steps 1-4).
- [x] Extract `SuccessStep` (with MembershipCard and Next Steps).

### B. Admin Settings (`src/pages/admin/Settings.tsx`)
- [ ] Create `src/pages/admin/settings/components/` directory.
- [ ] Extract `ProfileSettingsTab`.
- [ ] Extract `RolesManagementTab`.
- [ ] Extract `SystemPreferencesTab`.
- [ ] Extract `MovementInfoTab`.
- [ ] Extract `SecuritySettingsTab`.
- [ ] Extract `ButtonCustomizerTab`.
- [ ] Extract `AuditLogTab`.

### C. Admin Store Management (`src/pages/admin/Store.tsx`)
- [ ] Extract `InventoryTable`.
- [ ] Extract `ProductFormDialog`.
- [ ] Extract `StoreStatsOverview`.

### D. User Dashboard (`src/pages/Dashboard.tsx`)
- [ ] Extract `StatCards`.
- [ ] Extract `QuickActions`.
- [ ] Extract `ActivityFeed`.

## 3. Semantic HTML & SEO Hardening
- [ ] Audit all pages for generic `div` usage; replace with:
    - `<header>` for navigation and page intros.
    - `<main>` for primary content.
    - `<section>` for logical content blocks.
    - `<article>` for blog posts or standalone items.
    - `<aside>` for sidebars.
    - `<footer>` for page/section endings.
- [ ] Ensure proper heading hierarchy (H1 -> H2 -> H3).
- [ ] Add `aria-label` and `role` attributes where semantics are ambiguous.

## 4. Design Principle Compliance ("Ghana First")
Verify adherence to `docs/typography_modernization.md`.
- [ ] **Typography**: Ensure `normal-case`, `font-bold`, and `tracking-tight` are used consistently. Purge any remaining `uppercase` or `tracking-wider`.
- [ ] **Colors**: Ensure use of CSS variables (`--brand-red`, `--brand-gold`, `--brand-green`) instead of hardcoded hex values.
- [ ] **Interactive Elements**: Verify that all buttons use the standardized `neon-button` variants.

## 5. Code Quality & Linting (Priority: Ongoing)
- [x] Remove stale React imports from React 17+ components.
- [x] Fix unused variables and imports in extracted components (`ArrowLeft`, `Button`).
- [x] Resolve `any` type usage in strict files (e.g., `RegistrationForm.tsx`).
- [x] Fix broken relative import paths from nested component refactors (e.g., `MembershipCard` using `@/` alias).

---
**Status**: `IN PROGRESS` | **Last Updated**: 2026-05-11
