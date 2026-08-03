-- Allow admin roles to read password reset OTP logs
-- This enables the admin PasswordResets dashboard to show SMS reset history

CREATE POLICY "admins_can_read_password_reset_otps"
  ON password_reset_otps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'SUPER_ADMIN', 'FOUNDER', 'IT')
    )
  );
