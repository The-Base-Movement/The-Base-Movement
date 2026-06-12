-- 🚩 THE BASE: TACTICAL DIRECTIVE SEEDING
-- Run this in the Supabase SQL Editor to activate the first set of Real-World Directives.

-- Set the Admin ID (HQ System Admin)
DO $$
DECLARE
    admin_id UUID := '5b7dd2c1-1307-41bb-845c-92b193220f79';
BEGIN
    -- 1. Operation "Industrial Seed"
    INSERT INTO public.rapid_response_directives (title, description, priority, target_region, action_type, status, created_by, expires_at)
    VALUES (
        'Operation "Industrial Seed"',
        'Coordinate with local artisans in Kumasi to identify space for the first youth industrial hub. Document potential for metal fabrication and woodwork.',
        'HIGH',
        'Ashanti',
        'FIELD_SURVEY',
        'ACTIVE',
        admin_id,
        NOW() + INTERVAL '7 days'
    ) ON CONFLICT DO NOTHING;

    -- 2. Youth Agricultural Vanguard
    INSERT INTO public.rapid_response_directives (title, description, priority, target_region, action_type, status, created_by, expires_at)
    VALUES (
        'Youth Agricultural Vanguard',
        'Mobilize 50 volunteers for the Bono East maize cooperative harvest logistics. Ensure all transport assets are geofenced.',
        'CRITICAL',
        'Bono East',
        'SUPPLY_RUN',
        'ACTIVE',
        admin_id,
        NOW() + INTERVAL '3 days'
    ) ON CONFLICT DO NOTHING;

    -- 3. Diaspora Knowledge Bridge
    INSERT INTO public.rapid_response_directives (title, description, priority, target_region, action_type, status, created_by, expires_at)
    VALUES (
        'Diaspora Knowledge Bridge',
        'Host a digital summit for Diaspora members to mentor local Chapter leads on project management and community organization.',
        'ELEVATED',
        'NATIONAL',
        'DIGITAL_STRIKE',
        'ACTIVE',
        admin_id,
        NOW() + INTERVAL '14 days'
    ) ON CONFLICT DO NOTHING;

    -- 4. Greater Accra: Operation "Capital Surge"
    INSERT INTO public.canvassing_campaigns (title, description, target_constituency, target_wards, start_date, end_date, goal_contacts, status, commander_id)
    VALUES (
        'Operation "Capital Surge"',
        'Coordinated voter outreach in high-density areas of Ayawaso West to mobilize student and professional voters.',
        'Ayawaso West',
        ARRAY['University of Ghana', 'East Legon', 'Dzorwulu'],
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        5000,
        'ACTIVE',
        admin_id
    ) ON CONFLICT DO NOTHING;

    -- 5. Ashanti: Operation "Citadel Defense"
    INSERT INTO public.canvassing_campaigns (title, description, target_constituency, target_wards, start_date, end_date, goal_contacts, status, commander_id)
    VALUES (
        'Operation "Citadel Defense"',
        'Strengthening the base in the heart of Kumasi. Door-to-door engagement in Bantama to clarify movement policies on regional industrialization.',
        'Bantama',
        ARRAY['Abrepo', 'Bantama Central', 'North Suntreso'],
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        3500,
        'ACTIVE',
        admin_id
    ) ON CONFLICT DO NOTHING;

    -- 6. Mock Field Action for Geofenced Verification Audit
    INSERT INTO public.field_actions (title, type, description, location_name, location_lat, location_lng, geofence_radius_meters, start_time, end_time, status, target_attendance)
    VALUES (
        'Tactical Geofence Audit: HQ Support Run',
        'Logistics',
        'Field test for geofenced check-in system. Members at the drop-off point must verify their location to receive impact points.',
        'Independence Square, Accra',
        5.5486,
        -0.1926,
        500,
        NOW(),
        NOW() + INTERVAL '4 hours',
        'Live',
        50
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Tactical Directives, Canvassing Campaigns, and Field Actions successfully seeded.';

    -- 7. Schema Update: Store Point Redemption
    -- Add columns for point-based discounts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'points_redeemed') THEN
        ALTER TABLE public.store_orders ADD COLUMN points_redeemed INTEGER DEFAULT 0;
        ALTER TABLE public.store_orders ADD COLUMN points_value_ghs DECIMAL(10,2) DEFAULT 0;
    END IF;

    RAISE NOTICE '✅ Schema updated for Point Redemption.';

    -- 8. Leaderboard Rewards: Patriot of the Week Structure
    CREATE TABLE IF NOT EXISTS public.leaderboard_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rank_position INTEGER NOT NULL,
        reward_name VARCHAR NOT NULL,
        store_credit_ghs DECIMAL(10,2) DEFAULT 0,
        achievement_id UUID REFERENCES public.achievements(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );

    -- Seed Reward Structure
    INSERT INTO public.leaderboard_rewards (rank_position, reward_name, store_credit_ghs)
    VALUES 
    (1, 'Gold Patriot of the Week', 50.00),
    (2, 'Silver Patriot of the Week', 25.00),
    (3, 'Bronze Patriot of the Week', 10.00)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Leaderboard Rewards structure successfully defined.';

    -- 9. Author Onboarding: Regional Authors for all 16 Regions
    INSERT INTO public.authors (name, slug, role, bio)
    VALUES 
    ('Kofi Boateng', 'kofi-boateng', 'Ahafo Regional Correspondent', 'Covering grassroots mobilization and industrial progress in Ahafo.'),
    ('Akwasi Mensah', 'akwasi-mensah', 'Ashanti Regional Correspondent', 'Specialist in Kumasi market mobilization and youth agricultural outreach.'),
    ('Kwadwo Appiah', 'kwadwo-appiah', 'Bono Regional Correspondent', 'Documenting the Bono regional transformation and chapter growth.'),
    ('Yaw Amponsah', 'yaw-amponsah', 'Bono East Regional Correspondent', 'Bono East agricultural vanguard reports and field directives.'),
    ('Ekua Mansa', 'ekua-mansa', 'Central Regional Correspondent', 'Central region impact stories and coastal mobilization updates.'),
    ('Abena Osei', 'abena-osei', 'Eastern Regional Correspondent', 'Eastern region strategic lead and recruitment highlights.'),
    ('Nii Ayi', 'nii-ayi', 'Greater Accra Regional Correspondent', 'Urban mobilization and student vanguard reports from the capital.'),
    ('Musah Iddrisu', 'musah-iddrisu', 'North East Regional Correspondent', 'North East chapter development and regional policy advocacy.'),
    ('Alhassan Mohammed', 'alhassan-mohammed', 'Northern Regional Correspondent', 'Northern region flagship industrialization and jobs for youth.'),
    ('Komla Agbenu', 'komla-agbenu', 'Oti Regional Correspondent', 'Oti regional infrastructure and mobilization logistics.'),
    ('Seidu Adam', 'seidu-adam', 'Savannah Regional Correspondent', 'Savannah regional development and field operation reports.'),
    ('Azure Akolgo', 'azure-akolgo', 'Upper East Regional Correspondent', 'Upper East agricultural modernization and youth employment.'),
    ('Deri Bawa', 'deri-bawa', 'Upper West Regional Correspondent', 'Upper West regional empowerment and chapter leadership stories.'),
    ('Mawuli Dzokoto', 'mawuli-dzokoto', 'Volta Regional Correspondent', 'Volta regional mobilization and industrial seed program reports.'),
    ('Kweku Baidoo', 'kweku-baidoo', 'Western Regional Correspondent', 'Western region industrial hubs and youth job creation tracking.'),
    ('Nana Kwesi', 'nana-kwesi', 'Western North Regional Correspondent', 'Western North regional expansion and recruitment milestones.')
    ON CONFLICT (slug) DO NOTHING;

    RAISE NOTICE '✅ 16 Regional Authors successfully onboarded.';

    -- 10. SEO Optimization: Populate Meta Tags for Top Blog Posts
    UPDATE public.blog_posts 
    SET seo_title = 'The Future of Ghana: A Digital Movement | The Base Movement',
        meta_description = 'Discover how The Base is building a digital-first movement to transform Ghana''s future through technology, youth employment, and industrialization.'
    WHERE slug = 'future-of-ghana-digital-movement';

    UPDATE public.blog_posts 
    SET seo_title = 'Regional Mobilization in Kumasi | Ashanti Region Impact',
        meta_description = 'Impact report on the successful grassroots mobilization in Kumasi. See how the Ashanti region is leading the movement for industrial jobs.'
    WHERE slug = 'regional-mobilization-kumasi';

    UPDATE public.blog_posts 
    SET seo_title = 'Sustainable Diaspora Network for Ghana | The Base Global',
        meta_description = 'Learn how the Ghanaian diaspora is connecting back home to build a sustainable network for economic reform and project mentorship.'
    WHERE slug = 'sustainable-diaspora-network';

    UPDATE public.blog_posts 
    SET seo_title = 'Ghanaians Abroad: Reshaping the Movement | Diaspora Impact',
        meta_description = 'How the Ghanaian diaspora is using their expertise and resources to drive the national agenda for industrialization and transparency.'
    WHERE slug = 'how-ghanaians-abroad-are-reshaping-the-movement';

    RAISE NOTICE '✅ SEO Metadata successfully optimized for top blog posts.';

    -- 11. Impact Story Pipeline: Initial Regional Reports
    INSERT INTO public.blog_posts (title, slug, excerpt, content, author_id, category, is_featured, published_at)
    VALUES 
    (
        'How Kumasi Artisans are preparing for the Industrial Seed Hub',
        'kumasi-artisans-industrial-seed',
        'Local craftsmen in the Ashanti region share their vision for the upcoming industrialization project.',
        'The Ashanti region is buzzing with anticipation as the first tactical directive for the Industrial Seed Hub is deployed...',
        (SELECT id FROM public.authors WHERE slug = 'akwasi-mensah'),
        'Impact',
        true,
        NOW()
    ),
    (
        'Geofenced Maize Logistics: A Success Story from Bono East',
        'bono-east-maize-logistics',
        'How technology is ensuring every bag of harvest reaches the regional cooperatives securely.',
        'In Bono East, the Youth Agricultural Vanguard has successfully piloted the new geofenced transport system...',
        (SELECT id FROM public.authors WHERE slug = 'yaw-amponsah'),
        'Impact',
        false,
        NOW()
    ),
    (
        'Ayawaso West: 5000 Student Registrations in 30 Days',
        'ayawaso-west-student-registrations',
        'The Capital Surge campaign reaches a major milestone in Greater Accra.',
        'Greater Accra is leading the way in voter registration. Operation Capital Surge has reached its target of 5000 students...',
        (SELECT id FROM public.authors WHERE slug = 'nii-ayi'),
        'Impact',
        false,
        NOW()
    )
    ON CONFLICT (slug) DO NOTHING;

    RAISE NOTICE '✅ 3 Initial Impact Stories successfully published.';

    -- 12. Advanced Refinement: National Policy Poll
    INSERT INTO public.polls (question, status, region, end_date, category)
    VALUES (
        'Which industrial sector should be the movement''s primary focus for the first 100 days of the national implementation?',
        'Active',
        'National',
        (CURRENT_DATE + INTERVAL '14 days'),
        'Strategy'
    ) RETURNING id INTO admin_id; -- Reuse admin_id variable to hold poll_id temporarily

    INSERT INTO public.poll_options (poll_id, label, votes)
    VALUES 
    (admin_id, 'Agro-Processing & Value Addition', 0),
    (admin_id, 'Digital Economy & Software Export', 0),
    (admin_id, 'Light Manufacturing & Tooling', 0),
    (admin_id, 'Renewable Energy Infrastructure', 0);

    RAISE NOTICE '✅ National Policy Poll successfully deployed.';

    -- 13. Roadmap Synchronization: Milestone Achievement
    INSERT INTO public.movement_milestones (title, description, target_date, status, category, importance_level, target_members)
    VALUES (
        'Phase 1: Stabilization Complete',
        'National digital infrastructure stabilized. Command center hardened and tactical seeding initialized.',
        CURRENT_DATE,
        'Completed',
        'Infrastructure',
        'High',
        350000
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Roadmap synchronized with Phase 1 completion milestone.';
END $$;
