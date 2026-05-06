# The Base website rebuild brief

## Project overview

Rebuild **The Base** website as a modern, fast, mobile-first political movement platform for Ghana and the diaspora. The rebuilt product should preserve the current movement messaging, agenda structure, and conversion paths, while upgrading trust, design quality, content hierarchy, and admin usability.

Core slogan:

- **Ghana First, Jobs for the youth!**

Core positioning:

- A global political movement uniting people worldwide to build a stronger, more prosperous Ghana.
- Primary conversion goal: membership registration.
- Secondary goals: agenda discovery, donation, chapter growth, member engagement, and supporter communication.

## What exists on the current site

The current public site includes:

- Main navigation: Home, The Plan, Register, Supplies, Donate, Login, Contact Us, Admin Login.
- Hero messaging with movement slogan and two registration paths: **Base Ghana** and **Base Diaspora**.
- Vision, mission, and values blocks.
- Public social links: Facebook, Instagram, TikTok, YouTube.
- Social proof counter showing **355,482** people joined and **2** platforms.
- Footer links to Aims & Objectives, Chapters, Members, Donate, Impact, Join, Sign In, and Privacy Agreement.
- A plan page with six policy aims and detailed objectives.
- A registration page offering online registration and completed form upload.

## Rebuild goals

1. Present the movement as credible, national, and organized.
2. Make registration the clearest action across the site.
3. Improve readability of long-form political plan content.
4. Separate public marketing content from member/admin functions.
5. Make the system easy to update without editing code for every change.
6. Design for Ghana-first audiences while still serving diaspora supporters.

## Suggested product structure

### Public-facing pages

1. Home
2. The Plan
3. Register
4. Contact
5. Donate
6. Supplies
7. Chapters
8. Members
9. Impact
10. Privacy Agreement

### Account/admin pages

1. Login
2. Admin Login
3. Member overview
4. Admin dashboard

## Information architecture

### 1. Home

Purpose:

- Introduce the movement.
- Explain what The Base stands for.
- Drive registration.

Recommended sections:

- Header/navigation
- Hero section
- Two-path registration cards: Base Ghana / Base Diaspora
- Vision, Mission, Values
- Trust/social proof counters
- Plan preview (6 pillars summary)
- Why join / movement benefits
- Chapters/community callout
- Donation/support section
- Social/community links
- Footer

Homepage CTA priority:

- Primary: Register now
- Secondary: View the plan
- Tertiary: Contact / Donate

### 2. The Plan

Purpose:

- Present policy direction in a serious, readable format.

Recommended sections:

- Intro to aims vs objectives
- Sticky side navigation or jump links
- Six major aims
- Expandable/collapsible objective groups under each aim
- Final covenant section
- CTA to join movement

The six plan pillars currently represented are:

1. Quality Education for Every Ghanaian
2. Lean, Accountable Government
3. Industrialisation, Tourism & Agro-Processing
4. Quality Infrastructure - From Cities to Villages
5. Comprehensive Institutional Reform
6. Expertise-Led Agriculture Sector

### 3. Register

Purpose:

- Convert visitors into members.

Recommended flows:

- Register online
- Upload completed form
- Choose platform: Ghana or Diaspora
- Sign-in link for existing members

Recommended registration fields:

- First name
- Last name
- Email address
- Phone number
- Country of residence
- Region/state/city
- Platform type (Ghana / Diaspora)
- Date of birth
- Occupation
- Interest areas / volunteer preferences
- Consent / privacy agreement checkbox

### 4. Contact

Purpose:

- Make it easy to reach the movement.

Recommended elements:

- Contact form
- WhatsApp or phone option if applicable
- Email addresses by purpose
- Headquarters or office presence if available
- Social links

Observed form pattern from the current site suggests:

- Name
- Email
- Phone
- Platform
- Message

### 5. Donate

Purpose:

- Allow supporters to contribute financially.

Recommended elements:

- Donation explanation
- One-time vs recurring support
- Currency options if relevant
- Payment rails
- Trust and transparency notes
- Donation FAQ

### 6. Supplies

Purpose:

- Merchandise, campaign materials, branded items.

Recommended elements:

- Product grid
- Product detail pages
- Cart/checkout if needed
- Simple admin controls for stock/status

### 7. Chapters

Purpose:

- Organize local communities.

Recommended elements:

- Country/region-based chapter listings
- Chapter leaders/coordinators
- Join a chapter CTA
- Start a chapter CTA
- Event blocks or updates

### 8. Members

Purpose:

- Show community momentum or protected member resources.

Options:

- Public member showcase/statistics page
- Logged-in member area for profile, membership ID, updates, events

### 9. Impact

Purpose:

- Demonstrate proof of movement activity.

Recommended elements:

- Projects
- Community outreach stories
- Campaign milestones
- Photo/video evidence
- Timeline of achievements

### 10. Privacy Agreement

Purpose:

- Support registration, trust, and data handling compliance.

## Design direction for AI build

Use a **trustworthy, civic, modern-African** visual language - not a generic SaaS template.

Design guidance:

- Tone: serious, hopeful, organized, patriotic.
- Visual style: clean editorial + modern campaign website.
- Typography: bold headline serif or strong display face paired with readable sans-serif body text (Public Sans & Work Sans - locally hosted for performance and technical authority).
- Layout: structured, mobile-first, high readability, strong CTAs.
- Color direction: Ghana-inspired but restrained; avoid loud flag-color overload. Use mostly neutrals with one primary accent and one support accent.
- Use photography or documentary-style visuals only if high quality and authentic.
- Avoid AI-template clichés: gradient blobs, overrounded cards, generic startup icons, three-column SaaS filler sections.

## Recommended tech direction

Choose one of these based on delivery speed and long-term maintainability:

### Option A: WordPress

Best if:

- Non-technical editors will update pages often.
- You want quick content management.
- You prefer custom theme development with ACF/Custom Post Types.

Suggested WP setup:

- Custom theme
- ACF for flexible sections
- Custom post types: Chapters, Impact Stories, Members, Products, Agenda Pillars
- Gravity Forms or Fluent Forms for registration/contact
- WooCommerce for Store if needed

### Option B: Next.js + headless CMS

Best if:

- You want a more custom product feel.
- You want stronger performance and developer control.
- Member/admin flows may grow over time.

Suggested stack:

- Next.js frontend
- Tailwind or custom CSS system
- Supabase / Firebase / PostgreSQL backend
- Headless CMS such as Sanity, Strapi, or Directus
- Auth for member/admin areas

### Option C: Laravel

Best if:

- You want a classic custom full-stack build with strong admin control.
- You prefer PHP and custom workflows.

## Content model for CMS or database

### Core content types

- Pages
- Plan pillars
- Plan objectives
- Chapters
- Members
- Impact stories
- Donations settings
- Products/supplies items
- Testimonials or endorsements (optional)
- FAQs

### Example fields

#### Plan pillar

- Title
- Slug
- Short summary
- Full description
- Display order
- Objectives (repeatable)

#### Chapter

- Name
- Country
- Region/city
- Description
- Coordinator name
- Contact details
- Status (active/inactive)

#### Impact story

- Title
- Summary
- Full story
- Date
- Media gallery
- Location
- Category

#### Member

- Full name
- Platform (Ghana/Diaspora)
- Country
- Region/city
- Phone
- Email
- Membership ID
- Status
- Registration date

## Functional requirements

### Public site

- Responsive navigation
- Plan browsing
- Registration path selection
- Contact form
- Donation flow
- Supplies/catalog pages
- Social sharing links
- SEO metadata per page

### Member/admin system

- Member registration management
- Admin login
- Form submission review
- Uploaded registration form handling
- Dashboard analytics
- Content management
- Search/filter by platform, chapter, location, status

## UX requirements

- Fast mobile experience for Ghana networks and lower-end devices.
- Clear top navigation and sticky call to action.
- Readable agenda page with jump navigation.
- Short forms with progress indicators where needed.
- Accessible colors and high-contrast text.
- 44px minimum touch targets.
- Good empty states and validation feedback.

## SEO and content requirements

- Optimize each page title and meta description.
- Use clean heading hierarchy.
- Build schema where relevant: organization, website, article/news, FAQ.
- Create indexable content for agenda, chapters, impact, and key campaign pages.
- Ensure strong internal linking from home to register, agenda, chapters, impact, and donate.

## Asset list AI/designer/developer will need

- Official logo files (SVG/PNG)
- Brand colors and font direction (Public Sans & Work Sans - Locally Hosted)
- Final approved copy for all pages
- Registration form fields and rules
- Donation/payment setup details
- Contact emails and phone numbers
- Chapter data
- Member/privacy policy text
- Impact photos/videos
- Supplies products and pricing
- Admin roles and permissions

## Build priority roadmap

### Phase 1

- Home
- The Plan
- Register
- Contact
- Privacy

### Phase 2

- Donate
- Chapters
- Impact
- Login
- Admin login

### Phase 3

- Supplies
- Member overview
- Admin dashboard enhancements

## Copy/prompt block for AI builder

Use this exact brief with AI coding tools:

> Rebuild The Base website as a modern responsive political movement platform for Ghana and the diaspora. Preserve the current core messaging: “Ghana First, Jobs for the youth!” and the movement identity around patriotism, honesty, and discipline. Build public pages for Home, The Plan, Register, Contact, Donate, Supplies, Chapters, Members, Impact, and Privacy Agreement, plus Login and Admin Login. The homepage should include a hero, Base Ghana vs Base Diaspora registration paths, vision/mission/values, trust counters, plan preview, chapter/community section, donation CTA, and social links. The Plan page should include the six policy aims and their detailed objectives in a readable structured format with jump navigation. The Register flow should support online registration and upload of completed forms, with clear Ghana and Diaspora pathways. The Contact page should support name, email, phone, platform, and message fields. Build the system so admins can manage plan content, members, chapters, impact stories, supplies items, donation settings, and site content. Use a trustworthy, civic, modern-African design language with mobile-first UX, strong accessibility, and clean SEO structure.

## Notes for implementation

- Keep the homepage emotionally strong but not flashy.
- The plan page is one of the most important assets; treat it like a campaign manifesto.
- Make registration available from multiple page sections.
- Separate public persuasion pages from member/admin utility pages.
- Design the content system so campaign staff can update it without developer help.
