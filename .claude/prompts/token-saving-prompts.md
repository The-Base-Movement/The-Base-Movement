# Token-Saving Prompt Templates — The Base Movement

Paste these prompts at the start of new agent sessions to orient the session quickly without re-scanning the whole repo.

---

## 1. Small Bug Fix

```
Read CLAUDE.md first. Then use .claude/workflows/bugfix.md.

Task: [describe the bug here — include the page name, what breaks, and any error message]

Constraints:
- Inspect only the files where the bug lives.
- Do not scan unrelated components or services.
- Apply the smallest safe patch.
- Do not refactor surrounding code.
- Preserve all existing inline styles.
- Run npm run typecheck after the fix.
- Summarize: what was broken, what caused it, what changed.
```

---

## 2. Custom UI-Only Change

```
Read CLAUDE.md first. Then use .claude/workflows/custom-ui.md.

Task: [describe the UI change — page name, component, what should look different]

Constraints:
- Do not use Tailwind utility classes.
- Do not use shadcn/ui components.
- Do not use Lucide icons — use Material Symbols.
- Use hsl(var(--token)) for colors.
- Use var(--radius-xs/sm/md/lg/pill) for border radius.
- Preserve all existing inline styles.
- Reuse .btn-*, .pill-*, .panel, .ph, .kpis classes from src/index.css.
- Do not touch auth, database, or routing files.
- Run npm run typecheck.
```

---

## 3. KPI Dashboard Change

```
Read CLAUDE.md first. Then use .claude/workflows/kpi-dashboard.md.

Task: [describe what KPI tile, chart, or metric panel should change]

Constraints:
- Use the KPI tile pattern from CLAUDE.md (3px left bar, var(--kpi-num-size) for number).
- Format money via src/lib/currency.ts — never inline.
- Use Recharts for charts — do not add a new chart library.
- Use only hsl(var(--token)) colors.
- Inspect only the specific dashboard component — do not scan adminService.ts in full.
- Run npm run typecheck.
```

---

## 4. Form Change

```
Read CLAUDE.md first. Then use .claude/workflows/forms.md.

Task: [describe the form change — which form, which field(s), what validation]

Constraints:
- Always boxSizing: 'border-box' on inputs.
- Input border-radius: var(--radius-xs).
- Validation via Zod schema + React Hook Form.
- Multi-step form state stays local — do not lift to global context.
- If a new DB column is needed, create a migration and add GRANT SELECT for public.users.
- Do not call Supabase directly from the form — use src/services/.
- Run npm run typecheck.
```

---

## 5. Auth Change

```
Read CLAUDE.md first. Then use .claude/workflows/auth.md.

Task: [describe the auth change — login behavior, guard, session, OTP, role check]

Constraints:
- Never use service_role key in client-side code.
- Never read national_id directly from users table.
- Auth state comes from src/context/AuthContext.tsx — do not duplicate session fetching.
- Inspect only auth-related files (AuthContext, authService, ProtectedRoute, VerifiedRoute).
- For OTP: check supabase/functions/send-otp/ and verify-otp-and-reset/.
- Run npm run typecheck.
```

---

## 6. Database / API Change

```
Read CLAUDE.md first, especially the Database Security Notes section. Then use .claude/workflows/database.md.

Task: [describe the schema change — table, column, RLS policy, RPC, or service query]

Constraints:
- List recent migrations before writing a new one.
- Never edit an existing migration — always create a new one.
- Every new column on public.users needs GRANT SELECT for authenticated and anon.
- Never expose national_id in client queries — use admin_get_national_id(reg_no) RPC.
- Update the TypeScript type after the schema change.
- Update the service function to use the new column.
- Run npm run typecheck after service changes.
- Apply migration with supabase db push.
```

---

## 7. SEO / Page Content Change

```
Read CLAUDE.md first.

Task: [describe the SEO or content change — page name, meta tag, heading, body text]

Constraints:
- SEO meta tags use src/components/SEO.tsx (React Helmet Async).
- Do not modify layout shells (PublicLayout, DashboardLayout).
- Prerendered public routes: Home, About, Blog, Agenda, Contact, Donate, Store, Impact, Polls, Chapters, Constituencies, Privacy, Terms, Press — changes here will appear in static output.
- Do not add Tailwind or shadcn.
- Preserve all existing inline styles.
- Run npm run typecheck.
```

---

## 8. Email Template Change

```
Read CLAUDE.md first. Then use .claude/workflows/email-templates.md.

Task: [describe the email change — which transactional email, what should change]

Constraints:
- Email HTML must use inline CSS — not external stylesheets.
- Brand colors: green #006B3F, gold #DAA520, red #CE1126.
- Check docs/Messaging-Templates/ for approved messaging language.
- Read supabase/functions/_shared/email-templates.ts and the specific edge function only.
- Edge functions use Deno — use deno-compatible imports from supabase/import_map.json.
- Do not scan frontend services for email tasks.
- Deploy with: supabase functions deploy <function-name>.
```

---

## 9. Deployment / Debug Task

```
Read CLAUDE.md first. Then use .claude/workflows/deployment.md.

Task: [describe what needs to be deployed or debugged]

Constraints:
- Run npm run typecheck first — fix all type errors before building.
- Run npm run build — fix any build errors.
- Push to main — Vercel auto-deploys.
- For edge functions: supabase functions deploy <name>.
- For migrations: supabase db push.
- Do not commit .env files.
- Do not add new external script domains without updating vercel.json CSP.
```

---

## 10. Docs-Based Feature Task

```
Read CLAUDE.md first. Then use .claude/workflows/docs-architecture.md.

Task: [describe the feature — what it should do, which domain it belongs to]

Constraints:
- Check docs/ first to understand the intended behavior before implementing.
- Do not paste large doc sections — summarize only what is relevant.
- Check docs/database/ for any schema expectations.
- After reading docs, use the relevant implementation workflow (forms, admin-panel, database, etc.).
- Preserve all existing inline styles.
- Do not introduce Tailwind, shadcn, or Lucide.
- Run npm run typecheck.
```

---

## 11. Safe Refactor

```
Read CLAUDE.md first.

Task: [describe what to refactor — function, component, or pattern]

Constraints:
- Do not change any visible behavior.
- Do not restyle any component.
- Do not change any CSS variables or inline styles.
- Do not introduce new dependencies.
- Refactor only the specific file(s) named in the task.
- Run npm run typecheck after the refactor.
- Run npm run lint.
- Summarize: what changed structurally, what was preserved.
```

---

## 12. Performance Cleanup

```
Read CLAUDE.md first.

Task: [describe the performance issue — slow page, large bundle, slow query]

Constraints:
- Do not introduce new dependencies for performance.
- For bundle size: check vite.config.ts for existing chunk splitting before adding a new chunk.
- For query performance: grep the relevant service for the query.
- Do not add indexes without a migration.
- Do not lazy-load routes already handled in src/routes.tsx.
- Do not change any visible behavior or styling.
- Run npm run typecheck.
- Run npm run build to check bundle size.
```
