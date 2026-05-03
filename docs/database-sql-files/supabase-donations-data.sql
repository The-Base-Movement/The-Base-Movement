-- DONATIONS DATA FOR THE BASE MOVEMENT
-- Execute this in your Supabase SQL Editor to populate campaigns and sample history.

-- 1. Create Campaigns
INSERT INTO donation_campaigns (title, description, target_amount, raised_amount, end_date, status, image_url) VALUES
(
    '2026 Election Mobilization', 
    'Funding for regional logistics, civic education, and voter engagement across all 16 regions.', 
    500000.00, 
    125000.00, 
    '2026-12-31', 
    'Active', 
    'https://images.unsplash.com/photo-1540910419892-f0c74b0e8966?auto=format&fit=crop&q=80&w=800'
),
(
    'Digital Infrastructure Fund', 
    'Scaling our servers, improving the mobile app, and hardening our database security.', 
    150000.00, 
    45000.00, 
    '2026-08-15', 
    'Active', 
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
),
(
    'National Headquarters Renovation', 
    'Creating a modern command center for movement leadership and volunteer coordination.', 
    300000.00, 
    210000.00, 
    '2026-06-30', 
    'Active', 
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800'
),
(
    '2025 Regional Youth Outreach', 
    'Completed project that successfully engaged over 50,000 young voters across the northern sector.', 
    100000.00, 
    100000.00, 
    '2025-12-31', 
    'Closed', 
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800'
);

-- 2. Sample Donations (To be linked to existing users)
-- Note: Replace member_id with actual UUIDs from your users table if needed.
INSERT INTO donations (full_name, phone, amount, country, payment_method, status, show_on_dashboard) VALUES
('Abena Mensah', '+233 538 873 569', 500.00, 'Ghana', 'MTN MoMo', 'Verified', true),
('Kwame Owusu', '+233 244 123 456', 250.00, 'Ghana', 'MTN MoMo', 'Verified', true),
('Dora Smith', '+44 7712 345678', 500.00, 'United Kingdom', 'TapTap Send', 'Verified', true);
