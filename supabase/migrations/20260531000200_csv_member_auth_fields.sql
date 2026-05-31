-- Add tracking columns to users table for CSV bulk import authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_sent_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Create a secure table for phone forgot password OTP verification
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Access is strictly managed by server-side Edge Functions bypassing RLS via the service_role key.
-- No public read/write access is allowed.
