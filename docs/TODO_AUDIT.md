# 🛡️ Project Audit & Refactoring Plan

This document outlines the tasks required to harden "The Base" platform's codebase, ensuring structural integrity, semantic excellence, and component modularity.

## 1. HTML Integrity & Structural Fixes (Priority: High)
Audit results indicate several potential tag mismatches and unclosed elements in large files.
- [x] **`src/pages/Register.tsx`**: Resolved — file has been fully modularised into sub-components.
- [x] **`src/pages/Dashboard.tsx`**: Resolved — structural issues in stats/grid fixed; sub-components extracted.
- [x] **`src/pages/admin/Settings.tsx`**: Resolved — all tabs extracted into dedicated components.
- [x] **`src/pages/admin/Store.tsx`**: Repair table and dialog nesting issues. Resolved via full modularization.
- [x] **`src/pages/ProfileSettings.tsx`**: Correct mismatched tags in form sections. Reviewed and verified.

## 2. Component Modularization (Refactoring)
Large files (>30KB) should be split into focused sub-components to improve maintainability and readability.

### A. Registration Flow (`src/pages/Register.tsx`)
- [x] Create `src/pages/register/components/` directory.
- [x] Extract `ChoiceStep` component.
- [x] Extract `RegistrationForm` (with internal sub-steps 1-4).
- [x] Extract `SuccessStep` (with MembershipCard and Next Steps).

### B. Admin Settings (`src/pages/admin/Settings.tsx`)
- [x] Create `src/pages/admin/settings/components/` directory.
- [x] Extract `ProfileSettingsTab`.
- [x] Extract `RolesManagementTab`.
- [x] Extract `SystemPreferencesTab`.
- [x] Extract `MovementInfoTab`.
- [x] Extract `SecuritySettingsTab`.
- [x] Extract `ButtonCustomizerTab`.
- [x] Extract `AuditLogTab`.

### C. Admin Store Management (`src/pages/admin/Store.tsx`)
- [x] Create `src/pages/admin/store/components/` directory.
- [x] Extract `InventoryTable`.
- [x] Extract `ProductFormDialog`.
- [x] Extract `StoreStatsOverview`.
- [x] Extract `ResourceRequestsTab`.
- [x] Extract `LogisticsAuditTab`.

### D. User Dashboard (`src/pages/Dashboard.tsx`)
- [x] Extract `StatCards`.
- [x] Extract `QuickActions`.
- [x] Extract `ActivityFeed`.
- [x] Implement `AchievementsAndLeaderboard` component.

### E. Donate Page (`src/pages/Donate.tsx`)
- [x] Extract `HeroStats`.
- [x] Extract `StrategicPriorities`.
- [x] Extract `MobilizationProtocol`.
- [x] Extract `VictoriesSection`.
- [x] Extract `OperationalTransparency`.
- [x] Extract `AuditModal`.

### F. Product Details (`src/pages/ProductDetails.tsx`)
- [x] Split large template into modular components (Image Gallery, Product Info, Reviews, Related Products).

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
- [x] Resolve `any` type usage — `RegistrationForm`, `ButtonCustomizerTab`, `MovementInfoTab`, `SecuritySettingsTab`, `ProfileSettingsTab`.
- [x] Fix broken relative import paths from nested component refactors (e.g., `MembershipCard` using `@/` alias).
- [x] Fix `Notification.priority` type mismatch in `ActivityFeed` — replaced with `type` field.
- [x] Fix duplicate component imports in `Dashboard.tsx` causing `Duplicate identifier` errors.
- [x] Fix `RefObject<HTMLInputElement>` → `RefObject<HTMLInputElement | null>` for React 19 typing compatibility.

---
**Status**: `IN PROGRESS` | **Last Updated**: 2026-05-11 (Updated with Donate and ProductDetails)
