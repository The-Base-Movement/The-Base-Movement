-- ==============================================
-- THE BASE MOVEMENT: GROWTH TRENDS VIEW
-- ==============================================

-- Create a view to track daily membership signups for the Dashboard Analytics
DROP VIEW IF EXISTS public.membership_growth_view;

CREATE VIEW public.membership_growth_view AS
SELECT 
    DATE(joined_at)::text AS date,
    COUNT(*)::integer AS count
FROM public.users
GROUP BY DATE(joined_at)
ORDER BY DATE(joined_at) ASC;

GRANT SELECT ON public.membership_growth_view TO authenticated;
GRANT SELECT ON public.membership_growth_view TO service_role;
