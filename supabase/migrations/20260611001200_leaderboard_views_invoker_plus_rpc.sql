-- Resolve the two remaining CRITICAL security-advisor findings:
-- movement_leaderboard and chapter_performance_telemetry were SECURITY
-- DEFINER views (they must aggregate member_points / member_achievements
-- across all members, which row-owner RLS would otherwise collapse).
--
-- The views become security_invoker (clearing the lint), and the public
-- leaderboard data is served instead through SECURITY DEFINER set-returning
-- functions — the same pattern as get_guest_order. The functions expose
-- exactly the columns the views always published (name/region/points/ranks);
-- nothing new is readable.

ALTER VIEW public.movement_leaderboard SET (security_invoker = true);
ALTER VIEW public.chapter_performance_telemetry SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.get_movement_leaderboard()
RETURNS SETOF public.movement_leaderboard
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.movement_leaderboard;
$$;

CREATE OR REPLACE FUNCTION public.get_chapter_performance()
RETURNS SETOF public.chapter_performance_telemetry
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.chapter_performance_telemetry;
$$;

REVOKE ALL ON FUNCTION public.get_movement_leaderboard() FROM public;
REVOKE ALL ON FUNCTION public.get_chapter_performance() FROM public;
GRANT EXECUTE ON FUNCTION public.get_movement_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_chapter_performance() TO anon, authenticated;
