-- supabase/migrations/20260530000000_referral_system.sql

-- ── 1. referral_awards table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_awards (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_member_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  award_type         text        NOT NULL CHECK (award_type IN ('registration', 'verification')),
  points             integer     NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_member_id, award_type)
);

ALTER TABLE public.referral_awards ENABLE ROW LEVEL SECURITY;

-- Members may only read their own rows (as the referrer)
CREATE POLICY "referrer can read own awards"
  ON public.referral_awards FOR SELECT TO authenticated
  USING (referrer_id = auth.uid());

-- ── 2. award_referral_points ─────────────────────────────────────
-- Called after a new member registers via a referral link.
CREATE OR REPLACE FUNCTION public.award_referral_points(p_new_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
BEGIN
  SELECT referred_by INTO v_referrer_reg
    FROM users WHERE id = p_new_member_id;

  IF v_referrer_reg IS NULL THEN RETURN; END IF;

  SELECT id INTO v_referrer_id
    FROM users WHERE registration_number = v_referrer_reg;

  IF v_referrer_id IS NULL THEN RETURN; END IF;

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_new_member_id, 'registration', 50);

    UPDATE users SET points = COALESCE(points, 0) + 50 WHERE id = v_referrer_id;
  EXCEPTION WHEN unique_violation THEN
    NULL; -- Already awarded; skip silently
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_referral_points(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_referral_points(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.award_referral_points(uuid) TO authenticated;

-- ── 3. award_referral_verification_bonus ─────────────────────────
-- Called when a member's status is set to Active / Approved.
CREATE OR REPLACE FUNCTION public.award_referral_verification_bonus(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
BEGIN
  SELECT referred_by INTO v_referrer_reg
    FROM users WHERE id = p_member_id;

  IF v_referrer_reg IS NULL THEN RETURN; END IF;

  SELECT id INTO v_referrer_id
    FROM users WHERE registration_number = v_referrer_reg;

  IF v_referrer_id IS NULL THEN RETURN; END IF;

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_member_id, 'verification', 25);

    UPDATE users SET points = COALESCE(points, 0) + 25 WHERE id = v_referrer_id;
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) TO authenticated;

-- ── 4. get_referral_leaderboard ──────────────────────────────────
-- Returns top 10 referrers by count of non-deleted referred members.
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard()
RETURNS TABLE (
  referrer_id         uuid,
  full_name           text,
  registration_number text,
  avatar_url          text,
  referral_count      bigint
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
    COUNT(r.id)::bigint        AS referral_count
  FROM users u
  JOIN users r
    ON r.referred_by = u.registration_number
   AND r.deleted_at IS NULL
  WHERE u.deleted_at IS NULL
  GROUP BY u.id, u.full_name, u.registration_number, u.avatar_url
  ORDER BY referral_count DESC
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_referral_leaderboard() TO authenticated;
