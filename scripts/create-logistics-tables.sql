-- Run this in the Supabase SQL editor to create the missing analytics tables.

-- Logistics velocity / fulfillment metrics per region
CREATE TABLE IF NOT EXISTS logistics_velocity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region          text NOT NULL,
  total_orders    integer NOT NULL DEFAULT 0,
  avg_dispatch_hours  numeric(6,2) NOT NULL DEFAULT 0,
  avg_delivery_hours  numeric(6,2) NOT NULL DEFAULT 0,
  fulfillment_rate    numeric(5,2) NOT NULL DEFAULT 0,  -- 0–100 percent
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Chapter performance leaderboard
CREATE TABLE IF NOT EXISTS chapter_performance (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region                    text NOT NULL,
  chapter                   text NOT NULL,
  total_patriots            integer NOT NULL DEFAULT 0,
  aggregate_chapter_points  integer NOT NULL DEFAULT 0,
  total_chapter_achievements integer NOT NULL DEFAULT 0,
  regional_chapter_rank     integer NOT NULL DEFAULT 0,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (read-only for authenticated users, managed by admins)
ALTER TABLE logistics_velocity    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_performance   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON logistics_velocity
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON chapter_performance
  FOR SELECT TO authenticated USING (true);
