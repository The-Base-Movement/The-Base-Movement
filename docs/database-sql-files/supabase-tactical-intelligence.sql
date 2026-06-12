-- 🎯 THE BASE: PHASE 7 - TACTICAL INTELLIGENCE & FIELD FEEDBACK
-- This schema establishes the infrastructure for direct field action and situational awareness.

-- 1. DIRECT ACTION DIRECTIVES TABLE
-- Discrete tactical tasks pushed from HQ or Regional Leads to the field.
CREATE TABLE IF NOT EXISTS public.field_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('Global', 'Regional', 'Chapter', 'Individual')),
    target_id TEXT, -- Region name, Chapter name, or User UUID
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    deadline TIMESTAMPTZ,
    points_awarded INTEGER DEFAULT 0, -- For gamification
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Completed', 'Expired'))
);

-- 2. DIRECTIVE RESPONSES TABLE
-- Field feedback and verification of completed tasks.
CREATE TABLE IF NOT EXISTS public.field_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directive_id UUID REFERENCES public.field_directives(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    report_text TEXT,
    media_url TEXT, -- Verification photo/video
    location_lat DECIMAL(9,6),
    location_lng DECIMAL(9,6),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
    points_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.field_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_reports ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
-- Directives: Everyone can see directives that apply to them.
CREATE POLICY "Users can view directives targeting them" ON public.field_directives
    FOR SELECT
    USING (
        target_type = 'Global' OR
        (target_type = 'Regional' AND target_id = (SELECT region FROM public.users WHERE id = auth.uid())) OR
        (target_type = 'Chapter' AND target_id = (SELECT chapter FROM public.users WHERE id = auth.uid())) OR
        (target_type = 'Individual' AND target_id = auth.uid()::text)
    );

-- Reports: Users can manage their own reports.
CREATE POLICY "Users can manage their own field reports" ON public.field_reports
    FOR ALL
    USING (member_id = auth.uid())
    WITH CHECK (member_id = auth.uid());

-- Admins: Global management.
CREATE POLICY "Admins have global access to directives" ON public.field_directives
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins have global access to reports" ON public.field_reports
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 5. AUDIT LOGGING
CREATE TRIGGER on_field_directive_change
    AFTER INSERT OR UPDATE OR DELETE ON public.field_directives
    FOR EACH ROW EXECUTE FUNCTION track_admin_action();

CREATE TRIGGER on_field_report_change
    AFTER INSERT OR UPDATE OR DELETE ON public.field_reports
    FOR EACH ROW EXECUTE FUNCTION track_admin_action();
