-- Migration: allow authenticated members to select other members in their same chapter or constituency securely
-- Avoids RLS recursion by using a SECURITY DEFINER helper function.

CREATE OR REPLACE FUNCTION get_user_chapter_and_constituency()
RETURNS TABLE (user_chapter VARCHAR, user_constituency VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT u.chapter::VARCHAR, u.constituency::VARCHAR 
  FROM public.users u 
  WHERE u.id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_chapter_and_constituency() TO authenticated;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "users_same_chapter_select" ON public.users;
DROP POLICY IF EXISTS "users_same_constituency_select" ON public.users;

-- Policy 1: Diaspora members can read other members of the same chapter
CREATE POLICY "users_same_chapter_select" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    chapter IS NOT NULL
    AND chapter = (SELECT u.user_chapter FROM get_user_chapter_and_constituency() u)
  );

-- Policy 2: Ghana Network members can read other members of the same constituency
CREATE POLICY "users_same_constituency_select" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    constituency IS NOT NULL
    AND constituency = (SELECT u.user_constituency FROM get_user_chapter_and_constituency() u)
  );
