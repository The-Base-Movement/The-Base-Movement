-- supabase/migrations/20260530000001_referral_system_fixes.sql

-- Fix: add missing REVOKE from anon on get_referral_leaderboard
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard() FROM anon;

-- Fix: add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_registration_number
  ON public.users (registration_number);

CREATE INDEX IF NOT EXISTS idx_referral_awards_referrer
  ON public.referral_awards (referrer_id);
