-- ============================================================
-- Migration: Real-data views for Sentiment Intelligence page
-- Derives national_sentiment_intelligence and
-- predictive_impact_projections from actual users table data.
-- ============================================================

-- ─── 1. Drop existing tables/views if they are empty stubs ───

DROP VIEW IF EXISTS national_sentiment_intelligence CASCADE;
DROP VIEW IF EXISTS predictive_impact_projections CASCADE;

-- ─── 2. national_sentiment_intelligence ─────────────────────
-- Aggregates per-region member stats into sentiment proxies.
-- Logic:
--   • "positive" = Active / Approved members
--   • "negative" = Suspended members
--   • "neutral"  = Pending / In Review members
--   • avg_sentiment ∈ [0,1]: (positive - negative) / total, normalised to [0,1]

CREATE OR REPLACE VIEW national_sentiment_intelligence
WITH (security_invoker = true)
AS
SELECT
  gen_random_uuid()                                        AS id,
  region,
  COUNT(*)                                                 AS total_responses,
  COUNT(*) FILTER (WHERE status IN ('Active', 'Approved')) AS positive_count,
  COUNT(*) FILTER (WHERE status = 'Suspended')             AS negative_count,
  COUNT(*) FILTER (WHERE status IN ('Pending', 'In Review')) AS neutral_count,
  ROUND(
    CASE
      WHEN COUNT(*) = 0 THEN 0.5
      ELSE GREATEST(0, LEAST(1,
        (
          COUNT(*) FILTER (WHERE status IN ('Active', 'Approved'))::numeric -
          COUNT(*) FILTER (WHERE status = 'Suspended')::numeric
        ) / NULLIF(COUNT(*), 0)::numeric * 0.5 + 0.5
      ))
    END, 3
  )                                                        AS avg_sentiment,
  NOW()                                                    AS last_updated
FROM users
WHERE region IS NOT NULL AND region <> ''
GROUP BY region
ORDER BY avg_sentiment DESC;

-- Grant read access to authenticated role
GRANT SELECT ON national_sentiment_intelligence TO authenticated;


-- ─── 3. predictive_impact_projections ───────────────────────
-- Computes 30-day projected reach per region using:
--   • current_reach        = total active members in region
--   • mobilization_velocity = members joined in last 30 days (in region)
--   • projected_reach_30d  = current_reach + velocity * 30
--   • confidence_score     = clipped ratio of active / total (higher = more confident)

CREATE OR REPLACE VIEW predictive_impact_projections
WITH (security_invoker = true)
AS
SELECT
  gen_random_uuid()                                              AS id,
  region,
  COUNT(*) FILTER (WHERE status IN ('Active', 'Approved'))       AS current_reach,
  COUNT(*) FILTER (
    WHERE joined_at >= NOW() - INTERVAL '30 days'
    AND   status IN ('Active', 'Approved', 'Pending')
  )                                                             AS mobilization_velocity,
  (
    COUNT(*) FILTER (WHERE status IN ('Active', 'Approved')) +
    COUNT(*) FILTER (
      WHERE joined_at >= NOW() - INTERVAL '30 days'
      AND   status IN ('Active', 'Approved', 'Pending')
    ) * 30
  )                                                             AS projected_reach_30d,
  ROUND(
    LEAST(1.0,
      COUNT(*) FILTER (WHERE status IN ('Active', 'Approved'))::numeric /
      NULLIF(COUNT(*), 0)::numeric
    ), 3
  )                                                             AS confidence_score,
  COUNT(*) * 2                                                  AS potential_election_impact,
  NOW()                                                         AS last_updated
FROM users
WHERE region IS NOT NULL AND region <> ''
GROUP BY region
ORDER BY projected_reach_30d DESC;

-- Grant read access to authenticated role
GRANT SELECT ON predictive_impact_projections TO authenticated;
