# Role & Permissions Workflow

## Purpose

Managing role-based access control (RBAC) for admin users, including adding/modifying roles, permissions, and route guards in The Base Movement platform.

## When to use

Use this workflow when the task involves:

- Adding a new admin role or permission
- Restricting a page or action to a specific role
- Modifying what admin roles can see or do
- Debugging a permission-denied error for an admin action
- Reviewing or updating RLS policies that use role checks
- Modifying the Roles Manager admin page

## Project context

- Role types: `src/types/admin.ts` — grep for `AdminRole`, `AdminPermission`
- Role service: `src/services/roleService.ts` (2.5 KB)
- Route guard: `src/components/ProtectedAdminRoute.tsx` — checks admin role
- Admin roles managed via: `src/pages/admin/RolesManager.tsx`
- Granular permissions stored in Supabase DB (roles + permissions tables)
- Role checks happen in both the frontend guard and Supabase RLS policies
- Member verification status is separate from admin roles — handled by `VerifiedRoute`

## Inspect first

- `src/services/roleService.ts`
- `src/components/ProtectedAdminRoute.tsx`
- `src/types/admin.ts` — grep for `AdminRole` and `AdminPermission`
- `src/pages/admin/RolesManager.tsx`
- Recent migrations in `supabase/migrations/` — grep for `role` or `permission`

## Docs to check

- not available

## Avoid touching

- `src/context/AuthContext.tsx` — auth context does not handle roles directly
- UI pages unrelated to role management
- `adminService.ts` unless the role change requires admin data changes

## Workflow

1. Read CLAUDE.md for auth and database security notes.
2. Identify whether the change is frontend (guard) or backend (RLS policy) or both.
3. Read `roleService.ts` fully (it is small).
4. Grep `admin.ts` for the relevant role/permission types.
5. For frontend guard: modify `ProtectedAdminRoute.tsx`.
6. For RLS: create a new migration with the policy change.
7. Update TypeScript types if new roles/permissions are added.
8. Run `npm run typecheck`.
9. Summarize what changed.

## Project rules

- Role checks must exist on both frontend (guard) AND backend (RLS) — never only one.
- Do not hard-code role strings in multiple places — define them in types and reuse.
- Member `VerifiedRoute` is separate from admin RBAC — do not conflate them.
- New permission types added to `AdminPermission` must also be added to the DB enum.

## Validation

```bash
npm run typecheck
supabase db push  # if migration was added
```

## Token-saving behavior

- `roleService.ts` is small — read it fully.
- Grep `admin.ts` for types rather than reading the full 922-line file.
- Read only the guard or policy file being changed.
- Stop after the role/permission change is complete.
