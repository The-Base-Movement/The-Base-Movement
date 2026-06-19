CREATE TABLE public.newsletters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text NOT NULL,
  body_html        text NOT NULL,
  audience_type    text NOT NULL CHECK (audience_type IN ('all','region','constituency','chapter','role')),
  audience_value   text,
  recipient_count  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error_message    text,
  sent_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can insert newsletters"
  ON public.newsletters FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can select newsletters"
  ON public.newsletters FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can update newsletters"
  ON public.newsletters FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
