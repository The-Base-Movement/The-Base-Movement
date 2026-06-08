---
name: performance
description: Use when improving slow pages, rerenders, bundle chunks, Vite build output, image optimization, offline behavior, prerender cost, or expensive data fetching.
---

# Purpose

Guide performance, bundle, query, image, prerender, and rendering cleanup while preserving behavior.

# When to use

Use this skill when the task involves:

- Slow pages, unnecessary rerenders, bundle chunks, Vite build output, image optimization, offline/service worker behavior, or expensive data fetching.

# Project context

Vite uses manual chunks, production image optimization, public route prerendering, and Vitest. The app uses React Query in places, Supabase services, and custom hooks.

# Inspect first

- `AGENTS.md`
- Target slow component/service/hook.
- `vite.config.ts` when bundle/build related.
- `src/hooks`
- `src/lib/imageUtils.ts`
- `public/sw.js` when offline-related.

# Docs to check

- `docs/audits/image-compression-audit-2026-05-29.md`
- `docs/audits/offline-mode-hardening-2026-05-25.md`
- `docs/audits/frontend_mobile_guide.md`

# Avoid touching

- Styling except where layout thrash is the issue.
- Unrelated feature logic.

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

Optimize the narrow bottleneck. Preserve SSR/prerender behavior and service-layer boundaries.

# Validation

- `npm run typecheck`
- `npm run build` for bundle/prerender/build changes.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
