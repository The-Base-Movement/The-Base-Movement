-- award_referral_points has no internal authorization check and accepts an
-- arbitrary member UUID. It is only ever called internally (claim_referral,
-- trg_award_referral_on_user_upsert trigger) -- never from client code.
-- SECURITY DEFINER's effective role is already the function owner by the time
-- an internal caller invokes it, so revoking anon/authenticated does not
-- break those internal call paths.
REVOKE EXECUTE ON FUNCTION public.award_referral_points(uuid) FROM anon, authenticated, PUBLIC;

-- award_referral_verification_bonus IS called directly from client code
-- (memberService.ts, admin verification-approval flow) in addition to firing
-- via the trg_award_referral_on_user_upsert trigger, so it can't simply be
-- revoked -- instead add an internal guard so a non-admin authenticated user
-- can't call it directly for an arbitrary member_id. Service-role callers
-- (auto-approval at registration, no admin session) are still allowed.
CREATE OR REPLACE FUNCTION public.award_referral_verification_bonus(p_member_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
  v_points       integer;
BEGIN
  IF NOT (coalesce(auth.role() = 'service_role', false) OR auth.uid() IS NULL OR public.is_admin()) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT referred_by INTO v_referrer_reg FROM users WHERE id = p_member_id;
  IF v_referrer_reg IS NULL OR trim(v_referrer_reg) = '' THEN RETURN; END IF;

  SELECT id INTO v_referrer_id FROM users
    WHERE upper(trim(registration_number)) = upper(trim(v_referrer_reg))
       OR id::text = trim(v_referrer_reg)
       OR phone_number = trim(v_referrer_reg)
    LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = p_member_id THEN RETURN; END IF;

  SELECT referral_verification_points INTO v_points FROM royalty_points_settings LIMIT 1;
  v_points := COALESCE(v_points, 25);

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_member_id, 'verification', v_points);

    PERFORM public.award_royalty_points(v_referrer_id, 'referral_verification', p_member_id, null);
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$function$;
