-- Fix 1: Recreate trigger function without SECURITY DEFINER (unnecessary),
--         with correct search_path, reviewed_at stamp, and correct category mapping.
CREATE OR REPLACE FUNCTION public.handle_approved_finance_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
        -- Stamp reviewed_at on the approving transition
        NEW.reviewed_at = now();

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
                WHEN NEW.request_type = 'ExpenseReimbursement' THEN 'Other'::text
                ELSE 'Logistics'::text
            END,
            NEW.requester_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Fix 2: Add FINANCE_OFFICER (SCREAMING_SNAKE_CASE) to the admins constraint
--        so it matches the app's naming convention for new role assignments.
ALTER TABLE public.admins
  DROP CONSTRAINT IF EXISTS admins_role_check,
  ADD CONSTRAINT admins_role_check CHECK (role IN (
    'SuperAdmin', 'RegionalAdmin', 'FinanceOfficer',
    'ADMIN', 'SUPER_ADMIN', 'FINANCE_OFFICER',
    'FOUNDER', 'ORGANIZER', 'REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD',
    'VERIFIER', 'CHIEF_EDITOR', 'SENIOR_EDITOR', 'EDITOR', 'JUNIOR_EDITOR',
    'REGIONAL_CORRESPONDENT'
  ));
