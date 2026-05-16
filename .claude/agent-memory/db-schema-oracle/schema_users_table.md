---
name: users-table-schema-and-drift
description: Authoritative column list for public.users plus TS interface drift between User type and DB
type: project
---

The `users` table is the canonical member table (not `members`). Verified live via SQL on 2026-05-15.

**Full column list** (27 columns):
`id` (uuid, default auth.uid()), `full_name` (NOT NULL), `email`, `registration_number` (NOT NULL), `platform` (NOT NULL), `country` (NOT NULL), `phone_number`, `gender`, `region`, `constituency`, `chapter`, `profession`, `joined_at` (default `timezone('utc', now())`), `status` (default `'Active'`), `avatar_url`, `age_range`, `education_level`, `emergency_name`, `emergency_relationship`, `emergency_phone`, `verification_status` (default `'In Review'`), `points` (bigint, default 0), `verification_notes`, `national_id`, `children_count` (int, default 0), `residential_address`, `city`.

**No registration source/method column exists.** There is no `registration_source`, `registration_method`, `source`, `origin`, or `signup_method` field. The only way to distinguish public-vs-admin-vs-OCR registration is via the `audit_logs` `MEMBER_REGISTER` action (actor identity), not a `users` column.

**Why:** Asked 2026-05-15 whether registration source is tracked. Confirmed it is not.

**How to apply:** If asked to filter/report on registration source, flag that the column does not exist and propose adding it. Don't assume it exists from older docs.

**TS-vs-DB drift in `User` interface** (`src/types/admin.ts:23-46`):
- TS `emergency_contact_name` → DB `emergency_name`
- TS `emergency_number` → DB `emergency_phone`
- TS missing entirely: `national_id`, `children_count`, `verification_status`, `verification_notes`, `points`

PostgREST silently drops unknown fields on insert, so the two renamed TS fields are NEVER making it to the DB through `memberService.registerMember()`. Register.tsx must be writing the correct DB names directly (bypassing the TS shape) for those to populate — worth verifying when working on registration code.

**`registerMember` is a pass-through:** `memberService.registerMember(data: User)` does `supabase.from('users').insert([data])` with no transformation. `adminService.registerMember` wraps it only to add an `audit_logs` entry — no column augmentation.
