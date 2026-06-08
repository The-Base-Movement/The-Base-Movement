---
name: admin-panel
description: Use when changing admin routes, admin pages, AdminLayout, admin navigation, admin tables, admin modals, admin settings, or admin service workflows.
---

# Purpose

Guide admin command center page, navigation, table, modal, and operations changes.

# When to use

Use this skill when the task involves:

- `/admin` routes, admin pages, admin layout/sidebar/topbar, admin tables, admin modals, admin services, or admin settings.

# Project context

Admin routes are lazy-loaded in `src/routes.tsx` and render inside `AdminLayout`. Standard header is `AdminPageHeader`. Admin data commonly flows through `adminService`.

# Inspect first

- `AGENTS.md`
- Target `src/pages/admin/*`
- `src/components/layouts/AdminLayout.tsx`
- `src/components/layouts/admin/*`
- `src/components/admin/AdminPageHeader.tsx`
- `src/services/adminService.ts`

# Docs to check

- `docs/audits/admin_mobile_responsiveness.md`
- `docs/audits/layout_guidelines.md`
- Relevant admin feature specs.

# Avoid touching

- Public and dashboard pages unless shared.
- Routes unless adding/removing admin pages is requested.
- Database unless admin feature needs schema changes.

# Workflow

1. Read AGENTS.md.
2. Check the listed docs only when relevant.
3. Inspect the smallest relevant file set.
4. Reuse existing project patterns.
5. Preserve custom inline styling and existing UI conventions.
6. Make the smallest safe patch.
7. Run only the relevant validation command.
8. Summarize changed files and why.

# Project rules

Use admin layout classes, Material Symbols, `AdminPageHeader`, `TacticalKPI`, mobile fallbacks, and service-layer calls. Avoid Tailwind/shadcn/Lucide.

# Validation

- `npm run typecheck`
- `npm run build` for routing or cross-admin changes.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
