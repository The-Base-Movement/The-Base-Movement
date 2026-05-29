---
name: job-applications-schema-and-missing-fk
description: job_applications columns, missing member_id FK that breaks PostgREST embeds, and RLS policies
metadata:
  type: project
---

`public.job_applications` columns: `id` (uuid PK), `job_id` (uuid NOT NULL), `member_id` (uuid NOT NULL), `cover_letter` (text NOT NULL), `resume_url` (text), `status` (text NOT NULL default 'pending'), `created_at`, `updated_at`.

FKs: `job_id` -> `jobs.id` only. **`member_id` has NO foreign key constraint** even though it is meant to reference `public.users.id`.

**Why this matters:** PostgREST embed queries like `select=*,member:users(...)` will 400 because no relationship can be inferred. To use embeds, add:

```sql
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE CASCADE;
```

There is no `profiles` table in this project — member data lives in [[users-table-schema-and-drift]]. Any code referencing `profiles` is broken.

RLS (enabled):

- SELECT `Members read own applications`: `auth.uid() = member_id`
- INSERT `Members can apply`: WITH CHECK `auth.uid() = member_id`
- ALL `Admins can manage all job applications`: `is_admin()`

**How to apply:** When the user reports a 400 on a `job_applications` embed query, the fix is either to add the FK above OR drop the embed and do two queries.
