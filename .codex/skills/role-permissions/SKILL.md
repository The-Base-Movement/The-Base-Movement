---
name: role-permissions
description: Use when changing admin roles, permissions, administrator provisioning/revocation, gated operations, finance/executive roles, or role-based UI visibility.
---

# Purpose

Guide admin role, permission, access control, and privileged data changes.

# When to use

Use this skill when the task involves:

- Admin roles, permissions, administrator provisioning/revocation, gated actions, finance/executive roles, or role-based UI.

# Project context

Role logic appears in `adminService`, `roleService`, `src/types/admin.ts`, `src/pages/admin/Administrators.tsx`, and settings role components. Migrations enforce role constraints and RLS.

# Inspect first

- `AGENTS.md`
- `src/services/adminService.ts`
- `src/services/roleService.ts`
- `src/types/admin.ts`
- `src/pages/admin/Administrators.tsx`
- `src/pages/admin/settings/components/RolesManagementTab.tsx`
- Relevant migrations.

# Docs to check

- `docs/database/users-column-security.md`
- `docs/audits/executive-finance-approval-audit-2026-06-03.md`
- Role/permission feature specs.

# Avoid touching

- Public member UI unless role visibility affects it.
- Existing migrations unrelated to role behavior.

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

Do not broaden privileged access casually. Preserve hidden privileged viewer behavior and admin-gated national ID RPC rules.

# Validation

- `npm run typecheck`
- `npm run test:run` when covered.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
