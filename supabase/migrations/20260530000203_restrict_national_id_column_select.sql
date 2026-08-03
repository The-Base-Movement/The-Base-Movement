-- Migration: restrict national_id column from non-admin SELECT
--
-- Problem: authenticated and anon have table-level SELECT on public.users,
-- which means they can read the national_id column (currently ENC:... ciphertext).
--
-- Fix: replace table-level SELECT with column-level SELECT grants that exclude
-- national_id. The column is still writable (trigger encrypts on INSERT/UPDATE),
-- and the admin_get_national_id SECURITY DEFINER RPC (running as postgres) can
-- still decrypt it. No application code changes needed.
--
-- Maintenance note: any new column added to public.users must also be added to
-- the GRANT SELECT (...) statements below for authenticated and anon to see it.

-- Step 1: Revoke table-level SELECT.
-- INSERT / UPDATE / DELETE table-level grants are not affected.
REVOKE SELECT ON TABLE public.users FROM authenticated;
REVOKE SELECT ON TABLE public.users FROM anon;

-- Step 2: Re-grant column-level SELECT on every column except national_id.
GRANT SELECT (
  id,
  full_name,
  email,
  registration_number,
  platform,
  country,
  phone_number,
  gender,
  region,
  constituency,
  chapter,
  profession,
  joined_at,
  status,
  avatar_url,
  age_range,
  education_level,
  emergency_name,
  emergency_relationship,
  emergency_phone,
  verification_status,
  points,
  verification_notes,
  children_count,
  residential_address,
  city,
  registration_source,
  referred_by,
  deleted_at
  -- national_id intentionally omitted
) ON TABLE public.users TO authenticated;

GRANT SELECT (
  id,
  full_name,
  email,
  registration_number,
  platform,
  country,
  phone_number,
  gender,
  region,
  constituency,
  chapter,
  profession,
  joined_at,
  status,
  avatar_url,
  age_range,
  education_level,
  emergency_name,
  emergency_relationship,
  emergency_phone,
  verification_status,
  points,
  verification_notes,
  children_count,
  residential_address,
  city,
  registration_source,
  referred_by,
  deleted_at
  -- national_id intentionally omitted
) ON TABLE public.users TO anon;

-- postgres and service_role retain full table-level SELECT (unchanged).
-- The admin_get_national_id SECURITY DEFINER function (running as postgres)
-- can still read and decrypt national_id via the Vault key.
