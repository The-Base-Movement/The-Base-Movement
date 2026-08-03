-- Fix handle_approved_finance_request trigger:
-- 1. Look up approver full_name so dashboard shows "Name: description" instead of "[Auto-Approved Request] ..."
-- 2. Use 'Expenditure' for all approved request types (BudgetAllocation was using 'Allocation'
--    which is invisible to getSummaryStats / getRecentTransactions dashboard queries)
CREATE OR REPLACE FUNCTION public.handle_approved_finance_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  reviewer_name text;
BEGIN
    IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
        NEW.reviewed_at = now();

        SELECT full_name INTO reviewer_name
        FROM public.users
        WHERE id = NEW.reviewed_by;

        INSERT INTO public.mobilization_ledger (
            chapter,
            transaction_type,
            amount,
            description,
            category,
            created_by
        ) VALUES (
            NEW.chapter,
            'Expenditure'::text,
            NEW.amount,
            COALESCE(reviewer_name, 'auto') || ': ' || NEW.description,
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
$function$;
