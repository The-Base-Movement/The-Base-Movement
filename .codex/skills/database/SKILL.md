---
name: database
description: Use when changing Supabase migrations, RLS policies, RPCs, grants, schema, storage policies, database docs, or service queries tied to schema.
---

# Purpose

Guide Supabase schema, migration, RLS, RPC, grant, and data-access changes.

# When to use

Use this skill when the task involves:

- Migrations, RLS policies, RPCs, table grants, Supabase schema, storage policies, or service queries tied to schema.

# Project context

Database changes live in `supabase/migrations`. Client access flows through `src/services`. `users.national_id` is encrypted and hidden from client SELECT grants.

# Inspect first

- `AGENTS.md`
- Relevant `supabase/migrations/*`
- Target `src/services/*Service.ts`
- Related type files in `src/types`
- `supabase/config.toml`

# Docs to check

- `docs/database/users-column-security.md`
- `docs/project-docs/database-schema.md`
- `docs/database-sql-files/current-supabase.sql`

# Avoid touching

- Application UI unless needed for the database change.
- Existing migrations unrelated to the task unless the user explicitly asks.

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

When adding `public.users` columns, grant column SELECT to `authenticated` and `anon`. Never expose `national_id`; use `admin_get_national_id(reg_no)` only.

# Validation

- `npm run typecheck`
- Database commands: not available as npm scripts.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
