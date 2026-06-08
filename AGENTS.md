# Project Overview

The Base Movement is a Ghana political movement membership platform with three surfaces: the public site (`PublicLayout`), the authenticated member dashboard (`DashboardLayout`), and the admin command center (`AdminLayout`). Members join as Ghana Network members by constituency/region or Diaspora Network members by country.

# Stack

- React 19 + TypeScript + Vite 7
- React Router with lazy route objects in `src/routes.tsx`
- Supabase Auth, Postgres, Storage, Realtime, and Edge Functions
- Vitest + Testing Library
- ESLint 9 and Prettier through lint-staged
- TinyMCE for admin blog editing
- Recharts, Mapbox, GSAP, Tesseract.js, PDF.js, Sentry, Umami
- Vercel SPA rewrite config in `vercel.json`
- npm with `package-lock.json`

# Important Folders

- `src/` - React app source.
- `src/pages/` - public, dashboard, and admin page views.
- `src/pages/admin/` - admin command center pages and feature modules.
- `src/components/` - shared layout, admin, member, state, icon, and UI components.
- `src/components/layouts/` - admin layout shell and admin navigation.
- `src/context/` and `src/contexts/` - app providers including auth, branding, chapters, performance, and page labels.
- `src/services/` - Supabase-facing service layer.
- `src/lib/` - Supabase client, currency/fund helpers, image utilities, Sentry, session utilities.
- `src/hooks/` - reusable React hooks.
- `src/types/` - project TypeScript types.
- `src/utils/` - app utility modules including offline DB and map helpers.
- `src/test/` - Vitest setup and tests.
- `public/` - static assets, branding, fonts, PDFs, service worker, sitemap, robots.
- `docs/` - audits, design-system handoff, project docs, database notes, specs, plans, assets, screenshots.
- `supabase/` - Supabase config, migrations, SQL scripts, and edge functions.
- `ml-service/` - Python FastAPI-style ML service with routers and requirements.
- `scripts/` - seed, migration, media, prerender, scan, and maintenance scripts.
- `.codex/` - Codex agents, project skills, prompts, and project map.

# Commands

- install: `npm install`
- dev: `npm run dev`
- build: `npm run build`
- build client: `npm run build:client`
- build server: `npm run build:server`
- lint: `npm run lint`
- test: `npm run test`
- test UI: `npm run test:ui`
- test run: `npm run test:run`
- typecheck: `npm run typecheck`
- preview: `npm run preview`
- format: not available
- database commands: not available as npm scripts
- deployment commands: not available as npm scripts

# Styling Rules

- Preserve existing custom inline styles, style objects, and `src/index.css`.
- Reuse the dashboard/admin design system: `.main`, `.kpis`, `.panel`, `.ph`, `.sidebar-main`, `.main-sidebar`, `.desktop-only`, `.mobile-only`, `.btn*`, and `.pill*`.
- Use CSS variables with `hsl(var(--...))` wrappers for colors.
- Use radius tokens: `var(--radius-xs)`, `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`, `var(--radius-pill)`.
- Do not convert styles to Tailwind.
- Do not introduce Tailwind.
- Do not introduce shadcn/ui.
- Do not introduce Lucide icons or `lucide-react`.
- Do not introduce new UI/icon libraries unless explicitly requested.
- Use Material Symbols for icons: `<span className="material-symbols-outlined" style={{ fontSize: N }}>icon_name</span>`.
- Reuse existing colors, spacing, cards, borders, shadows, typography, and layout patterns.
- Tailwind config and dependencies exist, but migrated dashboard/admin pages must stay on the custom design system.

# Dark Mode Rules

- Dark mode uses the existing theme mechanism: `document.documentElement.setAttribute('data-theme', 'dark')`.
- Prefer existing theme tokens such as `--background`, `--surface`, `--on-surface`, `--on-surface-muted`, `--border`, `--primary`, `--accent`, and `--destructive`.
- Fix dark-mode issues by replacing light-only hardcoded colors with `hsl(var(--...))` variables or existing dark-aware CSS overrides.
- Review inline style objects and class names for light-specific backgrounds, text colors, borders, buttons, cards, panels, modals, dropdowns, tables, forms, and banners.
- Prefer targeted component fixes or existing `src/index.css` dark-theme overrides over new global styling.
- Keep theme toggles and persistence aligned with `useIsDarkTheme()`, `data-theme`, localStorage, and admin preferences.
- Preserve Material Symbols and custom UI classes; do not introduce shadcn, Lucide, Tailwind conversions, or new theme libraries.

# KPI/Dashboard Rules

- Wrap KPI strips in `.kpis`.
- Prefer `src/components/admin/TacticalKPI.tsx` for admin KPI cards.
- For inline KPI panels, use `.panel`, a 3px brand-color left bar, uppercase 10px labels, and `fontSize: 'var(--kpi-num-size)'` for the stat number.
- Never hardcode numeric KPI stat font sizes.
- Use `hsl(var(--primary))`, `hsl(var(--accent))`, `hsl(var(--destructive))`, or `hsl(var(--on-surface))` for KPI bars.
- Use `.panel` and `.ph` for chart/card wrappers.
- Tables use compact admin layouts with filters/search above the table and mobile card fallbacks where present.
- Status badges use `.pill`, `.pill-ok`, `.pill-warn`, `.pill-err`, `.pill-mute`, or local `statusPill` helpers.
- Empty/loading states should reuse existing `src/components/states/`, `LoadingScreen`, dashed panels, or muted Material Symbol panels.
- Number formatting commonly uses `toLocaleString()` or `Intl.NumberFormat`; currency helpers live in `src/lib/currency.ts`.

# Coding Rules

- Use the service layer in `src/services/` before adding direct Supabase calls to pages.
- Use `@/` imports for `src` aliases.
- Keep auth behavior aligned with `src/lib/supabase.ts`, `src/context/AuthContext.tsx`, `ProtectedRoute`, `ProtectedAdminRoute`, and `VerifiedRoute`.
- Supabase auth tokens use session storage by design.
- Admin role and permission logic lives primarily in `adminService`, `roleService`, `src/types/admin.ts`, and admin settings/administrator pages.
- Blog media library folder is `blog-images`.
- `users.national_id` must only be read through `admin_get_national_id(reg_no)`.
- When adding columns to `public.users`, add column-level grants for `authenticated` and `anon`.
- Use concise comments only when the reason is non-obvious.

# File Editing Rules

- Future tasks should inspect only relevant files.
- Prefer small patches.
- Do not rewrite whole files unless required.
- Do not touch auth, database, routing, or deployment unless the task explicitly requires it.
- Reuse existing components.
- Avoid duplicate components.
- Avoid large refactors during bug fixes.
- Do not overwrite unrelated dirty changes.

# Docs Usage Rules

- Check `docs/` first when the task involves architecture, business rules, database rules, deployment, design system, or feature behavior.
- Do not paste long docs into responses.
- Summarize only relevant docs.
- Useful starting docs include `docs/audits/layout_guidelines.md`, `docs/audits/kpi-stats-reference.md`, `docs/audits/border-radius-token-audit-2026-05-26.md`, `docs/database/users-column-security.md`, and `docs/project-docs/`.

# Validation Rules

- Run `npm run typecheck` after TypeScript, service, route, or type changes.
- Run `npm run test:run` after behavior, utility, service, auth, or data changes with test coverage.
- Run `npm run lint` after broad code edits or before handoff when practical.
- Run `npm run build` after routing, SSR/prerender, deployment, public SEO, or cross-surface changes.
- Run only the smallest relevant validation for the task.

# Token-Saving Rules

- Use `AGENTS.md` and `.codex/skills` before scanning broadly.
- Do not scan the full repo in normal tasks.
- Start with the most likely folders.
- Use targeted `rg` searches.
- Do not print full files.
- Read specific line ranges when possible.
- Summarize diffs instead of dumping code.
- Stop after the requested task is complete.
