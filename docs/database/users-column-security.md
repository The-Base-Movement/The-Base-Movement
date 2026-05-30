# `users` Table — Column-Level Security

## What was done

`national_id` stores AES-256-encrypted ciphertext (`ENC:<base64>`) via pgcrypto + Supabase Vault (see migration `20260530000200`). To prevent even the ciphertext from leaking to non-admin clients, migration `20260530000203` replaced the table-level `SELECT` grant on `public.users` with column-level grants that exclude `national_id`.

| Role            | Access                                                     |
| --------------- | ---------------------------------------------------------- |
| `authenticated` | Column-level SELECT — all columns **except** `national_id` |
| `anon`          | Column-level SELECT — all columns **except** `national_id` |
| `service_role`  | Full table-level SELECT (unchanged)                        |
| `postgres`      | Full table-level SELECT (unchanged)                        |

Admins read plaintext national IDs exclusively through the `admin_get_national_id(reg_no)` SECURITY DEFINER RPC, which decrypts via the Vault key and enforces an `admins` table check.

## ⚠️ Maintenance rule — adding columns to `users`

Because `authenticated` and `anon` no longer have table-level SELECT, **any new column added to `public.users` must also be added to the column-level `GRANT SELECT` block** in:

```
supabase/migrations/20260530000203_restrict_national_id_column_select.sql
```

If you skip this, the new column will be invisible to all client-side queries (PostgREST will silently exclude it from `SELECT *` results, and explicit selects will fail with a permission error).

### How to add a new column

1. Write your schema migration as normal (e.g. `ALTER TABLE public.users ADD COLUMN new_field text;`)
2. In the **same migration file** (or a new one immediately after), add the column to both grants:

```sql
GRANT SELECT (new_field) ON TABLE public.users TO authenticated;
GRANT SELECT (new_field) ON TABLE public.users TO anon;
```

That's it — no other changes needed.

## Encryption architecture summary

| Layer                           | What it does                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `vault.secrets`                 | Stores the AES passphrase, never in migration history                                   |
| `encrypt_national_id(text)`     | SECURITY DEFINER; called by the write trigger                                           |
| `decrypt_national_id(text)`     | SECURITY DEFINER; called only by the admin RPC                                          |
| `trg_encrypt_national_id`       | BEFORE INSERT OR UPDATE OF national_id on `users`; idempotent via `ENC:` prefix check   |
| `admin_get_national_id(reg_no)` | Public RPC, granted to `authenticated`; body checks `admins` table before decrypting    |
| Migration 20260530000203        | Column-level SELECT revocation — `national_id` not accessible to `authenticated`/`anon` |
