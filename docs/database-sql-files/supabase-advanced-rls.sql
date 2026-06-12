-- ADVANCED RLS POLICIES: MULTI-TENANT REGIONAL ISOLATION
-- This migration implements regional data isolation for movement operatives.

-- 1. Helper Function to Check Admin Role & Region
CREATE OR REPLACE FUNCTION get_admin_data()
RETURNS TABLE (role VARCHAR, assigned_region VARCHAR) AS $$
BEGIN
    RETURN QUERY SELECT a.role, a.assigned_region FROM admins a WHERE a.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure Members (users table)
-- Drop existing broad read policy if it exists
DROP POLICY IF EXISTS "Allow public read access to users" ON users;

-- SuperAdmins see everyone
CREATE POLICY "SuperAdmins full access to members" 
ON users FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SuperAdmin')
);

-- RegionalAdmins see members in their assigned region
CREATE POLICY "RegionalAdmins regional access" 
ON users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE id = auth.uid() 
        AND role = 'RegionalAdmin' 
        AND assigned_region = users.region
    )
);

-- Members can see their own data
CREATE POLICY "Members view own data" 
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3. Secure Audit Logs
-- Regional admins should only see audit logs for their region if possible, 
-- but audit_logs don't have a region column yet. 
-- For now, SuperAdmins only.
DROP POLICY IF EXISTS "Allow superadmins to view audit logs" ON audit_logs;

CREATE POLICY "SuperAdmins full audit access" 
ON audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SuperAdmin')
);

-- 4. Secure Store Inventory (Everyone can read, only StoreManagers/SuperAdmins can write)
DROP POLICY IF EXISTS "Allow authenticated insert to store_inventory" ON store_inventory;

CREATE POLICY "Admin write access to store" 
ON store_inventory FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND (role = 'SuperAdmin' OR role = 'StoreManager'))
);
