---
name: nextjs-data-exposure-guard
description: Use when auditing or changing a Next.js project that handles auth, user data, payments, private records, __NEXT_DATA__, getServerSideProps props, NEXT_PUBLIC env vars, client component props, console output, or API route errors.
---

# Next.js Data Exposure Guard

Use this skill for Next.js projects. This repo is currently React/Vite, so apply this directly only if a task touches a Next.js app or migration; otherwise use the same exposure principles through `database`, `api-routes`, `auth`, and `deployment`.

# Purpose

Prevent sensitive data from leaking into HTML source, browser console, DevTools, API responses, and client-side JavaScript bundles.

# Leak Vectors

Check these on every audit:

- `__NEXT_DATA__` over-hydration in page source.
- `NEXT_PUBLIC_` env variable misuse.
- `console.log` left in production.
- Raw error messages from API routes.
- Sensitive fields passed through page props or Client Component props.

# Inspect first

- `AGENTS.md`
- `next.config.js` or `next.config.mjs`
- `.env*`
- `app/`, `pages/`, and `pages/api/`
- Server Components that pass props to Client Components.
- `getServerSideProps`, `getStaticProps`, route handlers, and API routes.

# Audit rules

- Only pass UI-required fields to page props or Client Components.
- Never pass full user/member/payment objects across the server-client boundary.
- Treat `NEXT_PUBLIC_` variables as public information visible to anyone.
- Strip or prevent sensitive `console.log` output in production.
- Log full API errors server-side, but return generic client messages.
- Use derived booleans like `canEdit`, not raw role/permission objects, when possible.

# Sensitive fields

Never expose these unless the UI explicitly requires them for the authenticated user:

- `password`, `hashedPassword`, tokens, secrets, private keys.
- Email, phone, national ID, internal IDs, audit fields.
- Raw role/permission arrays.
- Payment references beyond public-safe receipt/status fields.
- Database error messages, file paths, stack traces, table/column internals.

# Commands

Use project-appropriate equivalents:

```bash
grep -r "NEXT_PUBLIC_" .env* 2>/dev/null
grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next .
grep -r "error\.message\|error\.stack" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next .
```

# Full audit checklist

- View page source and inspect `__NEXT_DATA__`.
- Verify no email, phone, password, token, role, permission, national ID, or internal IDs are serialized.
- Review all `NEXT_PUBLIC_` env vars and remove public prefixes from secrets.
- Review production console output.
- Review API responses after triggered errors; client should see generic messages.
- Inspect Client Component props with React DevTools.
- Confirm production and preview environments do not share unrestricted secrets.

# Project rules

- For this repo, do not introduce Next.js files unless explicitly requested.
- For current React/Vite pages, apply the same principle to Supabase service responses, component props, local/session storage, console output, and edge function responses.
- For `public.users.national_id`, use only `admin_get_national_id(reg_no)` and never expose ciphertext or plaintext through client selects.

# Validation

- Next.js project: run that project’s `next build` or equivalent.
- This repo: `npm run typecheck`; run `npm run build` for deployment/client-bundle changes.

# Token-saving behavior

- Start with the requested page/API/env surface.
- Use targeted search for sensitive field names.
- Do not scan full bundles unless the task is a release audit.
- Summarize findings by leak vector.
