-- Add user-chosen category to finance_requests so the approval trigger
-- passes it through to mobilization_ledger instead of hardcoding by request_type.
ALTER TABLE public.finance_requests
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other';

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
            COALESCE(reviewer_name, 'Unknown') || ': ' || NEW.description,
            NEW.category,
            NEW.requester_id
        );
    END IF;
    RETURN NEW;
END;
$function$;
