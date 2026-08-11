-- Normalize non-canonical public.users.region values to the ghana_regions list.
--
-- 19 members (9 distinct values, all Ghana platform) held casing variants or a
-- trailing " region": EASTERN, GREATER ACCRA, WESTERN, ASHANTI, BONO, CENTRAL,
-- VOLTA, "Eastern region", "EASTERN REGION". Counting distinct region strings
-- therefore returned 25 for a country with 16 regions, which skewed admin
-- region filters and reporting. (The public site was unaffected —
-- get_public_stats() already joins region against ghana_regions.)
--
-- Match is case-insensitive with an optional " region" suffix stripped, so this
-- is safe to re-run and repairs the same class of drift if it recurs.
BEGIN;

UPDATE public.users u
SET region = r.name
FROM ghana_regions r
WHERE u.deleted_at IS NULL
  AND COALESCE(TRIM(u.region), '') <> ''
  AND u.region <> r.name
  AND lower(r.name) = lower(regexp_replace(TRIM(u.region), '\s+region$', '', 'i'));

-- Anything still unmatched needs a human decision, not a rule.
SELECT TRIM(region) AS unresolved_value, count(*) AS members
FROM public.users
WHERE deleted_at IS NULL
  AND COALESCE(TRIM(region), '') <> ''
  AND NOT EXISTS (SELECT 1 FROM ghana_regions r WHERE r.name = TRIM(region))
GROUP BY 1
ORDER BY 2 DESC;

COMMIT;
