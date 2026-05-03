-- CLEANUP SCRIPT FOR DUPLICATE DATA
-- Run this in your Supabase SQL Editor to fix duplicate countries and constituencies.

-- 1. Remove duplicate countries (keeping only one of each name)
DELETE FROM countries
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as row_num
        FROM countries
    ) t
    WHERE t.row_num > 1
);

-- 2. Remove duplicate constituencies (keeping only one per region)
DELETE FROM ghana_constituencies
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY region_id, name ORDER BY id) as row_num
        FROM ghana_constituencies
    ) t
    WHERE t.row_num > 1
);

-- 3. Apply the UNIQUE constraints now that data is clean
-- Note: These constraints are now in the main schema, but if you've already created the tables without them, run these:
ALTER TABLE countries ADD CONSTRAINT countries_name_key UNIQUE (name);
ALTER TABLE ghana_constituencies ADD CONSTRAINT ghana_constituencies_region_id_name_key UNIQUE (region_id, name);

-- 4. Verify the cleanup
-- These should return 0 rows
SELECT name, count(*) FROM countries GROUP BY name HAVING count(*) > 1;
SELECT region_id, name, count(*) FROM ghana_constituencies GROUP BY region_id, name HAVING count(*) > 1;
