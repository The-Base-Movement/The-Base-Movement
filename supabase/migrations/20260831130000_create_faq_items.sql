-- Backend-manageable FAQ content, mirrors the blog_posts publish/RLS pattern.
create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  question text not null,
  answer_html text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;

create policy "Public can read published faq_items, admins read all"
  on public.faq_items for select
  using (is_published = true or is_admin());

create policy "Admins can insert faq_items"
  on public.faq_items for insert
  with check (is_admin());

create policy "Admins can update faq_items"
  on public.faq_items for update
  using (is_admin());

create policy "Admins can delete faq_items"
  on public.faq_items for delete
  using (is_admin());

insert into public.faq_items (slug, category, question, answer_html, sort_order, is_published) values
(
  'new-site',
  'App & Security',
  'The website looks different, is thebasemovement.org.gh really official?',
  '<p>Yes. <strong>thebasemovement.org.gh</strong> is our official, permanent website. If you registered on the old site, your existing email and password still work here, you do not need to register again. Simply <a href="/login">log in</a> with your usual password and check your profile. New here? You can <a href="/register">create an account</a> in two minutes.</p><p>Need help logging in? Email us at <a href="mailto:info@thebasemovement.org.gh">info@thebasemovement.org.gh</a><br>or call <a href="tel:+233500489697">+233 500 4896 97</a>.</p>',
  0,
  true
),
(
  'what-is-the-base-movement',
  'General & Mission',
  'What is The Base Movement in Ghana?',
  '<p>The Base Movement is a grassroots socio-political organization in Ghana focused on industrialization, job creation, and economic accountability under the core mission <strong>"Ghana First, Jobs for the Youth"</strong>.</p>',
  1,
  true
),
(
  'founder',
  'Founder & Leadership',
  'Who is the founder of The Base Movement?',
  '<p>The Base Movement was founded by Ghanaian businessman and philanthropist <a href="/officers/dr-george-oti-bonsu"><strong>Dr. George Oti Bonsu</strong></a> to empower youth, foster disciplined governance, and drive nationwide economic transformation.</p>',
  2,
  true
),
(
  'diaspora-join',
  'Diaspora & Registration',
  'How do I join The Base Movement from the Diaspora?',
  '<p>Ghanaians living abroad can join by visiting our official website and completing the online <a href="/register?platform=DIASPORA">Diaspora Registration Form</a> to get assigned to your international country chapter and receive your verified digital membership card.</p>',
  3,
  true
),
(
  'mobile-app',
  'App & Security',
  'Does The Base Movement have an official mobile app?',
  '<p>Yes, The Base Movement provides an official, lightweight Progressive Web App (PWA) directly via our website at <a href="/app">thebasemovement.org.gh/app</a>. It can be installed in seconds on Android, iPhone/iPad (iOS Safari), and Desktop without requiring Google Play Store or Apple App Store accounts.</p>',
  4,
  true
),
(
  'jobs-plan',
  'General & Mission',
  'How does The Base Movement plan to create youth jobs in Ghana?',
  '<p>Through our strategic <strong>1-Million Jobs Plan</strong> focused on priority economic sectors including agricultural industrialization, technical trades, digital technology, and local manufacturing across all 16 regions of Ghana. Read our complete blueprint on <a href="/our-agenda">The Plan</a> page.</p>',
  5,
  true
),
(
  'headquarters',
  'General & Mission',
  'Where is the national headquarters of The Base Movement located?',
  '<p>Our national headquarters is located at <a href="https://maps.app.goo.gl/AubCWUG4J9KN4x477" target="_blank" rel="noopener noreferrer"><strong>HQXC+Q76 The Base Movement, Accra, Ghana</strong></a>. You can find full contact details and Google Maps location on our <a href="/contact">Contact Page</a>.</p>',
  6,
  true
),
(
  'registration-form',
  'Diaspora & Registration',
  'How do I download the physical membership registration form?',
  '<p>Printable PDF membership entry forms for both Ghana and Diaspora networks can be previewed and downloaded directly on our <a href="/registration-form-preview?platform=GHANA" target="_blank" rel="noopener noreferrer">Downloadable Registration Forms</a> page. Once filled, scanned copies can be uploaded online for processing.</p>',
  7,
  true
),
(
  'support-donate',
  'General & Mission',
  'How can I support or donate to The Base Movement?',
  '<p>You can support community projects, youth training initiatives, and branch operations by visiting our secure <a href="/donate">Donation Portal</a> or purchasing official movement merchandise at the <a href="/store">Base Store</a>.</p>',
  8,
  true
);
