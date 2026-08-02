-- Migration: Normalize platform column to consistent uppercase values

UPDATE public.users
SET platform = UPPER(platform)
WHERE platform IS NOT NULL
  AND platform != UPPER(platform);
