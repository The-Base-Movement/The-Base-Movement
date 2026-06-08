# Token-Saving Prompts

## 1. Small Bug Fix

Read `AGENTS.md`, then use `.codex/skills/bugfix`. Inspect only the likely failing file, its nearest service/helper, and any existing test. Avoid full repo scans. Apply a minimal patch, preserve inline/custom styling, avoid Tailwind, Figma assumptions, shadcn, and Lucide. Run only relevant validation, usually `npm run typecheck` or `npm run test:run`.

## 2. Custom UI-Only Change

Read `AGENTS.md`, then use `.codex/skills/custom-ui`. Check design docs only if needed. Inspect the target component/page and `src/index.css` class definitions. Reuse `.main`, `.panel`, `.ph`, `.btn*`, `.pill*`, Material Symbols, radius tokens, and `hsl(var(...))`. Do not scan broadly or introduce Tailwind, shadcn, Lucide, Figma assumptions, or new UI libraries.

## 3. KPI Dashboard Change

Read `AGENTS.md`, then use `.codex/skills/kpi-dashboard`. Inspect the target dashboard page, nearest `*KPIs.tsx`, `TacticalKPI`, and `docs/audits/kpi-stats-reference.md`. Use `.kpis` and `var(--kpi-num-size)`. Preserve custom styling. Run only relevant TypeScript/build validation.

## 4. Form Change

Read `AGENTS.md`, then use `.codex/skills/forms`. Inspect the target form, related service, validation/type file, and relevant docs. Keep `boxSizing: 'border-box'`, radius tokens, existing loading/error states, and service-layer writes. Avoid broad scans and new UI libraries.

## 5. Auth Change

Read `AGENTS.md`, then use `.codex/skills/auth`. Inspect `src/lib/supabase.ts`, `src/context/AuthContext.tsx`, route guards, and the target auth page/service. Do not touch database/routing beyond the auth task. Run `npm run typecheck` and relevant tests.

## 6. Database/API Change

Read `AGENTS.md`, then use `.codex/skills/database` or `.codex/skills/api-routes`. Check relevant docs and migrations only. Inspect the service, migration/function, and types. Preserve RLS and `users.national_id` RPC rules. Avoid full repo scans. Run relevant TypeScript/tests; database CLI validation is not an npm script.

## 7. SEO/Page Content Change

Read `AGENTS.md`, then use `.codex/skills/seo`. Inspect only the target public page, route, metadata helpers, `public/sitemap.xml`, `public/robots.txt`, and relevant docs. Preserve custom styling and prerendered public route behavior. Run `npm run build` when route/prerender behavior changes.

## 8. Email Template Change

Read `AGENTS.md`, then use `.codex/skills/email-templates`. Inspect `supabase/functions/_shared/email-templates.ts`, the calling edge function, and relevant email docs. Avoid changing unrelated functions. Run relevant type/build validation only.

## 9. Deployment/Debug Task

Read `AGENTS.md`, then use `.codex/skills/deployment`. Inspect `vercel.json`, `vite.config.ts`, package scripts, `.env.example`, and the specific failing deployment area. Avoid broad source refactors. Run `npm run build` when deployment behavior is involved.

## 10. Docs-Based Feature Task

Read `AGENTS.md`, then use `.codex/skills/docs-architecture`. Check only relevant `docs/` files, summarize them, then inspect target code. Preserve existing patterns, avoid full repo scans, and apply minimal patches.

## 11. Safe Refactor

Read `AGENTS.md`, then use `.codex/skills/bugfix` plus the domain skill for the target area. Inspect the smallest call graph. Do not rewrite whole files. Reuse existing components and services. Preserve inline/custom styling. Run `npm run typecheck` and tests that cover the refactor.

## 12. Performance Cleanup

Read `AGENTS.md`, then use `.codex/skills/performance`. Inspect only the slow component/service, existing hooks, `vite.config.ts` chunking if relevant, and tests. Avoid changing behavior or styling. Run `npm run typecheck`; run `npm run build` for bundle/prerender changes.
