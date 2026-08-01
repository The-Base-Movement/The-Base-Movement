-- Migration: Fix referral points automation & add points display to referral leaderboard

-- 1. Robust award_referral_points function
CREATE OR REPLACE FUNCTION public.award_referral_points(p_new_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
  v_points       integer;
BEGIN
  SELECT referred_by INTO v_referrer_reg FROM users WHERE id = p_new_member_id;
  IF v_referrer_reg IS NULL OR trim(v_referrer_reg) = '' THEN RETURN; END IF;

  SELECT id INTO v_referrer_id FROM users
    WHERE upper(trim(registration_number)) = upper(trim(v_referrer_reg))
       OR id::text = trim(v_referrer_reg)
       OR phone_number = trim(v_referrer_reg)
    LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = p_new_member_id THEN RETURN; END IF;

  SELECT referral_registration_points INTO v_points FROM royalty_points_settings LIMIT 1;
  v_points := COALESCE(v_points, 50);

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_new_member_id, 'registration', v_points);

    UPDATE users SET points = COALESCE(points, 0) + v_points WHERE id = v_referrer_id;

    PERFORM public.award_royalty_points(v_referrer_id, 'referral_registration', p_new_member_id, null);
  EXCEPTION WHEN unique_violation THEN
    NULL; -- Already awarded; skip
  END;
END;
$$;

-- 2. Robust award_referral_verification_bonus function
CREATE OR REPLACE FUNCTION public.award_referral_verification_bonus(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
  v_points       integer;
BEGIN
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

    UPDATE users SET points = COALESCE(points, 0) + v_points WHERE id = v_referrer_id;

    PERFORM public.award_royalty_points(v_referrer_id, 'referral_verification', p_member_id, null);
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$$;

-- 3. Automatic Database Trigger for Referred Members
CREATE OR REPLACE FUNCTION public.trg_award_referral_on_user_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.referred_by IS NOT NULL AND trim(new.referred_by) <> '' AND (
    tg_op = 'INSERT' OR old.referred_by IS NULL OR old.referred_by <> new.referred_by
  ) THEN
    PERFORM public.award_referral_points(new.id);
  END IF;

  IF (new.verification_status = 'Approved' OR new.status = 'Active') AND (
    tg_op = 'INSERT' OR old.verification_status IS DISTINCT FROM new.verification_status OR old.status IS DISTINCT FROM new.status
  ) THEN
    PERFORM public.award_referral_verification_bonus(new.id);
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_referral_on_user_upsert ON public.users;
CREATE TRIGGER trg_award_referral_on_user_upsert
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_referral_on_user_upsert();

-- 4. Updated get_referral_leaderboard RPC returning points
DROP FUNCTION IF EXISTS public.get_referral_leaderboard();

CREATE OR REPLACE FUNCTION public.get_referral_leaderboard()
RETURNS TABLE (
  referrer_id         uuid,
  full_name           text,
  registration_number text,
  avatar_url          text,
  referral_count      bigint,
  points              bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id                       AS referrer_id,
    u.full_name::text,
    u.registration_number::text,
    u.avatar_url::text,
    COUNT(r.id)::bigint        AS referral_count,
    COALESCE(
      (SELECT SUM(mp.points) FROM public.member_points mp WHERE mp.user_id = u.id),
      u.points,
      0
    )::bigint                  AS points
  FROM users u
  JOIN users r
    ON (
      upper(trim(r.referred_by)) = upper(trim(u.registration_number))
      OR r.referred_by = u.id::text
      OR r.referred_by = u.phone_number
    )
   AND r.deleted_at IS NULL
  WHERE u.deleted_at IS NULL
  GROUP BY u.id, u.full_name, u.registration_number, u.avatar_url, u.points
  ORDER BY referral_count DESC, points DESC
  LIMIT 20;
$$;

REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_referral_leaderboard() TO authenticated;

-- 5. Historical Backfill
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM users WHERE referred_by IS NOT NULL AND trim(referred_by) <> '' AND deleted_at IS NULL LOOP
    PERFORM public.award_referral_points(r.id);
  END LOOP;
END;
$$;
