---
name: users-table-rls-policies
description: RLS policy set on public.users — who can SELECT/INSERT/UPDATE/DELETE, including the constituency-scoped chapter-leader read policy and the wide-open INSERT
type: project
---

RLS is ENABLED on `public.users` (relrowsecurity=true, FORCE off).

**SELECT policies (any-pass / PERMISSIVE):**

1. `Users can view their own profile` (public) — `id = auth.uid()`
2. `Admins can view all users` (authenticated) — `EXISTS in public.admins where admins.id = auth.uid()`
3. `Chapter Leaders can view their constituency members` (public) — `EXISTS in public.chapters where chapters.leader_id = auth.uid() AND chapters.constituency = users.constituency`

**INSERT:** `Allow public registration to users` (public, WITH CHECK true) — wide open, any role can insert any row. Required by the unauthenticated registration flow.

**UPDATE:** self (`id = auth.uid()`) OR admin (`EXISTS in admins`).
**DELETE:** admin-only.

**Why this matters / how to apply:**

- A plain logged-in member can only SELECT their own row. Queries like `from('users').eq('chapter', X)` will return 0 or 1 rows for ordinary members. Member-facing directory features require either an admin-context call (service role / RPC) or a new policy.
- The chapter-leader visibility policy joins on `constituency`, NOT on the `chapter` column. This is schema drift vs the intuitive "same chapter" model — a leader sees everyone in their constituency, not strictly everyone in their chapter. Worth re-checking if a chapter visibility feature is built.
- Public INSERT is intentional for registration but is a hardening target; do not assume new tables can copy this pattern blindly.
