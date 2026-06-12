-- Performance: wrap auth.uid()/auth.jwt()/auth.role() in a scalar subselect in
-- the remaining RLS policies (lower-traffic tables), so Postgres evaluates the
-- auth call once per query instead of once per row (auth_rls_initplan lint).
-- Semantics are unchanged; this is purely a query-plan optimization.
-- Hot tables were handled in 20260611000700_perf_rls_initplan_hot_tables.sql.
--
-- Covers 81 policies across 47 tables (assets/IT helpdesk/chapter activity/
-- party structure/logs etc.). Implemented as a regenerating DO block so the
-- rewrite is applied mechanically with no hand-transcription; idempotent —
-- policies whose clauses are already wrapped are skipped.

DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  ddl text;
BEGIN
  FOR r IN
    SELECT *
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual ~ 'auth\.(uid|jwt|role)\(\)' AND qual !~* '\(\s*SELECT\s+auth\.')
        OR (with_check IS NOT NULL AND with_check ~ 'auth\.(uid|jwt|role)\(\)' AND with_check !~* '\(\s*SELECT\s+auth\.')
      )
  LOOP
    new_qual := CASE
      WHEN r.qual IS NOT NULL AND r.qual ~ 'auth\.(uid|jwt|role)\(\)' AND r.qual !~* '\(\s*SELECT\s+auth\.'
        THEN regexp_replace(r.qual, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g')
      ELSE r.qual
    END;
    new_check := CASE
      WHEN r.with_check IS NOT NULL AND r.with_check ~ 'auth\.(uid|jwt|role)\(\)' AND r.with_check !~* '\(\s*SELECT\s+auth\.'
        THEN regexp_replace(r.with_check, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g')
      ELSE r.with_check
    END;

    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);

    ddl := format('CREATE POLICY %I ON public.%I', r.policyname, r.tablename)
        || CASE WHEN r.permissive = 'RESTRICTIVE' THEN ' AS RESTRICTIVE' ELSE '' END
        || ' FOR ' || r.cmd
        || ' TO ' || array_to_string(r.roles, ', ')
        || CASE WHEN new_qual  IS NOT NULL THEN ' USING (' || new_qual || ')' ELSE '' END
        || CASE WHEN new_check IS NOT NULL THEN ' WITH CHECK (' || new_check || ')' ELSE '' END;

    EXECUTE ddl;
  END LOOP;
END $$;
