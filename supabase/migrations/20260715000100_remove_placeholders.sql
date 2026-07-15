-- Migration: Remove placeholder test blog post and leadership placeholders

-- 1. Remove the test blog post representing placeholder content
DELETE FROM public.blog_posts 
WHERE title = 'This is just a blog flow test' 
   OR title ILIKE '%blog flow test%'
   OR slug = 'blog-flow-test';

-- 2. Clear out "TO BE DECIDED" placeholder text inside the party_tiers descriptions
UPDATE public.party_tiers 
SET description = NULL 
WHERE description = 'TO BE DECIDED' 
   OR description ILIKE '%TO BE DECIDED%';

-- 3. Delete any party officials that have placeholder values as names or roles
DELETE FROM public.party_officials 
WHERE name = 'TO BE DECIDED' 
   OR role = 'TO BE DECIDED'
   OR name ILIKE '%TO BE DECIDED%'
   OR role ILIKE '%TO BE DECIDED%';
