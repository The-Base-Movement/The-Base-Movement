-- 🚩 THE BASE: PREDICTIVE ANALYTICS ENGINE
-- This script enhances the roadmap with membership targets to enable growth forecasting.

-- 1. Add target_members to movement_milestones
ALTER TABLE public.movement_milestones 
ADD COLUMN IF NOT EXISTS target_members integer;

-- 2. Populate some targets for existing milestones
UPDATE public.movement_milestones SET target_members = 500000 WHERE title ILIKE '%Regional HQ%';
UPDATE public.movement_milestones SET target_members = 1000000 WHERE title ILIKE '%National Convention%';

-- 3. Create a helper function for growth trend calculation
CREATE OR REPLACE FUNCTION public.get_growth_trend_days()
RETURNS integer AS $$
DECLARE
    last_7d_count integer;
BEGIN
    SELECT COUNT(*) INTO last_7d_count 
    FROM public.users 
    WHERE joined_at >= now() - interval '7 days';
    
    -- Return average daily growth
    RETURN CEIL(last_7d_count / 7.0);
END;
$$ LANGUAGE plpgsql;
