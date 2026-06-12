-- Migration to add preferences to admins table
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
