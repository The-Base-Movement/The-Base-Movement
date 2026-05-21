---
name: users-table-schema-and-drift
description: Authoritative column list for public.users plus TS interface drift between User type and DB
type: project
---

The `users` table is the canonical member table (not `members`). Verified live via SQL on 2026-05-20.

**Full column list** (30 columns):
`id` (uuid, default auth.uid()), `full_name` (NOT NULL), `email`, `registration_number` (NOT NULL), `platform` (NOT NULL), `country` (NOT NULL), `phone_number`, `gender`, `region`, `constituency`, `chapter`, `profession`, `joined_at` (default `timezone('utc', now())`), `status` (default `'Active'`), `avatar_url`, `age_range`, `education_level`, `emergency_name`, `emergency_relationship`, `emergency_phone`, `verification_status` (default `'In Review'`), `points` (bigint, default 0), `verification_notes`, `national_id`, `children_count` (int, default 0), `residential_address`, `city`, `registration_source` (text, default `'digital'`), `referred_by` (text), `deleted_at` (timestamptz, nullable — soft-delete marker).

**Status default is `'Active'`** at the DB level — but the Register.tsx insert payload explicitly sets `status: 'Pending'`. So new registrations come in Pending; the default only applies to rows inserted without a status (admin-created, seeds).

**`registration_source` DOES exist** (default `'digital'`). Prior memory said it did not — corrected 2026-05-18. Likely values include `'digital'` and presumably an OCR/admin/manual variant.

**Why:** Re-verified 2026-05-18 via information_schema. Two new columns (`registration_source`, `referred_by`) since the 2026-05-15 snapshot.

**How to apply:** Filtering/reporting on registration source IS possible via `users.registration_source`. Referral tracking is via `users.referred_by` (text — likely a registration_number FK by convention, but not enforced as a real FK; verify before joining).

**TS-vs-DB drift in `User` interface** (`src/types/admin.ts:23-46`):

- TS `emergency_contact_name` → DB `emergency_name`
- TS `emergency_number` → DB `emergency_phone`
- TS likely missing: `national_id`, `children_count`, `verification_status`, `verification_notes`, `points`, `registration_source`, `referred_by`

PostgREST silently drops unknown fields on insert, so renamed TS fields are NEVER making it to the DB through `memberService.registerMember()`. Register.tsx must be writing the correct DB names directly (bypassing the TS shape) for those to populate — worth verifying when working on registration code.

**`registerMember` is a pass-through:** `memberService.registerMember(data: User)` does `supabase.from('users').insert([data])` with no transformation. `adminService.registerMember` wraps it only to add an `audit_logs` entry — no column augmentation.
