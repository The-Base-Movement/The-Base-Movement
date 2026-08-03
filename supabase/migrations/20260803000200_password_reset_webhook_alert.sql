-- Migration: Password Reset & Update Webhook Logging + Weekly Digest Trigger
-- Created: 2026-08-03

CREATE TABLE IF NOT EXISTS public.password_events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(60) NOT NULL, -- 'password_updated', 'reset_requested', 'admin_reset_triggered', 'recovery_approved'
    email TEXT,
    phone TEXT,
    full_name TEXT,
    ip_address TEXT,
    triggered_by VARCHAR(50) DEFAULT 'user',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick 7-day weekly summary queries
CREATE INDEX IF NOT EXISTS idx_password_events_log_created_at ON public.password_events_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_events_log_event_type ON public.password_events_log (event_type);

-- RLS Security
ALTER TABLE public.password_events_log ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY password_events_log_service_role ON public.password_events_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view their own event logs
CREATE POLICY password_events_log_select_own ON public.password_events_log
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Function to record password event
CREATE OR REPLACE FUNCTION public.log_password_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_triggered_by TEXT DEFAULT 'user',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_log_id UUID;
    v_email TEXT := p_email;
    v_phone TEXT := p_phone;
    v_full_name TEXT := p_full_name;
BEGIN
    -- If user_id is provided, try to fetch missing profile details
    IF p_user_id IS NOT NULL THEN
        IF v_email IS NULL OR v_phone IS NULL OR v_full_name IS NULL THEN
            SELECT 
                COALESCE(v_email, u.email, au.email),
                COALESCE(v_phone, u.phone_number, au.phone),
                COALESCE(v_full_name, u.full_name)
            INTO v_email, v_phone, v_full_name
            FROM auth.users au
            LEFT JOIN public.users u ON u.id = au.id
            WHERE au.id = p_user_id;
        END IF;
    END IF;

    INSERT INTO public.password_events_log (
        user_id, event_type, email, phone, full_name, ip_address, triggered_by, metadata
    ) VALUES (
        p_user_id, p_event_type, v_email, v_phone, v_full_name, p_ip_address, p_triggered_by, p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Trigger function on auth.users when encrypted_password is updated
CREATE OR REPLACE FUNCTION public.on_auth_user_password_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password) THEN
        PERFORM public.log_password_event(
            p_user_id => NEW.id,
            p_event_type => 'password_updated',
            p_email => NEW.email,
            p_phone => NEW.phone,
            p_triggered_by => 'user',
            p_metadata => jsonb_build_object('source', 'auth_users_trigger')
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_password_update ON auth.users;
CREATE TRIGGER trg_auth_user_password_update
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
    EXECUTE FUNCTION public.on_auth_user_password_update();

-- Function for weekly password activity summary
CREATE OR REPLACE FUNCTION public.get_weekly_password_activity_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ := now() - INTERVAL '7 days';
    v_total_events INT;
    v_password_updated_count INT;
    v_reset_requested_count INT;
    v_admin_reset_count INT;
    v_recovery_approved_count INT;
BEGIN
    SELECT COUNT(*) INTO v_total_events 
    FROM public.password_events_log 
    WHERE created_at >= v_start_time;

    SELECT COUNT(*) INTO v_password_updated_count 
    FROM public.password_events_log 
    WHERE created_at >= v_start_time AND event_type = 'password_updated';

    SELECT COUNT(*) INTO v_reset_requested_count 
    FROM public.password_events_log 
    WHERE created_at >= v_start_time AND event_type = 'reset_requested';

    SELECT COUNT(*) INTO v_admin_reset_count 
    FROM public.password_events_log 
    WHERE created_at >= v_start_time AND event_type = 'admin_reset_triggered';

    SELECT COUNT(*) INTO v_recovery_approved_count 
    FROM public.password_events_log 
    WHERE created_at >= v_start_time AND event_type = 'recovery_approved';

    RETURN jsonb_build_object(
        'period_start', v_start_time,
        'period_end', now(),
        'total_events', v_total_events,
        'password_updated', v_password_updated_count,
        'reset_requested', v_reset_requested_count,
        'admin_reset_triggered', v_admin_reset_count,
        'recovery_approved', v_recovery_approved_count
    );
END;
$$;
