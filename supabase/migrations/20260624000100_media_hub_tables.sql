-- Media & Communications Hub tables
-- Internal briefings ("The Wall"), read receipts, comments, and story assignments

-- 1. Internal briefings (The Wall)
CREATE TABLE public.media_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'important', 'urgent')),
  pinned boolean NOT NULL DEFAULT false,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_by timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Read receipts
CREATE TABLE public.media_briefing_reads (
  briefing_id uuid NOT NULL REFERENCES public.media_briefings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (briefing_id, user_id)
);

-- 3. Briefing comments
CREATE TABLE public.media_briefing_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id uuid NOT NULL REFERENCES public.media_briefings(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Story assignments
CREATE TABLE public.media_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  briefing_id uuid REFERENCES public.media_briefings(id) ON DELETE SET NULL,
  assigned_to uuid NOT NULL REFERENCES auth.users(id),
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'draft', 'in_review', 'published', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_media_briefings_created ON public.media_briefings(created_at DESC);
CREATE INDEX idx_media_briefings_pinned ON public.media_briefings(pinned) WHERE pinned = true;
CREATE INDEX idx_media_assignments_assigned_to ON public.media_assignments(assigned_to);
CREATE INDEX idx_media_assignments_status ON public.media_assignments(status);
CREATE INDEX idx_media_briefing_comments_briefing ON public.media_briefing_comments(briefing_id);

-- RLS: media_briefings
ALTER TABLE public.media_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_briefings_select" ON public.media_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_briefings_insert" ON public.media_briefings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "media_briefings_update" ON public.media_briefings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_briefings_delete" ON public.media_briefings FOR DELETE TO authenticated USING (true);

-- RLS: media_briefing_reads
ALTER TABLE public.media_briefing_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_briefing_reads_select" ON public.media_briefing_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_briefing_reads_insert" ON public.media_briefing_reads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "media_briefing_reads_update" ON public.media_briefing_reads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_briefing_reads_delete" ON public.media_briefing_reads FOR DELETE TO authenticated USING (true);

-- RLS: media_briefing_comments
ALTER TABLE public.media_briefing_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_briefing_comments_select" ON public.media_briefing_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_briefing_comments_insert" ON public.media_briefing_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "media_briefing_comments_update" ON public.media_briefing_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_briefing_comments_delete" ON public.media_briefing_comments FOR DELETE TO authenticated USING (true);

-- RLS: media_assignments
ALTER TABLE public.media_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_assignments_select" ON public.media_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_assignments_insert" ON public.media_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "media_assignments_update" ON public.media_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_assignments_delete" ON public.media_assignments FOR DELETE TO authenticated USING (true);
