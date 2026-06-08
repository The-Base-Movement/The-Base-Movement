# Workflow Index — The Base Movement

Use the workflow files in this directory to guide common development tasks. Each workflow tells you which files to inspect first, which docs to check, and what to avoid — so you don't scan the full repo unnecessarily.

---

## Global Forbidden Assumptions

- **No Figma** — do not assume Figma is used; use `docs/design-system-handoff/` as the visual reference
- **No Tailwind** — do not add Tailwind classes to dashboard or admin pages
- **No shadcn/ui** — `components.json` is legacy config; do not use shadcn components in migrated pages
- **No Lucide icons** — use Material Symbols (`<span className="material-symbols-outlined">`)
- **No new UI/icon libraries** — do not introduce external UI libraries unless explicitly requested

---

## Available Workflows

| Workflow                                     | Purpose                                                 | Inspect First                                                           | Docs                                     | Validation                              |
| -------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| [custom-ui.md](custom-ui.md)                 | UI components, layouts, modals, badges, dropdowns       | `src/index.css` (grep), `src/components/`                               | `docs/design-system-handoff/`            | `npm run typecheck`                     |
| [kpi-dashboard.md](kpi-dashboard.md)         | KPI tiles, stat cards, charts, metric panels            | `src/pages/admin/Dashboard.tsx`, `src/pages/admin/dashboard/`           | none                                     | `npm run typecheck`                     |
| [bugfix.md](bugfix.md)                       | Runtime errors, type errors, data issues, auth loops    | Specific broken file, relevant service                                  | `docs/database/` (if DB-related)         | `npm run typecheck`, `npm run lint`     |
| [forms.md](forms.md)                         | Form fields, validation, multi-step flows, registration | Form component file, `src/types/registration.ts`                        | none                                     | `npm run typecheck`                     |
| [auth.md](auth.md)                           | Login, session, route guards, OTP, role checks          | `src/context/AuthContext.tsx`, `src/services/authService.ts`            | `docs/database/users-column-security.md` | `npm run typecheck`                     |
| [database.md](database.md)                   | Schema, migrations, RLS, RPCs, column grants            | `supabase/migrations/` (recent 5), relevant service                     | `docs/database/`                         | `npm run typecheck`, `supabase db push` |
| [deployment.md](deployment.md)               | Deploy frontend, edge functions, migrations             | `vercel.json`, `package.json` scripts                                   | none                                     | `npm run typecheck`, `npm run build`    |
| [admin-panel.md](admin-panel.md)             | Admin pages, CRUD, navigation, IT Department            | `src/pages/admin/<Page>.tsx`, `src/services/adminService.ts` (grep)     | none                                     | `npm run typecheck`                     |
| [role-permissions.md](role-permissions.md)   | Admin RBAC, route guards, RLS policies                  | `src/services/roleService.ts`, `src/components/ProtectedAdminRoute.tsx` | none                                     | `npm run typecheck`                     |
| [email-templates.md](email-templates.md)     | Transactional emails, newsletters, SMS                  | `supabase/functions/_shared/email-templates.ts`                         | `docs/Messaging-Templates/`              | `supabase functions deploy`             |
| [reports.md](reports.md)                     | Analytics pages, charts, finance reports, export        | Specific analytics page, analytics services                             | none                                     | `npm run typecheck`                     |
| [docs-architecture.md](docs-architecture.md) | Reading docs to understand features/schema/rules        | `docs/` listing                                                         | All of `docs/`                           | none                                    |

---

## Which Workflow to Use

| Task description                       | Workflow                     |
| -------------------------------------- | ---------------------------- |
| "Add a KPI card to the dashboard"      | kpi-dashboard                |
| "Fix a bug on the Members admin page"  | bugfix → admin-panel         |
| "Add a field to the registration form" | forms + database             |
| "Change login redirect behavior"       | auth                         |
| "Deploy the latest changes"            | deployment                   |
| "Add a new admin page"                 | admin-panel                  |
| "Change who can access a page"         | role-permissions             |
| "Fix a welcome email"                  | email-templates              |
| "Add a chart to the analytics page"    | reports                      |
| "Style a new button"                   | custom-ui                    |
| "Understand the database schema"       | docs-architecture → database |
| "Add a migration"                      | database                     |

---

## Key Large Files (always search, never read in full)

| File                           | Size      | How to use                     |
| ------------------------------ | --------- | ------------------------------ |
| `src/services/adminService.ts` | 92 KB     | Grep for the function name     |
| `src/index.css`                | 52 KB     | Grep for the class or variable |
| `src/types/admin.ts`           | 922 lines | Grep for the specific type     |
| `src/utils/mapUtils.ts`        | 45 KB     | Read only if map-related       |
| `docs/gh.json`                 | 1.2 MB    | Do not read — GeoJSON only     |

---

## Validation Commands (real scripts only)

```bash
npm run typecheck   # Always run after TypeScript changes
npm run lint        # Run after significant edits
npm run build       # Run before deployment
npm run test:run    # Run for test changes
supabase db push    # Apply DB migrations
supabase functions deploy <name>  # Deploy edge function
```
