# Database Workflow

## Purpose

Writing, reviewing, and applying Supabase database changes — schema migrations, RLS policies, SQL queries, RPCs, and column-level security — for The Base Movement platform.

## When to use

Use this workflow when the task involves:

- Adding a new table or column
- Writing a new SQL migration
- Modifying an RLS policy
- Adding a new Supabase RPC function
- Debugging a Supabase query returning unexpected results
- Adding column-level grants on `public.users`
- Reviewing migration history
- Updating a service query to match a schema change

## Project context

- Supabase project connected via `src/lib/supabase.ts` (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- 40+ migration files in `supabase/migrations/` — always create a new migration, never edit existing ones
- `public.users` has column-level SELECT grants (NOT table-level) — see CLAUDE.md Database Security Notes
- `national_id` column is encrypted (pgcrypto) — only accessible via `admin_get_national_id(reg_no)` RPC
- Migration `20260530000203` sets the column-level grants for `public.users`
- Edge functions in `supabase/functions/` use Deno runtime (deno.json, import_map.json)
- Services in `src/services/` are the application layer that calls the DB

## Inspect first

- `supabase/migrations/` — list the most recent 5 migration files before writing a new one
- The specific service file that needs to change (grep for the function, don't read full file)
- `src/types/admin.ts` — grep for the TypeScript type corresponding to the table
- `docs/database/` — for schema documentation

## Docs to check

- `docs/database/users-column-security.md` — critical for any `public.users` changes
- `docs/database/` — general schema docs

## Avoid touching

- Existing migration files — always create a new migration
- `src/lib/supabase.ts` — the client config rarely needs changing
- UI components — schema changes propagate through services, not pages directly

## Workflow

1. Read CLAUDE.md Database Security Notes section.
2. List recent migrations: `supabase/migrations/` — understand what's already been done.
3. Check `docs/database/` for existing schema docs.
4. Write the new migration SQL file with a timestamped name.
5. If adding a column to `public.users`, add `GRANT SELECT` in the same migration.
6. Update the relevant service function to use the new column/table.
7. Update the TypeScript type in `src/types/admin.ts` or relevant types file.
8. Apply via Supabase MCP or `supabase db push`.
9. Run `npm run typecheck`.
10. Summarize: what the migration does, which service was updated, which types changed.

## Project rules

- Never edit an existing migration — create a new one.
- Every new column on `public.users` needs `GRANT SELECT` for `authenticated` and `anon`.
- Never expose `national_id` in client queries — use the RPC only.
- RLS policies must be included in the migration, not added manually via dashboard.
- Service-role key must never appear in client-side code.
- Naming convention for migrations: `YYYYMMDDHHMMSS_descriptive_name.sql`.

## Validation

```bash
npm run typecheck
supabase db push  # Apply migration to remote
```

## Token-saving behavior

- List migration files — do not read each one.
- Read only the service function being updated.
- Grep `admin.ts` for the specific type rather than reading the whole file.
- Stop after migration + service + types are updated.
