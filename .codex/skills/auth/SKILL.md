---
name: auth
description: Use when changing Supabase auth, login, logout, sessions, password reset/change, OTP, protected routes, verified-member gates, or auth-backed profile data.
---

# Purpose

Guide authentication, session, guard, verification, password, and user identity changes.

# When to use

Use this skill when the task involves:

- Login, logout, sessions, password reset/change, OTP, route guards, verified member access, or auth-backed profile data.

# Project context

Supabase client is a singleton using sessionStorage auth tokens. `AuthContext` owns session/user state and activity logging. Guards live in `ProtectedRoute`, `ProtectedAdminRoute`, and `VerifiedRoute`.

# Inspect first

- `AGENTS.md`
- `src/lib/supabase.ts`
- `src/context/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/ProtectedAdminRoute.tsx`
- `src/components/VerifiedRoute.tsx`
- `src/services/authService.ts`
- Target auth page.

# Docs to check

- `docs/database/users-column-security.md` when user columns are involved.
- `docs/audits/csv-member-password-flow.md`

# Avoid touching

- Migrations unless schema/security changes are explicitly required.
- Public routes not related to auth.

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

Do not weaken sessionStorage token behavior. Preserve admin/member route split. Never read `users.national_id` directly.

# Validation

- `npm run typecheck`
- `npm run test:run`

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
