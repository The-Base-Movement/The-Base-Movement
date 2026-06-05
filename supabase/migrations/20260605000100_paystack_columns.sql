-- Add Paystack columns to donations
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS constituency text;

-- Add Paystack columns to store_orders
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded'));

-- Grant SELECT on new donations columns (column-level security pattern for this table)
GRANT SELECT (paystack_reference) ON TABLE public.donations TO authenticated;
GRANT SELECT (paystack_reference) ON TABLE public.donations TO anon;
GRANT SELECT (constituency) ON TABLE public.donations TO authenticated;
GRANT SELECT (constituency) ON TABLE public.donations TO anon;
