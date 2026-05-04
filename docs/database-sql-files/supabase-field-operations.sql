-- 🏛️ THE BASE: PHASE 6 - REGIONAL AUTONOMY & FIELD OPERATIONS
-- This schema establishes the infrastructure for regional event coordination and budget transparency.

-- 0. AUDIT TRIGGER FUNCTION
-- Standardized logging for administrative actions.
CREATE OR REPLACE FUNCTION public.track_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (action, resource, status, admin_id, metadata)
    VALUES (
        TG_OP,
        TG_TABLE_NAME,
        'Success',
        auth.uid(),
        jsonb_build_object(
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. FIELD EVENTS TABLE
-- Tracks regional rallies, town halls, and recruitment drives.
CREATE TABLE IF NOT EXISTS public.field_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    chapter TEXT NOT NULL, -- Linked to chapters.name
    status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
    type TEXT NOT NULL DEFAULT 'Rally' CHECK (type IN ('Rally', 'Town Hall', 'Recruitment', 'Training')),
    attendees_expected INTEGER DEFAULT 0,
    attendees_actual INTEGER DEFAULT 0,
    budget_allocated DECIMAL(12, 2) DEFAULT 0.00,
    budget_spent DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MOBILIZATION LEDGER TABLE
-- Transparent tracking of regional mobilization funds.
CREATE TABLE IF NOT EXISTS public.mobilization_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter TEXT NOT NULL, -- Linked to chapters.name
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Allocation', 'Expenditure')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Logistics', 'Media', 'Venues', 'Transport', 'Other')),
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. ENABLE RLS
ALTER TABLE public.field_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobilization_ledger ENABLE ROW LEVEL SECURITY;

-- 4. REGIONAL SCOPED POLICIES
-- Field Events: Regional admins see and manage their own chapter's events.
CREATE POLICY "Regional admins can manage chapter field events" ON public.field_events
    FOR ALL
    USING (
        chapter IN (
            SELECT chapter FROM public.admins WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        chapter IN (
            SELECT chapter FROM public.admins WHERE id = auth.uid()
        )
    );

-- Mobilization Ledger: Regional admins view their own chapter's ledger.
CREATE POLICY "Regional admins can view chapter ledger" ON public.mobilization_ledger
    FOR SELECT
    USING (
        chapter IN (
            SELECT chapter FROM public.admins WHERE id = auth.uid()
        )
    );

-- SuperAdmins see everything (Global access)
CREATE POLICY "SuperAdmins have global access to events" ON public.field_events
    FOR ALL
    USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) = 'SuperAdmin'
    );

CREATE POLICY "SuperAdmins have global access to ledger" ON public.mobilization_ledger
    FOR ALL
    USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) = 'SuperAdmin'
    );

-- 5. TRIGGERS FOR AUDIT LOGGING
CREATE TRIGGER on_field_event_change
    AFTER INSERT OR UPDATE OR DELETE ON public.field_events
    FOR EACH ROW EXECUTE FUNCTION track_admin_action();

CREATE TRIGGER on_ledger_change
    AFTER INSERT OR UPDATE OR DELETE ON public.mobilization_ledger
    FOR EACH ROW EXECUTE FUNCTION track_admin_action();
