---
name: mobilization-ledger-table-schema
description: Full column list, constraints, FK to auth.users, and RLS for public.mobilization_ledger
type: project
---

`public.mobilization_ledger` — financial ledger entries scoped per chapter.

Columns (verified 2026-05-27 via information_schema):

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

Constraints:

- PK: id
- FK: `created_by` → `auth.users(id)`
- `category`: NOT NULL but **NO CHECK constraint** — free-text. (Re-verified 2026-06-02: the only CHECK is on transaction_type. A prior note here claimed category was enum-constrained to 'Logistics'|'Media'|'Venues'|'Transport'|'Other' — that was wrong or has since been dropped. App code may still emit those values, but the DB does not enforce them.)
- CHECK `transaction_type`: must be one of `'Allocation' | 'Expenditure'`
- `chapter` is free-text (no FK to a chapters table).

RLS: enabled. Two policies (both for role `authenticated`):

- "Regional admins can view chapter ledger" — SELECT — `chapter IN (SELECT chapter FROM admins WHERE id = auth.uid())`
- "SuperAdmins have global access to ledger" — ALL — `(SELECT role FROM admins WHERE id = auth.uid()) = 'SuperAdmin'`

**Why this matters:**

- No INSERT/UPDATE/DELETE policy exists for non-SuperAdmin admins. Regional admins can read but cannot write to their own chapter's ledger. Writes are SuperAdmin-only.
- No anon access at all.
- Only `transaction_type` is enum-enforced by CHECK (case-sensitive: 'Allocation'|'Expenditure'). `category` is free-text — any dropdown values are an app-side convention, not DB-enforced.

**How to apply:** When wiring a "log transaction" UI for chapter leaders, expect the insert to fail under RLS unless the user is a SuperAdmin. Either add a new policy or proxy through an edge function / SECURITY DEFINER RPC. Category/transaction_type values must match the CHECK literals exactly.
