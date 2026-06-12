-- 🏆 THE BASE: PHASE 9 - LEADERBOARD REFINEMENT
-- This script synchronizes the movement leaderboard with high-fidelity performance metrics.

-- 1. CONSOLIDATED MOVEMENT LEADERBOARD VIEW
-- Aggregates all mobilization impact points and ranks patriots globally and regionally.
CREATE OR REPLACE VIEW public.movement_leaderboard AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.region,
    u.chapter,
    u.registration_number,
    COALESCE(SUM(mp.points), 0) as total_points,
    COUNT(DISTINCT ma.id) as achievements_unlocked,
    RANK() OVER (ORDER BY COALESCE(SUM(mp.points), 0) DESC) as national_rank,
    RANK() OVER (PARTITION BY u.region ORDER BY COALESCE(SUM(mp.points), 0) DESC) as regional_rank
FROM public.users u
LEFT JOIN public.member_points mp ON u.id = mp.user_id
LEFT JOIN public.member_achievements ma ON u.id = ma.user_id
GROUP BY u.id, u.full_name, u.region, u.chapter, u.registration_number;

-- 2. CHAPTER PERFORMANCE VIEW
-- Aggregates chapter-level impact for competitive chapter rankings.
CREATE OR REPLACE VIEW public.chapter_performance_telemetry AS
SELECT 
    region,
    chapter,
    COUNT(DISTINCT user_id) as total_patriots,
    SUM(total_points) as aggregate_chapter_points,
    SUM(achievements_unlocked) as total_chapter_achievements,
    RANK() OVER (PARTITION BY region ORDER BY SUM(total_points) DESC) as regional_chapter_rank
FROM public.movement_leaderboard
WHERE chapter IS NOT NULL
GROUP BY region, chapter;
