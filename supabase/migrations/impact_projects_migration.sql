-- Charitable Works (public /impact page) — run in Supabase SQL editor.
-- Mirrors the blog_posts security model: public reads published rows, admins manage all.
-- Images reuse the existing public `media` storage bucket (folder: impact) — no new bucket needed.

CREATE TABLE IF NOT EXISTS public.impact_projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  summary        text NOT NULL DEFAULT '',
  notes          text NOT NULL DEFAULT '',
  images         text[] NOT NULL DEFAULT '{}',   -- up to 4 image URLs; first is the card cover
  location       text,
  date_performed date,
  is_published   boolean NOT NULL DEFAULT false,
  sort_order     integer NOT NULL DEFAULT 0,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

ALTER TABLE public.impact_projects ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated): only published works
CREATE POLICY "Public can read published impact_projects" ON public.impact_projects
  FOR SELECT USING (is_published = true);

-- Admins: see drafts too, and manage
CREATE POLICY "Admins can read all impact_projects" ON public.impact_projects
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert impact_projects" ON public.impact_projects
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update impact_projects" ON public.impact_projects
  FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete impact_projects" ON public.impact_projects
  FOR DELETE TO authenticated USING (is_admin());

-- Table-level grants (RLS enforces which rows). Exposes the table to the Data API.
GRANT SELECT ON public.impact_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.impact_projects TO authenticated;

CREATE INDEX IF NOT EXISTS impact_projects_published_order_idx
  ON public.impact_projects (is_published, sort_order, created_at DESC);
