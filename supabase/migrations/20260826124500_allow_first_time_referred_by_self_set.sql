-- block_privileged_self_update (20260826112000) blocked ALL non-admin
-- changes to referred_by, but claim_referral() is a legitimate,
-- correctly-guarded RPC that sets it exactly once (its own WHERE clause
-- requires referred_by IS NULL, plus a 90-day window and self-referral
-- guard). That blanket block would have silently broken every real
-- member's referral claim. The actual farming exploit was changing an
-- ALREADY-SET referred_by repeatedly, not the one-time NULL -> value
-- transition. Narrowing the guard to match.

CREATE OR REPLACE FUNCTION public.block_privileged_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.points IS DISTINCT FROM OLD.points
    OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password
    OR NEW.registered_by IS DISTINCT FROM OLD.registered_by
    OR NEW.registration_source IS DISTINCT FROM OLD.registration_source
    OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    OR NEW.verification_notes IS DISTINCT FROM OLD.verification_notes
    OR NEW.followup_count IS DISTINCT FROM OLD.followup_count
    OR NEW.followup_sent_at IS DISTINCT FROM OLD.followup_sent_at
    OR NEW.engagement_status IS DISTINCT FROM OLD.engagement_status
    OR NEW.platform IS DISTINCT FROM OLD.platform
    OR NEW.temp_password_sent_at IS DISTINCT FROM OLD.temp_password_sent_at
  THEN
    RAISE EXCEPTION 'Not permitted to modify this field on your own account';
  END IF;

  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by AND OLD.referred_by IS NOT NULL THEN
    RAISE EXCEPTION 'Not permitted to modify this field on your own account';
  END IF;

  IF NEW.registration_number IS DISTINCT FROM OLD.registration_number
    AND nullif(trim(NEW.registration_number), '') IS NOT NULL
  THEN
    RAISE EXCEPTION 'Not permitted to modify this field on your own account';
  END IF;

  RETURN NEW;
END;
$$;
