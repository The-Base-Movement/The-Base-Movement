-- users_insert allowed INSERT when auth_user_exists(id) -- true for ANY
-- existing auth.users id, not just the caller's own. Whenever
-- auth.uid() = id is true, auth_user_exists(id) is automatically true
-- too, so this clause added zero legitimate capability beyond what
-- auth.uid() = id already covers -- only risk: any authenticated (or
-- anon, which also has INSERT column grants) caller could insert a
-- public.users row for a DIFFERENT real member's auth id, in the window
-- between that member's auth.users account existing and their own
-- public.users row being created.
--
-- Confirmed dead: the only two ways public.users rows get created are
-- register-member (uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS
-- entirely) and admin bulk CSV import (memberService.bulkRegisterMembers,
-- relies on is_admin() -- imported rows get fresh UUIDs with auth
-- accounts backfilled later, never touching auth_user_exists). Currently
-- 0 auth.users rows lack a matching public.users row, so no live target
-- exists today, but the clause was a real gap during any future window.

DROP POLICY IF EXISTS "users_insert" ON public.users;

CREATE POLICY "users_insert"
ON public.users
FOR INSERT
TO public
WITH CHECK (is_admin() OR auth.uid() = id);
