-- Add reminder_sent_at to track which pending donations have been nudged
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

COMMENT ON COLUMN public.donations.reminder_sent_at IS
  'When the donation-reminder edge function last sent a nudge for this pending donation';
