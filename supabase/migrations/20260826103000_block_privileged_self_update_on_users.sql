-- The users_update RLS policy (is_admin() OR id = auth.uid()) restricts
-- WHICH ROW a member can update, not WHICH COLUMNS. Column-level UPDATE
-- grants for `authenticated` cover nearly every column, so a member could
-- self-set points, registration_number, must_change_password, etc. on
-- their own row via a direct REST PATCH. Confirmed exploitable live
-- (rolled back / reverted immediately after testing).
--
-- status/verification_status/verified_at are intentionally left alone here:
-- trg_approve_on_constituency_set legitimately flips them as a side effect
-- of a member editing their own (self-editable) constituency field, and
-- memberService.updateVerificationStatus/verifyMember set them directly as
-- the admin's own `authenticated` session, not via a service-role/RPC path.
-- Blocking those needs a decision on whether the constituency auto-approve
-- is intended business logic, not a blanket lockout.

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

  -- registration_number: only allow clearing to '' (the self-heal path in
  -- ensureRegistrationNumber sets '' to trigger assign_member_registration_number
  -- to re-issue a fresh TBM-format number). Any other change is blocked.
  IF NEW.registration_number IS DISTINCT FROM OLD.registration_number
    AND nullif(trim(NEW.registration_number), '') IS NOT NULL
  THEN
    RAISE EXCEPTION 'Not permitted to modify this field on your own account';
  END IF;

  RETURN NEW;
END;
$$;

-- Named to sort alphabetically before assign_member_registration_number:
-- Postgres runs same-timing (BEFORE UPDATE) triggers in name order, and this
-- trigger must see the client's actual submitted value (e.g. '' to trigger
-- a fresh registration_number) before that trigger rewrites it, or it
-- misreads the auto-generated replacement as an unauthorized arbitrary change.
DROP TRIGGER IF EXISTS "0_block_privileged_self_update" ON public.users;
CREATE TRIGGER "0_block_privileged_self_update"
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_privileged_self_update();
