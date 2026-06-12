-- 🎖️ THE BASE: PHASE 9 - AUTOMATED ACHIEVEMENT ENGINE
-- This script establishes the logic for automatic badge issuance based on mobilization impact.

-- 1. ADD POINTS_REQUIRED TO ACHIEVEMENTS
-- This defines the threshold for automatic unlocking.
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 0;

-- 2. AUTOMATED ACHIEVEMENT CHECKER FUNCTION
-- This function runs whenever a member's points are updated.
CREATE OR REPLACE FUNCTION public.check_for_achievements()
RETURNS TRIGGER AS $$
DECLARE
    total_member_points INTEGER;
    achievement_record RECORD;
BEGIN
    -- 1. Calculate current total points for the member
    SELECT COALESCE(SUM(points), 0) INTO total_member_points
    FROM public.member_points
    WHERE user_id = NEW.user_id;

    -- 2. Find achievements that the member now qualifies for but doesn't have yet
    FOR achievement_record IN 
        SELECT a.id, a.name 
        FROM public.achievements a
        WHERE a.points_required > 0 
          AND total_member_points >= a.points_required
          AND NOT EXISTS (
              SELECT 1 FROM public.member_achievements ma 
              WHERE ma.user_id = NEW.user_id AND ma.achievement_id = a.id
          )
    LOOP
        -- 3. Award the achievement
        INSERT INTO public.member_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id);
        
        -- 4. Log the automated award in the audit logs
        INSERT INTO public.audit_logs (action, resource, status, admin_id, metadata)
        VALUES (
            'AUTOMATED_AWARD',
            'member_achievements',
            'Success',
            NULL, -- System automated
            jsonb_build_object(
                'user_id', NEW.user_id,
                'achievement_name', achievement_record.name,
                'total_points', total_member_points
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER FOR POINT-BASED ACHIEVEMENTS
CREATE TRIGGER on_points_added
    AFTER INSERT ON public.member_points
    FOR EACH ROW EXECUTE FUNCTION check_for_achievements();

-- 4. UPDATE SEED DATA WITH REQUIREMENTS
UPDATE public.achievements SET points_required = 10 WHERE name = 'First Direct Action';
UPDATE public.achievements SET points_required = 500 WHERE name = 'Recruitment Sergeant';
UPDATE public.achievements SET points_required = 250 WHERE name = 'Event Veteran';
UPDATE public.achievements SET points_required = 1000 WHERE name = 'Chapter Leader';
