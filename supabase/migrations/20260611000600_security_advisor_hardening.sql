-- Security advisor hardening (Supabase database linter remediation)
--
-- Addresses concrete, exploitable findings surfaced by the security advisor:
--   1. messages_active view exposed every message to anon/authenticated by
--      running SECURITY DEFINER and bypassing the participant RLS on messages.
--   2. admin_roles / admin_role_permissions allowed ANY authenticated user to
--      INSERT/UPDATE/DELETE admin role definitions (qual = true) — a privilege
--      escalation path.
--   3. movement_milestones allowed any authenticated user to write public
--      milestone content.
--   4. Several functions had a mutable search_path.
--
-- Intentionally NOT changed (documented for future reviewers):
--   * movement_leaderboard / chapter_performance_telemetry remain SECURITY
--     DEFINER. They aggregate public ranking data across all members; the
--     underlying member_points / member_achievements tables restrict reads to
--     the row owner, so security_invoker would collapse the leaderboard.
--   * Public-write policies on blog_post_likes, contact_submissions,
--     conversations and newsletter_subscribers are by design (anonymous likes,
--     contact form, starting a conversation, newsletter signup).

-- 1. Honor per-conversation RLS when querying active messages.
ALTER VIEW public.messages_active SET (security_invoker = true);

-- 2. Restrict admin role management to admins (reads remain available so the
--    app can render role/permission lists).
DROP POLICY IF EXISTS "Authenticated users can manage admin roles" ON public.admin_roles;
CREATE POLICY "Admins can manage admin roles" ON public.admin_roles
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can manage admin role permissions" ON public.admin_role_permissions;
CREATE POLICY "Admins can manage admin role permissions" ON public.admin_role_permissions
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Restrict milestone writes to admins; public read is unchanged.
DROP POLICY IF EXISTS "Allow authenticated insert on milestones" ON public.movement_milestones;
DROP POLICY IF EXISTS "Allow authenticated update on milestones" ON public.movement_milestones;
DROP POLICY IF EXISTS "Allow authenticated delete on milestones" ON public.movement_milestones;
CREATE POLICY "Admins insert milestones" ON public.movement_milestones
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update milestones" ON public.movement_milestones
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete milestones" ON public.movement_milestones
  FOR DELETE TO authenticated USING (public.is_admin());

-- 4. Pin search_path on functions flagged with a mutable search_path.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'audit_store_order_dispatch','trigger_broadcast_dispatcher',
        'delete_old_activity_logs','refresh_newsletter_delivery_stats',
        'set_updated_at','it_tickets_set_updated_at',
        'update_conversation_last_message_at')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;
