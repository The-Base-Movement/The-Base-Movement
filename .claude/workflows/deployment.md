# Deployment Workflow

## Purpose

Deploying The Base Movement platform to Vercel (frontend) and Supabase (edge functions and migrations).

## When to use

Use this workflow when the task involves:

- Running the full deployment pipeline
- Deploying only edge functions
- Applying a database migration to production
- Debugging a build failure
- Checking Vercel deployment status
- Updating CSP headers or security config
- Checking environment variable setup

## Project context

- Frontend host: Vercel — auto-deploys on push to `main`
- Build pipeline: TypeScript check → client bundle → SSR build → prerender public routes
- Public routes are prerendered (SSG): Home, About, Blog, Agenda, Contact, Donate, Store, Impact, Polls, Chapters, Constituencies, Privacy, Terms, Press
- Admin/dashboard routes remain SPA
- CSP headers defined in `vercel.json` — TinyMCE CDN, Umami, Sentry, Supabase, Mapbox whitelisted
- Edge functions runtime: Deno (Supabase), config in `supabase/deno.json` + `supabase/import_map.json`
- Environment variables: VITE\_\* prefix for frontend; server-side secrets stored in Supabase dashboard

## Inspect first

- `vercel.json` — security headers and CSP config
- `vite.config.ts` — build config, chunks, prerender list
- `package.json` scripts section — exact build commands
- `supabase/functions/<name>/index.ts` — if deploying a specific edge function
- `.env.example` — for environment variable reference

## Docs to check

- not available

## Avoid touching

- `src/routes.tsx` — deployment config does not change routes
- `src/services/` — deployment does not touch application logic
- Existing migration files

## Workflow

1. Read CLAUDE.md Commands section.
2. Run `npm run typecheck` — fix any type errors first.
3. Run `npm run build` — fix any build errors.
4. Run `git push` — Vercel picks up the push and deploys automatically.
5. For edge functions: `supabase functions deploy <function-name>`.
6. For migrations: `supabase db push`.
7. Verify deployment in Vercel dashboard if needed.
8. Summarize: what was deployed, any errors encountered.

## Environment Variables

**Frontend (Vite — must be prefixed `VITE_`):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TINYMCE_API_KEY`
- `VITE_SENTRY_DSN` (optional)
- `VITE_MAPBOX_TOKEN` (optional, SVG fallback exists)
- `VITE_UMAMI_WEBSITE_ID`
- `VITE_VAPID_PUBLIC_KEY`

**Edge Functions (Supabase Secrets — set in Supabase dashboard):**

- `RESEND_API_KEY` — email
- `AT_API_KEY`, `AT_USERNAME` — SMS (Africa's Talking)
- `HUBTEL_API_ID`, `HUBTEL_API_KEY`, `HUBTEL_ACCOUNT_NUMBER` — payments
- `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — web push

## Project rules

- Never commit `.env` to git.
- Run `typecheck` before `build` — catching type errors saves a wasted build.
- Edge functions deploy independently from the frontend — they can be deployed without a full frontend rebuild.
- CSP changes require editing `vercel.json` (production) and `vite.config.ts` server headers (dev).
- Do not add new external script domains without updating the CSP `script-src` in both files.

## Validation

```bash
npm run typecheck
npm run build
```

## Token-saving behavior

- Do not read all edge function files — read only the one being deployed.
- Do not scan the full `src/` for deployment tasks.
- Stop after deployment is complete.
