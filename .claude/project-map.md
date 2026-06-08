# Project Map — The Base Movement

Quick reference for agent sessions. Read CLAUDE.md for full rules.

---

## Summary

Political movement membership platform for Ghana. Members join as Ghana Network (by constituency/region) or Diaspora Network (by country of residence). Three distinct surfaces: public marketing site, member dashboard, and admin panel.

Live: `thebasemovement.creativeutil.com` → migrating to `thebasemovement.com`

---

## Main Folders

| Folder                    | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `src/pages/`              | 48+ public + member pages                                  |
| `src/pages/admin/`        | 46+ admin-only pages                                       |
| `src/components/`         | Reusable UI components                                     |
| `src/components/layouts/` | AdminLayout, admin sidebar/topbar, dashboard subcomponents |
| `src/components/admin/`   | Admin-only cards, maps, forms, modals                      |
| `src/components/buttons/` | 5 custom button variants                                   |
| `src/services/`           | 23 Supabase service files (384 KB total)                   |
| `src/context/`            | Auth, Branding, Chapters, Performance contexts             |
| `src/hooks/`              | Custom hooks: theme, mobile, toast, push notifications     |
| `src/lib/`                | supabase client, currency formatting, analytics, OCR scan  |
| `src/types/`              | TypeScript definitions (`admin.ts` = 922 lines)            |
| `src/utils/`              | mapUtils (45 KB GeoJSON helpers), offlineDb (IndexedDB)    |
| `supabase/functions/`     | 22 Deno Edge Functions                                     |
| `supabase/migrations/`    | 40+ SQL migration files                                    |
| `docs/`                   | Architecture, database docs, design system handoff, audits |
| `public/`                 | Fonts, flags, GeoJSON, PWA manifest, service worker        |
| `.claude/workflows/`      | Per-task workflow guides                                   |
| `.claude/prompts/`        | Reusable session-start prompts                             |

---

## Important Files

| File                                            | Size      | Purpose                                                     |
| ----------------------------------------------- | --------- | ----------------------------------------------------------- |
| `src/routes.tsx`                                | 327 lines | All routes, 3 layout shells, lazy imports                   |
| `src/index.css`                                 | 52 KB     | Full CSS design system — variables, layout, buttons, badges |
| `src/services/adminService.ts`                  | 92 KB     | Core admin data layer — always grep, never read fully       |
| `src/types/admin.ts`                            | 922 lines | All admin TypeScript types — always grep                    |
| `src/lib/supabase.ts`                           | —         | Supabase singleton client                                   |
| `src/lib/currency.ts`                           | —         | GHS/USD formatting                                          |
| `src/context/AuthContext.tsx`                   | —         | Session + signOut                                           |
| `src/context/BrandingContext.tsx`               | —         | Site settings + dynamic theming                             |
| `src/components/layouts/admin/navConfig.ts`     | —         | Admin sidebar navigation items                              |
| `supabase/functions/_shared/email-templates.ts` | —         | Shared transactional email HTML                             |
| `vercel.json`                                   | —         | CSP headers + SPA rewrites                                  |
| `vite.config.ts`                                | 125 lines | Build config, chunk splitting, prerender list               |
| `.env.example`                                  | —         | Environment variable reference                              |

---

## Docs Summary

| Doc                                                   | What it covers                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/database/users-column-security.md`              | Column-level grants on public.users — critical for schema changes |
| `docs/database/`                                      | General schema documentation                                      |
| `docs/audits/border-radius-token-audit-2026-05-26.md` | Border radius token migration status                              |
| `docs/design-system-handoff/`                         | Visual reference for dashboard UI                                 |
| `docs/Messaging-Templates/`                           | Brand-approved email/SMS messaging                                |
| `docs/session_handover.md`                            | Project handover context                                          |
| `docs/homepage.md`                                    | Homepage feature docs                                             |
| `docs/jobs.md`                                        | Jobs feature docs                                                 |

---

## Styling Summary

- Custom CSS design system in `src/index.css` (52 KB)
- No Tailwind in migrated pages; `tailwind.config.js` exists but is not used in dashboard/admin
- No shadcn in production — `components.json` is legacy only
- Brand colors via `hsl(var(--token))` — green (#006B3F), gold (#DAA520), red (#CE1126)
- Border radius via `var(--radius-xs/sm/md/lg/pill)` — never hardcoded px
- Typography: Public Sans, `fontWeight: 500`, no bold in body text
- Icons: Material Symbols exclusively (`<span className="material-symbols-outlined">`)
- Layout classes: `.main`, `.kpis`, `.panel`, `.ph`, `.sidebar-main`, `.main-sidebar`
- Buttons: `.btn`, `.btn-primary`, `.btn-outline`, `.btn-dest`, `.btn-accent`, `.btn-ghost`
- Status badges: `.pill`, `.pill-ok`, `.pill-warn`, `.pill-err`, `.pill-mute`

---

## KPI/Dashboard Summary

- KPI tile: `.panel` + 3px left bar + uppercase label (10px) + number (`var(--kpi-num-size)`)
- `.kpis` class = 4-column responsive grid
- Charts: Recharts only (`ResponsiveContainer`, `BarChart`, `LineChart`, `PieChart`, `AreaChart`)
- Money: always format via `src/lib/currency.ts`
- Status badges: `.pill` + variant class
- Modals: fixed backdrop `rgba(0,0,0,0.45)`, stopPropagation on inner div
- Dropdowns: fixed-inset backdrop for outside-click close

---

## Auth Summary

- Provider: Supabase Auth (JWT sessions)
- Client: `src/lib/supabase.ts`
- Auth context: `src/context/AuthContext.tsx` — `session`, `user`, `isLoading`, `signOut()`
- Auth service: `src/services/authService.ts`
- Route guards: `ProtectedRoute` (session), `ProtectedAdminRoute` (admin role), `VerifiedRoute` (member verified)
- OTP: Supabase Edge Function → Africa's Talking SMS
- Admin login: `/admin/login` (separate from member `/login`)

---

## Database/API Summary

- Backend: Supabase (PostgreSQL + RLS + Edge Functions)
- Client: `@supabase/supabase-js` via `src/lib/supabase.ts`
- All queries go through `src/services/` — never call Supabase directly from pages
- `public.users`: column-level SELECT grants (not table-level). `national_id` encrypted, use RPC only
- 40+ migrations in `supabase/migrations/` — never edit existing ones
- 22 Edge Functions in `supabase/functions/` (Deno runtime)
- Key Edge Functions: `hubtel-initiate-payment`, `send-otp`, `send-welcome-email`, `send-donation-receipt`, `broadcast-dispatcher`, `send-newsletter`

---

## Deployment Summary

- Frontend: Vercel — auto-deploys on push to `main`
- Build: `npm run build` (typecheck → client → SSR → prerender)
- Public routes are SSG prerendered; admin/dashboard are SPA
- CSP headers in `vercel.json`
- Edge functions: `supabase functions deploy <name>`
- Migrations: `supabase db push`
- Environment: `.env` locally; Vercel env vars for frontend; Supabase dashboard secrets for edge functions

---

## Commands Detected

```bash
npm install          # Install
npm run dev          # Dev server (port 3000)
npm run build        # Full build pipeline
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint
npm run test:run     # Vitest single run
npm run preview      # Preview build
supabase db push     # Apply migrations
supabase functions deploy <name>  # Deploy edge function
```

---

## Known Forbidden Assumptions

- No Figma — use `docs/design-system-handoff/` as visual reference
- No Tailwind in dashboard/admin pages
- No shadcn/ui — `components.json` is legacy only
- No Lucide icons — Material Symbols only
- No new UI/icon libraries unless explicitly requested
- No direct Supabase calls from pages — use `src/services/`
- No reading `national_id` directly from `users` table
- No editing existing migration files
- No `--no-verify` to bypass hooks
