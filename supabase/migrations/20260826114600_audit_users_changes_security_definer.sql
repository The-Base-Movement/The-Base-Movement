-- audit_users_changes() ran as SECURITY INVOKER, so its own INSERT into
-- system_audit_logs inherited the caller's privileges. system_audit_logs
-- correctly restricts direct INSERT to SUPER_ADMIN/FOUNDER (that stays
-- as-is), but that meant ANY status/verification_status/deleted_at change
-- made by a non-super-admin actor -- including a member's own profile
-- edit triggering auto-approval, or a lower-tier admin verifying a
-- member -- silently failed the entire UPDATE, since the trigger's own
-- audit insert got rejected by RLS. Audit logging should never depend on
-- the acting user's own privileges. Found while testing the
-- polling-station-code verification path in the same migration set.

CREATE OR REPLACE FUNCTION public.audit_users_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.system_audit_logs (action, user_id, severity, details)
    VALUES (
      'Member status changed',
      NEW.id,
      CASE
        WHEN NEW.status ILIKE '%suspend%' OR NEW.status ILIKE '%inactive%' OR NEW.status ILIKE '%ban%'
          THEN 'warning'
        ELSE 'info'
      END,
      jsonb_build_object(
        'full_name', NEW.full_name,
        'from',      OLD.status,
        'to',        NEW.status
      )
    );
  END IF;

  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.system_audit_logs (action, user_id, severity, details)
    VALUES (
      'Member account deleted',
      NEW.id,
      'warning',
      jsonb_build_object('full_name', NEW.full_name, 'email', NEW.email)
    );
  END IF;

  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.system_audit_logs (action, user_id, severity, details)
    VALUES (
      'Member verification status changed',
      NEW.id,
      'info',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'from',      OLD.verification_status,
        'to',        NEW.verification_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
