-- DONATION VERIFICATION SUITE MIGRATION
-- This script enables the workflow for verifying financial contributions.

-- 1. Enhance Donations Table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES admins(id),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Trigger Function: Update Campaign Progress
-- This function automatically updates the campaign's raised_amount 
-- when a donation is marked as 'Verified'.
CREATE OR REPLACE FUNCTION sync_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to Verified
    IF (TG_OP = 'UPDATE' AND NEW.status = 'Verified' AND OLD.status != 'Verified') THEN
        UPDATE donation_campaigns 
        SET raised_amount = raised_amount + NEW.amount
        WHERE id = NEW.campaign_id;
    
    -- If a Verified donation is deleted (rare, but for safety)
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'Verified') THEN
        UPDATE donation_campaigns 
        SET raised_amount = raised_amount - OLD.amount
        WHERE id = OLD.campaign_id;

    -- If a Verified donation status changes to something else
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'Verified' AND NEW.status != 'Verified') THEN
        UPDATE donation_campaigns 
        SET raised_amount = raised_amount - OLD.amount
        WHERE id = OLD.campaign_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_sync_donation_progress ON donations;
CREATE TRIGGER trg_sync_donation_progress
AFTER UPDATE OR DELETE ON donations
FOR EACH ROW
EXECUTE FUNCTION sync_campaign_raised_amount();

-- 4. Admin Function: Verify Donation
-- This allows admins to securely verify a donation with one call.
CREATE OR REPLACE FUNCTION verify_donation_record(
    donation_id UUID,
    admin_uid UUID,
    verification_status VARCHAR(50),
    notes TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE donations 
    SET 
        status = verification_status,
        verified_by = admin_uid,
        verification_notes = notes,
        updated_at = now()
    WHERE id = donation_id;

    -- Log the audit action
    INSERT INTO audit_logs (action, resource, status, admin_id, metadata)
    VALUES (
        'Verify Donation', 
        'donations', 
        'Success', 
        admin_uid, 
        jsonb_build_object('donation_id', donation_id, 'new_status', verification_status)
    );
END;
$$ LANGUAGE plpgsql;
