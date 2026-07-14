-- Clean up auto-generated dummy emails in the public profiles table
UPDATE public.users
SET email = NULL
WHERE email ILIKE '%@thebase.org';

-- Clean up auto-generated dummy emails in the auth.users table for users who have a phone number
UPDATE auth.users
SET email = NULL,
    email_change = NULL,
    raw_user_meta_data = raw_user_meta_data - 'email'
WHERE email ILIKE '%@thebase.org' 
  AND phone IS NOT NULL 
  AND phone <> '';
