---
name: mobilization-ledger-table-schema
description: Full column list, FK status, and RLS for public.mobilization_ledger
type: project
---

`public.mobilization_ledger` — financial ledger entries scoped per chapter.

Columns (verified 2026-05-19 via information_schema):

| Column           | Type                     | Nullable | Default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | NO       | gen_random_uuid() |
| chapter          | text                     | NO       | —                 |
| transaction_type | text                     | NO       | —                 |
| amount           | numeric                  | NO       | —                 |
| description      | text                     | NO       | —                 |
| category         | text                     | NO       | —                 |
| timestamp        | timestamp with time zone | YES      | now()             |
| created_by       | uuid                     | YES      | —                 |

Foreign keys: NONE. `created_by` is a uuid but has no FK constraint to `auth.users` or `public.users`. `chapter` is free-text (no FK to a chapters table).

RLS: enabled. Two policies (both for role `authenticated`):

- "Regional admins can view chapter ledger" — SELECT — `chapter IN (SELECT chapter FROM admins WHERE id = auth.uid())`
- "SuperAdmins have global access to ledger" — ALL — `(SELECT role FROM admins WHERE id = auth.uid()) = 'SuperAdmin'`

**Why this matters:**

- No INSERT/UPDATE/DELETE policy exists for non-SuperAdmin admins. Regional admins can read but cannot write to their own chapter's ledger. Writes are SuperAdmin-only.
- No anon access at all (anon role not granted in any policy).
- `created_by` integrity is not enforced at the DB level — application layer must validate it matches auth.uid().

**How to apply:** When wiring a "log transaction" UI for chapter leaders, expect the insert to fail under RLS unless the user is a SuperAdmin. Either add a new policy or proxy through an edge function / SECURITY DEFINER RPC.
