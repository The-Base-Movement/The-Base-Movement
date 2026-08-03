-- Run this once before going to production to wipe all test finance data.
-- Choose ONE of the options below and comment out the others.

-- ─── Option A: Full wipe (all requests + all ledger entries) ──────────────────
TRUNCATE public.finance_requests, public.mobilization_ledger RESTART IDENTITY CASCADE;

-- ─── Option B: Delete only finance-request-generated ledger rows ──────────────
-- DELETE FROM public.mobilization_ledger
-- WHERE description LIKE '%: %'
--    OR description LIKE '[Auto-Approved Request]%';
-- DELETE FROM public.finance_requests;

-- ─── Option C: Delete everything before a specific date ───────────────────────
-- DELETE FROM public.finance_requests  WHERE created_at  < '2026-01-01';
-- DELETE FROM public.mobilization_ledger WHERE timestamp < '2026-01-01';
