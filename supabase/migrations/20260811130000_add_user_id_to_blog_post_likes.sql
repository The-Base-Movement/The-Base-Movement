-- Add user_id column and unique constraint to blog_post_likes table

ALTER TABLE public.blog_post_likes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS blog_post_likes_post_user_idx
  ON public.blog_post_likes (post_id, user_id)
  WHERE user_id IS NOT NULL;
