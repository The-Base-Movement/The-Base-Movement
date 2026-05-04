-- 🚩 THE BASE: MOBILIZATION AUTOMATION SETUP
-- This script establishes automated notifications for chapter leads and regional admins upon new member registrations.

-- 1. Create the notification function
CREATE OR REPLACE FUNCTION public.handle_new_member_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_chapter_lead_id uuid;
    target_regional_admin_id uuid;
BEGIN
    -- A. Attempt to find the Chapter Lead
    IF NEW.chapter IS NOT NULL THEN
        SELECT leader_id INTO target_chapter_lead_id
        FROM public.chapters
        WHERE name = NEW.chapter
        LIMIT 1;
    END IF;

    -- B. Attempt to find the Regional Admin
    IF NEW.region IS NOT NULL THEN
        SELECT id INTO target_regional_admin_id
        FROM public.admins
        WHERE assigned_region = NEW.region
        LIMIT 1;
    END IF;

    -- C. Notify Chapter Lead
    IF target_chapter_lead_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            created_at
        ) VALUES (
            target_chapter_lead_id,
            'New Chapter Member',
            'Patriot ' || NEW.full_name || ' has joined ' || NEW.chapter || '. Verify their credentials in the dashboard.',
            'Action',
            now()
        );
    END IF;

    -- D. Notify Regional Admin (if different from chapter lead or if no chapter lead)
    IF target_regional_admin_id IS NOT NULL AND (target_chapter_lead_id IS NULL OR target_regional_admin_id != target_chapter_lead_id) THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            created_at
        ) VALUES (
            target_regional_admin_id,
            'New Regional Registration',
            NEW.full_name || ' (' || NEW.registration_number || ') has registered in ' || NEW.region || '.',
            'Info',
            now()
        );
    END IF;

    -- E. Also notify Global Admins for national oversight
    -- (This could be scaled based on admin roles)

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_new_member_registration ON public.users;
CREATE TRIGGER on_new_member_registration
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_member_notification();

-- 3. Add necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_name ON public.chapters(name);
CREATE INDEX IF NOT EXISTS idx_admins_assigned_region ON public.admins(assigned_region);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
