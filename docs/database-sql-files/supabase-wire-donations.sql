-- WIRE DONATIONS TO CAMPAIGNS AND MEMBERS
-- Run this in your Supabase SQL Editor to link everything together.

-- 1. Link all donations to the first available campaign (as a fallback)
UPDATE donations 
SET campaign_id = (SELECT id FROM donation_campaigns ORDER BY created_at ASC LIMIT 1)
WHERE campaign_id IS NULL;

-- 2. Link donations to existing members by matching their phone numbers
-- This ensures that when a member logs in, they see their history immediately.
UPDATE donations
SET member_id = users.id
FROM users
WHERE donations.phone = users.phone;

-- 3. Update campaign progress (Simulate some progress for the demo)
UPDATE donation_campaigns
SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM donations 
    WHERE donations.campaign_id = donation_campaigns.id 
    AND donations.status = 'Verified'
);
