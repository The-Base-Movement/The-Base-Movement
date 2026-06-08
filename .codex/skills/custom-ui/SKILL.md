---
name: custom-ui
description: Use when changing The Base Movement custom dashboard/admin UI, layout classes, inline styles, buttons, badges, panels, modals, dropdowns, typography, or Material Symbols icons.
---

# Purpose

Guide UI-only work for The Base Movement custom dashboard/admin design system.

# When to use

Use this skill when the task involves:

- Dashboard/admin layout, panels, buttons, badges, modals, dropdowns, spacing, typography, or icons.
- Migrating legacy UI toward project tokens without changing behavior.

# Project context

The project uses `src/index.css` plus inline styles and style objects. Migrated pages must avoid Tailwind utility conversion, shadcn, Lucide, and new UI libraries. Icons are Material Symbols.

# Inspect first

- `AGENTS.md`
- `src/index.css`
- Target page/component under `src/pages` or `src/components`
- `src/components/admin/AdminPageHeader.tsx`
- `src/components/DashboardLayout.tsx`
- `src/components/layouts/AdminLayout.tsx`

# Docs to check

- `docs/audits/layout_guidelines.md`
- `docs/audits/border-radius-token-audit-2026-05-26.md`
- `docs/design-system-handoff/the-base-movement-design-system/project/ui_kits/dashboard/index.html`

# Avoid touching

- `supabase/`
- `src/routes.tsx`
- Auth services and route guards unless explicitly required.

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

Use `.main`, `.panel`, `.ph`, `.btn*`, `.pill*`, `.sidebar-main`, `.main-sidebar`, radius tokens, `hsl(var(...))`, Public Sans, and Material Symbols. Do not add Tailwind, shadcn, Lucide, or a new component library.

# Validation

- `npm run typecheck`
- `npm run build` when the change affects public/dashboard/admin shared surfaces.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
