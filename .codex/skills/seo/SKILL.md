---
name: seo
description: Use when changing public SEO pages, metadata, sitemap, robots, Open Graph assets, prerendered public routes, or Vite SSG route behavior.
---

# Purpose

Guide public SEO, prerender, sitemap, robots, metadata, and public content route changes.

# When to use

Use this skill when the task involves:

- Public pages, SEO metadata, `sitemap.xml`, `robots.txt`, Open Graph assets, or prerendered routes.

# Project context

Public routes are in `src/routes.tsx`. `vite.config.ts` prerenders public SEO routes and keeps dashboard/admin as SPA routes. SEO files live in `public`.

# Inspect first

- `AGENTS.md`
- Target public page under `src/pages`
- `src/routes.tsx`
- `vite.config.ts`
- `public/sitemap.xml`
- `public/robots.txt`

# Docs to check

- `docs/homepage.md`
- `docs/project-docs/branding-and-design.md`
- Relevant content docs.

# Avoid touching

- Dashboard/admin pages unless the page is dual-use.
- Auth/database code unless required.

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

Do not break public prerender behavior. Keep public assets inspectable and real. Preserve custom CSS patterns.

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
