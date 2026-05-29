---
name: donation-campaigns-schema-and-missing-write-rls
description: donation_campaigns columns and the missing INSERT/UPDATE/DELETE RLS policies that cause 403 on writes
metadata:
  type: project
---

`public.donation_campaigns` columns: `id` (uuid PK), `title` (varchar NOT NULL), `description` (text), `target_amount` (numeric NOT NULL), `raised_amount` (numeric default 0), `end_date` (timestamptz), `status` (varchar default 'Active'), `image_url` (text), `created_at` (timestamptz default `timezone('utc', now())`). No FKs.

**RLS gotcha:** Only ONE policy exists — `SELECT TO public USING (status = 'Active')`. There is **no INSERT, UPDATE, or DELETE policy**, so all writes from the client (even admin) return 403. The public SELECT also hides non-Active rows from the admin UI.

To enable admin writes (mirroring the `is_admin()` pattern used by [[job-applications-schema-and-missing-fk]]):

```sql
CREATE POLICY "Admins can insert campaigns" ON public.donation_campaigns
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update campaigns" ON public.donation_campaigns
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can delete campaigns" ON public.donation_campaigns
  FOR DELETE TO authenticated USING (is_admin());
```

**How to apply:** When the user reports 403 on a donation_campaigns write, the root cause is missing RLS policies — not a credentials/role problem.
