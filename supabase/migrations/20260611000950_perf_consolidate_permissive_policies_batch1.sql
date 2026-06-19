-- Performance: reduce multiple_permissive_policies lints. Two techniques, both
-- semantics-preserving:
--
-- 1. Where a table has an unconditional SELECT-true policy covering the same
--    roles as a FOR ALL policy, the ALL policy's SELECT arm is redundant —
--    split it into INSERT/UPDATE/DELETE policies (automated DO block below).
-- 2. Where several policies cover the same action for the same roles, merge
--    them into one policy OR-ing the quals (permissive policies are OR'd by
--    definition, so this is an identity transform). Hand-written per table.
--
-- messages was consolidated in 20260611000900_fix_group_message_policy_scope
-- (security fix).

-- ---------------------------------------------------------------------------
-- 1. Split FOR ALL policies whose SELECT arm is covered by a SELECT-true policy
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p record;
  sel_found boolean;
  base_check text;
BEGIN
  FOR p IN
    SELECT * FROM pg_policies
    WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
      AND cmd = 'ALL' AND qual IS NOT NULL
      AND tablename <> 'blog_comments' -- restructured by hand below
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies s
      WHERE s.schemaname = 'public' AND s.tablename = p.tablename
        AND s.permissive = 'PERMISSIVE' AND s.cmd = 'SELECT' AND s.qual = 'true'
        AND (s.roles @> p.roles OR 'public' = ANY (s.roles))
    ) INTO sel_found;
    IF NOT sel_found THEN CONTINUE; END IF;

    base_check := coalesce(p.with_check, p.qual);

    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO %s WITH CHECK (%s)',
      left(p.policyname, 53) || ' (insert)', p.tablename, array_to_string(p.roles, ', '), base_check);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
      left(p.policyname, 53) || ' (update)', p.tablename, array_to_string(p.roles, ', '), p.qual, base_check);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO %s USING (%s)',
      left(p.policyname, 53) || ' (delete)', p.tablename, array_to_string(p.roles, ', '), p.qual);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. blog_comments: one policy per action ("Anyone can view comments" kept)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.blog_comments;
CREATE POLICY blog_comments_insert ON public.blog_comments FOR INSERT TO public
  WITH CHECK (public.is_admin() OR ((select auth.uid()) = member_id));
CREATE POLICY blog_comments_update ON public.blog_comments FOR UPDATE TO public
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY blog_comments_delete ON public.blog_comments FOR DELETE TO public
  USING (public.is_admin() OR ((select auth.uid()) = member_id));

-- ---------------------------------------------------------------------------
-- 3. users: drop SELECT policies subsumed by the SELECT-true policy; merge
--    the INSERT and UPDATE pairs. ("Authenticated members can view all
--    profiles" is qual=true TO authenticated, so the narrower SELECT policies
--    add nothing; anon gains nothing because their quals all require auth.uid().)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read access to members" ON public.users;
DROP POLICY IF EXISTS "Chapter Leaders can view their chapter members" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public registration to users" ON public.users;
CREATE POLICY users_insert ON public.users FOR INSERT TO public
  WITH CHECK (public.is_admin() OR ((select auth.uid()) = id));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY users_update ON public.users FOR UPDATE TO public
  USING (public.is_admin() OR (id = (select auth.uid())))
  WITH CHECK (public.is_admin() OR (id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- 4. admins: merge the two UPDATE policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admins to update their own record" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update any admin" ON public.admins;
CREATE POLICY admins_update ON public.admins FOR UPDATE TO public
  USING (
    (id = (select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = (select auth.uid())
        AND a.role::text IN ('SUPER_ADMIN', 'FOUNDER')
    )
  )
  WITH CHECK (
    (id = (select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = (select auth.uid())
        AND a.role::text IN ('SUPER_ADMIN', 'FOUNDER')
    )
  );

-- ---------------------------------------------------------------------------
-- 5. field_events / mobilization_ledger: merge the three role-based FOR ALL
--    policies into one (FinanceOfficer / SuperAdmin / regional-admin quals OR'd)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "FinanceOfficer has full access to field_events" ON public.field_events;
DROP POLICY IF EXISTS "Regional admins can manage chapter field events" ON public.field_events;
DROP POLICY IF EXISTS "SuperAdmins have global access to events" ON public.field_events;
CREATE POLICY field_events_admin_all ON public.field_events FOR ALL TO public
  USING (
    ((SELECT admins.role FROM admins WHERE admins.id = (select auth.uid())))::text
      IN ('FinanceOfficer', 'FINANCE_OFFICER', 'SuperAdmin')
    OR chapter IN (SELECT field_events.chapter FROM admins WHERE admins.id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "FinanceOfficer has full access to ledger" ON public.mobilization_ledger;
DROP POLICY IF EXISTS "Regional admins can manage chapter ledger" ON public.mobilization_ledger;
DROP POLICY IF EXISTS "SuperAdmins have global access to ledger" ON public.mobilization_ledger;
CREATE POLICY mobilization_ledger_admin_all ON public.mobilization_ledger FOR ALL TO public
  USING (
    ((SELECT admins.role FROM admins WHERE admins.id = (select auth.uid())))::text
      IN ('FinanceOfficer', 'FINANCE_OFFICER', 'SuperAdmin')
    OR chapter IN (SELECT mobilization_ledger.chapter FROM admins WHERE admins.id = (select auth.uid()))
  )
  WITH CHECK (
    ((SELECT admins.role FROM admins WHERE admins.id = (select auth.uid())))::text
      IN ('FinanceOfficer', 'FINANCE_OFFICER', 'SuperAdmin')
    OR chapter IN (SELECT mobilization_ledger.chapter FROM admins WHERE admins.id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 6. chapter_applications: merge admin + own-application FOR ALL policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin manage applications" ON public.chapter_applications;
DROP POLICY IF EXISTS "Member manage own applications" ON public.chapter_applications;
CREATE POLICY chapter_applications_all ON public.chapter_applications FOR ALL TO public
  USING (public.is_admin() OR (applicant_id = (select auth.uid())))
  WITH CHECK (public.is_admin() OR (applicant_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- 7. chapter_requests: fold the admin FOR ALL policy into one policy per action
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS admins_full_access_chapter_requests ON public.chapter_requests;
DROP POLICY IF EXISTS leaders_view_chapter_requests ON public.chapter_requests;
DROP POLICY IF EXISTS members_view_own_requests ON public.chapter_requests;
DROP POLICY IF EXISTS members_insert_own_requests ON public.chapter_requests;
DROP POLICY IF EXISTS leaders_update_chapter_requests ON public.chapter_requests;
CREATE POLICY chapter_requests_select ON public.chapter_requests FOR SELECT TO public
  USING (
    public.is_admin()
    OR ((select auth.uid()) = member_id)
    OR EXISTS (
      SELECT 1 FROM chapters
      WHERE chapters.id = chapter_requests.chapter_id
        AND chapters.leader_id = (select auth.uid())
    )
  );
CREATE POLICY chapter_requests_insert ON public.chapter_requests FOR INSERT TO public
  WITH CHECK (public.is_admin() OR ((select auth.uid()) = member_id));
CREATE POLICY chapter_requests_update ON public.chapter_requests FOR UPDATE TO public
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM chapters
      WHERE chapters.id = chapter_requests.chapter_id
        AND chapters.leader_id = (select auth.uid())
    )
  );
CREATE POLICY chapter_requests_delete ON public.chapter_requests FOR DELETE TO public
  USING (public.is_admin());
