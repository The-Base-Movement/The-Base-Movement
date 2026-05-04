-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  icon character varying NOT NULL,
  description text NOT NULL,
  points_awarded integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admins (
  id uuid NOT NULL,
  role character varying DEFAULT 'Editor'::character varying,
  permissions jsonb DEFAULT '{}'::jsonb,
  assigned_region character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  action character varying NOT NULL,
  resource character varying NOT NULL,
  status character varying NOT NULL,
  admin_id uuid,
  metadata jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_admin_id FOREIGN KEY (admin_id) REFERENCES public.admins(id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  description text NOT NULL,
  points_required integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  excerpt text,
  content text,
  author_id uuid,
  category character varying,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tags ARRAY,
  is_featured boolean DEFAULT false,
  read_time character varying,
  seo_title character varying,
  meta_description text,
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.broadcasts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  target_type text NOT NULL,
  target_value text,
  priority text DEFAULT 'Normal'::text,
  status text DEFAULT 'Sent'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT broadcasts_pkey PRIMARY KEY (id),
  CONSTRAINT broadcasts_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chapter_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  applicant_id uuid,
  proposed_chapter_name character varying NOT NULL,
  region character varying NOT NULL,
  constituency character varying NOT NULL,
  experience_summary text,
  vision_statement text,
  status character varying DEFAULT 'Pending'::character varying,
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chapter_applications_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id),
  CONSTRAINT chapter_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admins(id)
);
CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  city_or_region character varying,
  country character varying DEFAULT 'Ghana'::character varying,
  leader_name character varying,
  member_count integer DEFAULT 0,
  description text,
  details_url text,
  status character varying DEFAULT 'Active'::character varying,
  leader_id uuid,
  region character varying,
  constituency character varying,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  author_name character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id)
);
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  dialing_code character varying,
  is_diaspora boolean DEFAULT true,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.donation_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  target_amount numeric NOT NULL,
  raised_amount numeric DEFAULT 0,
  end_date timestamp with time zone,
  status character varying DEFAULT 'Active'::character varying,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT donation_campaigns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid,
  campaign_id uuid,
  full_name character varying NOT NULL,
  phone character varying NOT NULL,
  amount numeric NOT NULL,
  country character varying,
  payment_method character varying,
  receipt_url text,
  status character varying DEFAULT 'Pending'::character varying,
  show_on_dashboard boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  verified_by uuid,
  verification_notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.donation_campaigns(id),
  CONSTRAINT donations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.admins(id)
);
CREATE TABLE public.field_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamp with time zone NOT NULL,
  location text NOT NULL,
  chapter text NOT NULL,
  status text NOT NULL DEFAULT 'Planned'::text CHECK (status = ANY (ARRAY['Planned'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text])),
  type text NOT NULL DEFAULT 'Rally'::text CHECK (type = ANY (ARRAY['Rally'::text, 'Town Hall'::text, 'Recruitment'::text, 'Training'::text])),
  attendees_expected integer DEFAULT 0,
  attendees_actual integer DEFAULT 0,
  budget_allocated numeric DEFAULT 0.00,
  budget_spent numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT field_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ghana_constituencies (
  id integer NOT NULL DEFAULT nextval('ghana_constituencies_id_seq'::regclass),
  region_id integer,
  name character varying NOT NULL,
  CONSTRAINT ghana_constituencies_pkey PRIMARY KEY (id),
  CONSTRAINT ghana_constituencies_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.ghana_regions(id)
);
CREATE TABLE public.ghana_regions (
  id integer NOT NULL DEFAULT nextval('ghana_regions_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT ghana_regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logistics_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  product_id uuid,
  action character varying NOT NULL,
  quantity_change integer NOT NULL,
  source_location character varying DEFAULT 'National Vault'::character varying,
  destination_location character varying,
  performed_by uuid,
  notes text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT logistics_audit_pkey PRIMARY KEY (id),
  CONSTRAINT logistics_audit_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.resource_requests(id),
  CONSTRAINT logistics_audit_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id),
  CONSTRAINT logistics_audit_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.member_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  achievement_id uuid,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT member_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT member_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.member_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  content text NOT NULL,
  sentiment_score double precision DEFAULT 0.0,
  is_reviewed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT member_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.member_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  points integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_points_pkey PRIMARY KEY (id),
  CONSTRAINT member_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.mobilization_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['Allocation'::text, 'Expenditure'::text])),
  amount numeric NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['Logistics'::text, 'Media'::text, 'Venues'::text, 'Transport'::text, 'Other'::text])),
  timestamp timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT mobilization_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT mobilization_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.movement_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text NOT NULL,
  target_date timestamp with time zone,
  status character varying DEFAULT 'Upcoming'::character varying,
  category character varying,
  importance_level character varying DEFAULT 'Normal'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  target_members integer,
  CONSTRAINT movement_milestones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  broadcast_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'Info'::text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_broadcast_id_fkey FOREIGN KEY (broadcast_id) REFERENCES public.broadcasts(id)
);
CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid,
  label character varying NOT NULL,
  votes integer DEFAULT 0,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid,
  option_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  status character varying DEFAULT 'Active'::character varying,
  total_votes integer DEFAULT 0,
  region character varying DEFAULT 'National'::character varying,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  category text DEFAULT 'General'::text,
  CONSTRAINT polls_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resource_request_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  product_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resource_request_items_pkey PRIMARY KEY (id),
  CONSTRAINT resource_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.resource_requests(id),
  CONSTRAINT resource_request_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.resource_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid,
  region character varying NOT NULL,
  constituency character varying,
  status character varying DEFAULT 'Pending'::character varying,
  priority character varying DEFAULT 'Normal'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resource_requests_pkey PRIMARY KEY (id),
  CONSTRAINT resource_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  author_name character varying NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.store_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  category character varying,
  price_ghs numeric NOT NULL,
  stock_quantity integer DEFAULT 0,
  status character varying DEFAULT 'Available'::character varying,
  image_emoji text,
  brand_color character varying,
  slug character varying UNIQUE,
  image_url text,
  description text,
  rating numeric DEFAULT 5.0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT store_inventory_pkey PRIMARY KEY (id)
);
CREATE TABLE public.store_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT store_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT store_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.store_orders(id),
  CONSTRAINT store_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.store_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid,
  full_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  shipping_address text NOT NULL,
  city character varying,
  country character varying NOT NULL,
  region_or_state character varying,
  payment_method character varying NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric NOT NULL,
  total_amount numeric NOT NULL,
  status character varying DEFAULT 'Pending'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  processing_at timestamp with time zone,
  dispatched_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  CONSTRAINT store_orders_pkey PRIMARY KEY (id),
  CONSTRAINT store_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  badge_id uuid,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT auth.uid(),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  registration_number character varying NOT NULL UNIQUE,
  platform character varying NOT NULL,
  country character varying NOT NULL,
  phone_number character varying,
  gender character varying,
  region character varying,
  constituency character varying,
  chapter character varying,
  profession character varying,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status character varying DEFAULT 'Active'::character varying,
  avatar_url text,
  age_range character varying,
  education_level character varying,
  emergency_name character varying,
  emergency_relationship character varying,
  emergency_phone character varying,
  verification_status character varying DEFAULT 'In Review'::character varying,
  points bigint DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);