CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.handle_approved_finance_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reviewer_name text;
BEGIN
  IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
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
      NEW.category,
      NEW.requester_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.audit_finance_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.system_audit_logs (action, user_id, severity, details)
    VALUES (
      'Finance request ' || NEW.status,
      COALESCE(NEW.reviewed_by, NEW.requester_id),
      CASE
        WHEN NEW.status ILIKE '%reject%' OR NEW.status ILIKE '%escalat%' THEN 'warning'
        ELSE 'info'
      END,
      jsonb_build_object(
        'request_id', NEW.id,
        'type', NEW.request_type,
        'amount', NEW.amount,
        'chapter', NEW.chapter,
        'from', OLD.status,
        'to', NEW.status
      )
    );
  END IF;

  IF OLD.approval_tier IS DISTINCT FROM NEW.approval_tier
     AND NEW.approval_tier > OLD.approval_tier THEN
    INSERT INTO public.system_audit_logs (action, user_id, severity, details)
    VALUES (
      'Finance request escalated to tier ' || NEW.approval_tier,
      NEW.requester_id,
      'warning',
      jsonb_build_object(
        'request_id', NEW.id,
        'amount', NEW.amount,
        'from_tier', OLD.approval_tier,
        'to_tier', NEW.approval_tier
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.handle_approved_finance_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.audit_finance_changes() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_finance_request_approval ON public.finance_requests;
CREATE TRIGGER on_finance_request_approval
  AFTER UPDATE OF status ON public.finance_requests
  FOR EACH ROW
  EXECUTE FUNCTION app_private.handle_approved_finance_request();

DROP TRIGGER IF EXISTS trg_audit_finance ON public.finance_requests;
CREATE TRIGGER trg_audit_finance
  AFTER UPDATE ON public.finance_requests
  FOR EACH ROW
  EXECUTE FUNCTION app_private.audit_finance_changes();
