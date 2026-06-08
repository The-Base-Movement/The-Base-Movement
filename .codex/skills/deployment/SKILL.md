---
name: deployment
description: Use when debugging or changing Vite builds, Vercel headers/rewrites, env mapping, SSR output, prerendering, or production deployment behavior.
---

# Purpose

Guide Vite, Vercel, SSR/prerender, env, headers, and build troubleshooting.

# When to use

Use this skill when the task involves:

- Builds, deployment failures, Vercel rewrites/headers, env mapping, prerender, SSR output, or production-only behavior.

# Project context

Deployment config is `vercel.json`. Vite maps env vars and prerenders public routes. Build command runs client build, server build, then `scripts/prerender.mjs`.

# Inspect first

- `AGENTS.md`
- `package.json`
- `vite.config.ts`
- `vercel.json`
- `.env.example`
- `scripts/prerender.mjs`

# Docs to check

- `docs/audits/developer_and_operations_master_guide.md`
- `docs/audits/health-scan-audit-2026-05-29.md`
- `docs/project-docs/operational-manual.md`

# Avoid touching

- Feature code unless the failure points there.
- Supabase migrations unless deployment issue is database-related.

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

Do not invent deployment scripts. Keep SPA rewrite and security headers intentional. Vercel CLI is not installed locally unless the user installs it.

# Validation

- `npm run build`
- `npm run typecheck`

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
