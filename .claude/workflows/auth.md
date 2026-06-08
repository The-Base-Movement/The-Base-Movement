# Auth Workflow

## Purpose

Working with authentication, session management, route guards, role-based access, and member verification in The Base Movement platform.

## When to use

Use this workflow when the task involves:

- Changing login, logout, or session behavior
- Modifying route guards (ProtectedRoute, ProtectedAdminRoute, VerifiedRoute)
- Changing role-based access logic
- Adding a new protected route
- Debugging auth redirect loops
- Modifying OTP verification flow
- Modifying password reset flow
- Changing admin permission checks

## Project context

- Auth provider: Supabase Auth (JWT sessions)
- Client: `src/lib/supabase.ts` (singleton Supabase client)
- Auth context: `src/context/AuthContext.tsx` — session, user, isLoading, signOut()
- Auth service: `src/services/authService.ts` — login, signup, logout, password, profile updates
- Route guards:
  - `src/components/ProtectedRoute.tsx` — requires authenticated session
  - `src/components/ProtectedAdminRoute.tsx` — requires admin role
  - `src/components/VerifiedRoute.tsx` — requires verified member status
- Role data: `src/services/roleService.ts` + `src/types/admin.ts` (AdminRole, AdminPermission)
- OTP flow: `src/pages/VerifyOTP.tsx` → `supabase/functions/send-otp/` + `verify-otp-and-reset/`
- Password reset: `src/pages/ForgotPassword.tsx` + `src/pages/ChangePassword.tsx`
- Admin login: `src/pages/admin/Login.tsx` (separate from member login)

## Inspect first

- `src/context/AuthContext.tsx`
- `src/services/authService.ts`
- `src/components/ProtectedRoute.tsx`
- `src/components/ProtectedAdminRoute.tsx`
- `src/components/VerifiedRoute.tsx`
- `src/routes.tsx` — for route guard placement
- `src/services/roleService.ts` — if role/permission change

## Docs to check

- `docs/database/users-column-security.md` — if auth query touches `public.users`

## Avoid touching

- UI components not related to auth flows
- `supabase/migrations/` — unless auth schema changes are required
- `src/services/adminService.ts` — auth issues do not require touching this large file

## Workflow

1. Read CLAUDE.md — note database security rules for `public.users`.
2. Identify which layer the auth issue is in (context, guard, service, or Supabase function).
3. Read only the relevant auth file.
4. Inspect the specific route guard if a routing issue.
5. For OTP/reset: check the relevant edge function in `supabase/functions/`.
6. Apply the smallest safe patch.
7. Do not bypass RLS or switch to service_role in client code.
8. Run `npm run typecheck`.
9. Summarize changed files.

## Project rules

- Never use `service_role` key in client-side code.
- Never read `national_id` directly from `users` — use `admin_get_national_id(reg_no)` RPC.
- Auth state flows down from `AuthContext` — do not duplicate session fetching in pages.
- `ProtectedAdminRoute` checks role; `VerifiedRoute` checks member status.
- OTP dispatch goes through Supabase Edge Function `send-otp` (Africa's Talking SMS).
- Always redirect to the correct layout post-login (admin → `/admin/dashboard`, member → `/dashboard`).

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Do not read `adminService.ts` for auth tasks.
- Read auth files only — do not scan page components.
- Stop after the auth change is complete.
