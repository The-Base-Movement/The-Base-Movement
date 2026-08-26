-- referral_awards has UNIQUE(referrer_id, referred_member_id, award_type) --
-- NOT scoped by referred_member_id alone. referred_by was left off the
-- privileged-column block (block_privileged_self_update) because it looked
-- like ordinary profile data, but it's never touched by any legitimate
-- self-edit path (only set at registration INSERT or admin CSV import).
-- Since a member could freely change their own referred_by via UPDATE, and
-- trg_award_referral_on_user_upsert fires award_referral_points() on every
-- change (old IS NULL OR old <> new), a single throwaway account could
-- repeatedly switch referred_by across many referrer accounts, farming an
-- unlimited number of referral-registration point awards from one signup.
-- Locking referred_by to write-once (INSERT only, or admin) closes this.

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
    OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
  THEN
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
