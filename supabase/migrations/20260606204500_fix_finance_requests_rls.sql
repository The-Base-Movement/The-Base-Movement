-- Drop old policies on finance_requests
DROP POLICY IF EXISTS "Finance staff can view all requests" ON public.finance_requests;
DROP POLICY IF EXISTS "Finance staff can update requests" ON public.finance_requests;

-- Create updated policies on finance_requests supporting uppercase/all finance reviewer roles
CREATE POLICY "Finance staff can view all requests" ON public.finance_requests
    FOR SELECT USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN (
            'SuperAdmin', 'FinanceOfficer', 
            'SUPER_ADMIN', 'FINANCE_OFFICER', 
            'EXECUTIVE', 'ORGANIZER', 
            'ADMIN', 'FOUNDER'
        )
    );

CREATE POLICY "Finance staff can update requests" ON public.finance_requests
    FOR UPDATE USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN (
            'SuperAdmin', 'FinanceOfficer', 
            'SUPER_ADMIN', 'FINANCE_OFFICER', 
            'EXECUTIVE', 'ORGANIZER', 
            'ADMIN', 'FOUNDER'
        )
    ) WITH CHECK (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN (
            'SuperAdmin', 'FinanceOfficer', 
            'SUPER_ADMIN', 'FINANCE_OFFICER', 
            'EXECUTIVE', 'ORGANIZER', 
            'ADMIN', 'FOUNDER'
        )
    );

-- Drop old policies on mobilization_ledger and field_events
DROP POLICY IF EXISTS "FinanceOfficer has full access to ledger" ON public.mobilization_ledger;
DROP POLICY IF EXISTS "FinanceOfficer has full access to field_events" ON public.field_events;

-- Recreate policies on mobilization_ledger and field_events supporting both case variants of Finance Officer
CREATE POLICY "FinanceOfficer has full access to ledger" ON public.mobilization_ledger
    FOR ALL USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('FinanceOfficer', 'FINANCE_OFFICER')
    );

CREATE POLICY "FinanceOfficer has full access to field_events" ON public.field_events
    FOR ALL USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('FinanceOfficer', 'FINANCE_OFFICER')
    );
