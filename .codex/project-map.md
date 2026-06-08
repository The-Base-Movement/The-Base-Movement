# Project Summary

The Base Movement is a React/Vite/Supabase platform for a Ghana political movement. It serves a public site, authenticated member dashboard, and admin command center.

# Main Folders

- `src/pages`: route pages for public, dashboard, and admin surfaces.
- `src/components`: shared UI, shells, admin widgets, member components, states, and icons.
- `src/services`: Supabase service layer.
- `src/lib`: Supabase client, currency, image, fund approval, Sentry, and session helpers.
- `src/context`, `src/contexts`: React providers.
- `src/hooks`: reusable hooks.
- `src/types`: TypeScript domain types.
- `src/test`: Vitest setup and tests.
- `public`: static assets, fonts, PDFs, service worker, SEO files.
- `supabase/functions`: Edge Functions for email, OTP, payments, KYC/OCR, broadcasts, newsletters, push, webhooks.
- `supabase/migrations`: Postgres schema, RLS, RPC, and policy migrations.
- `docs`: audits, design-system handoff, database notes, plans, specs, screenshots, assets.
- `ml-service`: Python ML API service.
- `scripts`: maintenance, media sync, seed, scan, migration, prerender scripts.

# Important Files

- `src/routes.tsx`: lazy route table and protected route structure.
- `src/index.css`: design system variables, layout classes, buttons, pills, KPI styles.
- `src/lib/supabase.ts`: Supabase singleton and session-storage auth config.
- `src/context/AuthContext.tsx`: auth/session provider.
- `src/components/DashboardLayout.tsx`: member dashboard shell.
- `src/components/layouts/AdminLayout.tsx`: admin shell.
- `src/components/admin/AdminPageHeader.tsx`: standard admin header.
- `src/components/admin/TacticalKPI.tsx`: reusable admin KPI card.
- `supabase/functions/_shared/email-templates.ts`: shared transactional email templates.
- `vercel.json`: security headers and SPA rewrite.
- `vite.config.ts`: Vite, SSG, optimizer, env mapping, Vitest config.

# Docs Summary

- `docs/audits`: UI, KPI, typography, mobile, email, integration, security, and feature audits.
- `docs/database`: `users` column-level security notes.
- `docs/database-sql-files`: historical SQL schemas and setup files.
- `docs/project-docs`: architecture, schema, operations, roadmap, media upload, and rebuild notes.
- `docs/superpowers/plans` and `docs/superpowers/specs`: feature plans and design specs.
- `docs/design-system-handoff`: visual design system references and UI kit previews.

# Styling Summary

Custom CSS design system in `src/index.css` plus inline styles/style objects. Dashboard/admin pages should use named classes and CSS variables, not Tailwind utilities. Material Symbols are the required icons for migrated pages. Tailwind and lucide packages exist, but do not introduce or use them in migrated pages.

# KPI/Dashboard Summary

KPI strips use `.kpis`. New admin KPIs usually use `TacticalKPI`; inline KPI panels use `.panel`, a 3px left bar, uppercase muted labels, and `fontSize: 'var(--kpi-num-size)'`. Dashboard/admin layouts use `.main`, `.panel`, `.ph`, `.sidebar-main`, `.main-sidebar`, `.desktop-only`, `.mobile-only`, `.btn*`, and `.pill*`.

# Auth Summary

Supabase auth is configured in `src/lib/supabase.ts` with a singleton client and sessionStorage-backed tokens. `AuthContext` loads sessions, listens to auth state changes, and logs user activity. `ProtectedRoute` and `ProtectedAdminRoute` gate dashboard/admin routes; `VerifiedRoute` gates verified-member routes.

# Database/API Summary

The app uses Supabase Postgres through `src/services/`, plus Edge Functions under `supabase/functions`. Migrations under `supabase/migrations` define RLS, RPCs, role checks, payments, newsletters, IT/helpdesk, finance, store, polling, and national ID encryption. `public.users.national_id` is encrypted and must only be decrypted through the admin-gated RPC.

# Deployment Summary

Vercel is configured with `vercel.json` headers and a catch-all rewrite to `index.html`. `vite.config.ts` prerenders public SEO routes through `scripts/prerender.mjs`; dashboard/admin remain SPA routes. No deployment npm script is defined.

# Commands Detected

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run build:client`
- `npm run build:server`
- `npm run lint`
- `npm run preview`
- `npm run typecheck`
- `npm run test`
- `npm run test:ui`
- `npm run test:run`

# Known Forbidden Assumptions

- Do not assume Figma is used.
- Do not create Figma-related workflows.
- Do not convert to Tailwind or introduce Tailwind usage.
- Do not introduce shadcn/ui.
- Do not use Lucide icons or `lucide-react`.
- Do not introduce new UI/icon libraries unless explicitly requested.
