-- 1. Support FinanceOfficer in admins table
-- Note: existing rows use legacy values 'ADMIN' and 'SUPER_ADMIN'; include them to avoid violations
ALTER TABLE public.admins
  DROP CONSTRAINT IF EXISTS admins_role_check,
  ADD CONSTRAINT admins_role_check CHECK (role IN ('SuperAdmin', 'RegionalAdmin', 'FinanceOfficer', 'ADMIN', 'SUPER_ADMIN'));

-- 2. Create the internal finance requests table
CREATE TABLE IF NOT EXISTS public.finance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('BudgetAllocation', 'ExpenseReimbursement', 'InventoryReplenishment')),
    chapter TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    officer_comment TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- 3. Enable RLS on requests
ALTER TABLE public.finance_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies on finance_requests
CREATE POLICY "Users can view own requests" ON public.finance_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create requests" ON public.finance_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Finance staff can view all requests" ON public.finance_requests
    FOR SELECT USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
    );

CREATE POLICY "Finance staff can update requests" ON public.finance_requests
    FOR UPDATE USING (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
    ) WITH CHECK (
        (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
    );

-- 5. Finance Officer Access Policies on existing financial tables
CREATE POLICY "FinanceOfficer has full access to ledger" ON public.mobilization_ledger
    FOR ALL USING ((SELECT role FROM public.admins WHERE id = auth.uid()) = 'FinanceOfficer');

CREATE POLICY "FinanceOfficer has full access to field_events" ON public.field_events
    FOR ALL USING ((SELECT role FROM public.admins WHERE id = auth.uid()) = 'FinanceOfficer');

-- 6. Trigger to automate Ledger insertion upon request approval
CREATE OR REPLACE FUNCTION public.handle_approved_finance_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
        INSERT INTO public.mobilization_ledger (
            chapter,
            transaction_type,
            amount,
            description,
            category,
            created_by
        ) VALUES (
            NEW.chapter,
            CASE
                WHEN NEW.request_type = 'BudgetAllocation' THEN 'Allocation'::text
                ELSE 'Expenditure'::text
            END,
            NEW.amount,
            '[Auto-Approved Request] ' || NEW.description,
            CASE
                WHEN NEW.request_type = 'InventoryReplenishment' THEN 'Other'::text
                ELSE 'Logistics'::text
            END,
            NEW.requester_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_finance_request_approval
    AFTER UPDATE OF status ON public.finance_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_approved_finance_request();
