# Bug Fix Workflow

## Purpose

Diagnosing and fixing bugs in The Base Movement platform — UI rendering issues, data fetch failures, TypeScript errors, auth guards misbehaving, or service layer problems.

## When to use

Use this workflow when the task involves:

- Fixing a runtime error or console warning
- Fixing a TypeScript type error
- Fixing incorrect data display
- Fixing a broken form submission or action
- Fixing a navigation or routing issue
- Fixing an auth guard (ProtectedRoute, ProtectedAdminRoute, VerifiedRoute)
- Fixing a Supabase query error or RLS issue
- Fixing a build error

## Project context

- Services are the only layer that calls Supabase — all fixes to data fetching go in `src/services/`
- Auth is managed by `src/context/AuthContext.tsx` + `src/lib/supabase.ts`
- Route guards: `ProtectedRoute`, `ProtectedAdminRoute`, `VerifiedRoute` in `src/components/`
- RLS issues often come from missing column grants on `public.users` (see CLAUDE.md Database Security Notes)
- `adminService.ts` is 92 KB — search within it, never read the whole file
- `src/types/admin.ts` is 922 lines — grep for the specific type

## Inspect first

- The specific page or component file named in the bug report
- The relevant service file (grep for the function name)
- `src/context/AuthContext.tsx` if auth-related
- `src/components/ProtectedRoute.tsx` / `ProtectedAdminRoute.tsx` if route guard issue
- `supabase/migrations/` — latest migration files if RLS-related
- `src/lib/supabase.ts` — client configuration if connection issues

## Docs to check

- `docs/database/users-column-security.md` — if the bug involves missing data on `users` table
- `docs/database/` — if the bug involves schema expectations

## Avoid touching

- Unrelated components or pages
- `src/routes.tsx` — unless the bug is specifically a routing issue
- `supabase/migrations/` — only touch if RLS or schema fix is required
- Styling system — bug fixes do not restyle components

## Workflow

1. Read CLAUDE.md — identify which layer the bug lives in.
2. Identify the specific file(s) responsible — do not scan the whole repo.
3. Read only the relevant section of the file (use line offsets if the file is large).
4. Identify the root cause — do not bypass safety checks or guards.
5. Apply the smallest safe patch.
6. If the fix touches `public.users` schema: add GRANT SELECT for the new column.
7. Run `npm run typecheck`.
8. Run `npm run lint` if ESLint-relevant.
9. Summarize: what the bug was, what caused it, what was changed.

## Project rules

- Never use `--no-verify` to bypass lint hooks.
- Never bypass RLS by switching to service_role in client code.
- Never read `national_id` directly from the `users` table — use `admin_get_national_id(reg_no)` RPC.
- Fix the root cause — do not add workarounds that hide the error.
- Do not refactor surrounding code while fixing a bug.

## Validation

```bash
npm run typecheck
npm run lint
```

## Token-saving behavior

- Read only the file/section where the bug lives.
- Grep service files rather than reading them fully.
- Do not scan unrelated components.
- Do not print file contents — describe the change as a diff.
- Stop after the bug is fixed and validated.
