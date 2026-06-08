# Admin Panel Workflow

## Purpose

Building, modifying, and debugging pages in the admin panel of The Base Movement — the staff-only management interface accessed via `/admin/*` routes.

## When to use

Use this workflow when the task involves:

- Adding a new admin page
- Modifying an existing admin page (members, chapters, polls, finances, orders, etc.)
- Adding admin CRUD operations (create, edit, delete records)
- Fixing admin data tables, filters, or modals
- Modifying admin navigation (sidebar, topbar)
- Working on the IT Department pages (`/admin/it/*`)
- Working on analytics, finance, or intelligence dashboards
- Modifying admin broadcasts or newsletter composition

## Project context

- Layout: `src/components/layouts/AdminLayout.tsx` (sidebar + topbar + page label context)
- Sidebar nav config: `src/components/layouts/admin/navConfig.ts`
- Standard page header component: `src/components/admin/AdminPageHeader.tsx` — use on every admin page
- 46+ admin pages in `src/pages/admin/`
- Many admin pages have a matching subdirectory (e.g., `src/pages/admin/dashboard/`, `src/pages/admin/blogs/`)
- All admin data goes through `src/services/adminService.ts` (92 KB) or a specialist service
- Admin-only components: `src/components/admin/` (cards, maps, forms, modals)
- Route guard: `ProtectedAdminRoute` — requires admin role
- IT Department has its own layout: `src/pages/admin/it/ITDepartmentLayout.tsx`

## Inspect first

- The specific admin page file: `src/pages/admin/<Page>.tsx`
- The matching subdirectory if one exists: `src/pages/admin/<page>/`
- Grep `src/services/adminService.ts` for the specific function (do NOT read the full 92 KB)
- `src/components/admin/AdminPageHeader.tsx` — for the standard header pattern
- `src/components/layouts/admin/navConfig.ts` — if adding a new nav item

## Docs to check

- not available for individual admin pages

## Avoid touching

- `src/components/layouts/AdminLayout.tsx` — unless the layout itself needs to change
- `src/context/AuthContext.tsx`
- `supabase/migrations/` — unless a schema change is required by the feature

## Workflow

1. Read CLAUDE.md — note admin layout classes, button classes, pill classes.
2. Identify the specific admin page file.
3. Check if there is a matching subdirectory for subcomponents.
4. Grep `adminService.ts` for the data-fetching function — read only that function.
5. Use `<AdminPageHeader>` at the top of every admin page.
6. Use `.panel`, `.ph`, `.btn-*`, `.pill-*` classes for consistent admin styling.
7. Use Material Symbols icons — not Lucide.
8. For new nav items: add to `navConfig.ts` only.
9. Run `npm run typecheck`.
10. Summarize changed files.

## Project rules

- Every admin page must start with `<AdminPageHeader title="..." subtitle="..." />`.
- All admin data calls go through `src/services/` — never call Supabase directly from a page.
- Admin panel uses inline styles + CSS classes from `src/index.css` — not Tailwind.
- `adminService.ts` is 92 KB — always grep for the function you need.
- The IT Department pages use `ITDepartmentLayout.tsx` as their shell — not the main AdminLayout.
- Delete actions must use `DeleteConfirmationModal` (`src/components/admin/DeleteConfirmationModal.tsx`).
- Status badges use `.pill` + `.pill-ok/warn/err/mute` — never custom colors.

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Do not read `adminService.ts` in full — grep for the function.
- Read only the admin page file being modified.
- Do not scan all admin pages.
- Stop after the admin task is complete.
