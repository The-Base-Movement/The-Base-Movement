-- supabase/migrations/20260603000300_create_system_audit_logs.sql

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  action      TEXT        NOT NULL,
  user_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  severity    TEXT        NOT NULL DEFAULT 'info'
              CHECK (severity IN ('info', 'warning', 'critical')),
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_audit_logs_staff_select" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_staff_select"
  ON public.system_audit_logs FOR SELECT TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

DROP POLICY IF EXISTS "system_audit_logs_staff_insert" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_staff_insert"
  ON public.system_audit_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- No DELETE — audit logs are immutable.

-- ── RPC: get_db_stats ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'db_size_bytes',       pg_database_size(current_database()),
    'active_connections',  (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_db_stats() TO authenticated;

-- ── Seed data ─────────────────────────────────────────────────────────────────

INSERT INTO public.system_audit_logs (action, severity, details) VALUES
  ('Platform initialised',                   'info',     '{"environment":"production"}'),
  ('Admin role assigned',                    'warning',  '{"role":"FINANCE_OFFICER","target":"officer@example.com"}'),
  ('Failed login attempt (5 consecutive)',   'critical', '{"attempts":5,"ip":"192.168.1.100"}'),
  ('Database backup completed',              'info',     '{"size_mb":42,"duration_s":18}'),
  ('Suspicious query burst detected',        'warning',  '{"table":"finance_requests","count":200}'),
  ('New SUPER_ADMIN account created',        'critical', '{"email":"newadmin@example.com"}'),
  ('Scheduled maintenance window started',   'info',     '{"window_minutes":30}'),
  ('Finance request auto-escalated',         'warning',  '{"request_id":"auto-123","reason":"timeout"}');
