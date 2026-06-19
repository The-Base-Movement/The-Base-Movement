-- Setup blog_post_likes table and clean RLS policies
-- Drops and recreates the table to wipe out any old, conflicting hidden policies or columns.

DROP TABLE IF EXISTS public.blog_post_likes CASCADE;

CREATE TABLE public.blog_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public (anonymous and authenticated) access
CREATE POLICY "Allow public read access to blog_post_likes"
  ON public.blog_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to blog_post_likes"
  ON public.blog_post_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to blog_post_likes"
  ON public.blog_post_likes FOR DELETE
  USING (true);

-- Grant appropriate permissions to public roles (anon and authenticated)
GRANT SELECT, INSERT, DELETE ON TABLE public.blog_post_likes TO anon, authenticated;
