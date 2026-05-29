CREATE OR REPLACE FUNCTION public.apply_to_job(
  p_job_id       uuid,
  p_cover_letter text,
  p_resume_url   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count   integer;
  v_new_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_cover_letter IS NULL OR trim(p_cover_letter) = '' THEN
    RAISE EXCEPTION 'cover_letter_required';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM job_applications
  WHERE member_id = v_user_id
    AND created_at >= date_trunc('month', now());

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'monthly_limit_reached';
  END IF;

  BEGIN
    INSERT INTO job_applications (job_id, member_id, cover_letter, resume_url)
    VALUES (p_job_id, v_user_id, p_cover_letter, p_resume_url)
    RETURNING id INTO v_new_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'already_applied';
  END;

  RETURN v_new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_to_job(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_to_job(uuid, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.apply_to_job(uuid, text, text) TO authenticated;
