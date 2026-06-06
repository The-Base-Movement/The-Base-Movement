ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hubtel_reference text;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS hubtel_reference text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded'));

GRANT SELECT (hubtel_reference) ON TABLE public.donations TO authenticated;
GRANT SELECT (hubtel_reference) ON TABLE public.donations TO anon;
