# The Base — Design System

This file defines the **visual and UX system** for The Base. Use it as the single source of truth when designing components, pages, and themes.

The system must always support the live brand promise:

> “Ghana First, Jobs for the youth!” and a global movement uniting Ghanaians and friends of Ghana to build a stronger, more prosperous country. [page:1]

---

## 1. Core layout & structure

### 1.1 Global structure

Site-wide page structure:

- Top bar:
  - Logo + wordmark
  - Main nav: Home, Our Agenda, Register, Store, Donate, Login, Contact Us, Admin Login (desktop). [page:1]
  - Primary CTA button: **Register Now**
- Content area:
  - Context-specific hero + body sections
- Footer:
  - Brand block (logo, slogan, short description)
  - Movement links: Aims & Objectives, Chapters, Members, Donate, Impact. [page:1]
  - Connect links: Join, Sign In, Privacy Agreement, social icons (Facebook, Instagram, TikTok, YouTube). [page:1]
  - Copyright

### 1.2 Layout rules

- Max page width: 1200–1280px content container, centered.
- Standard section padding:
  - Mobile: 40px top/bottom
  - Desktop: 72–96px top/bottom
- Content alignment: **left-aligned** by default. Center only:
  - Hero headline + subheading
  - Key CTAs
  - Important movement stats

Grid:

- Mobile: 1 column.
- Tablet: 2 columns where useful.
- Desktop: 2–3 columns max for features/agenda summaries.

---

## 2. Color system

Brand direction: Ghana-rooted, serious political movement, **not** loud flag overload.

### 2.1 Palette (semantic names)

You can map these to CSS tokens or Tailwind theme values.

- Primary (Brand Green)

  - Use: headlines accents, buttons, key highlights, icons
  - Mood: civic, grounded, trustworthy
- Secondary (Warm Gold)

  - Use: highlights, stat labels, small accents, dividers
- Neutrals

  - Backgrounds: off-white, warm light gray
  - Surfaces: light panels, cards, menus
  - Text: very dark charcoal for body, muted gray for secondary
- Alert/support colors

  - Success: muted green (different from primary)
  - Error: deep maroon/red
  - Info: desaturated blue (sparingly)

### 2.2 Usage rules

- Default page background: soft off-white / warm neutral.
- Primary color appears:
  - Logo accent
  - Main CTAs (Register)
  - Section headers / active nav item
  - Key stats & emphasis text
- Secondary/gold:
  - Dividers
  - Pill labels
  - Small icons, underlines

Avoid:

- Full-screen flag stripes
- Big red blocks
- Rainbow gradients
- More than 2 accent colors per viewport

---

## 3. Typography system

Tone: manifesto + briefing document.

### 3.1 Type roles

- Display / Headlines (H1–H2)

  - Feel: strong, political, editorial
  - Usage: hero titles, page titles, big agenda headings
- Body (H3–H6, body text)

  - Feel: clean, readable, modern
  - Usage: paragraphs, cards, lists, labels

### 3.2 Hierarchy

- H1: page/hero title
  - Example (Home): “Ghana First, Jobs for the youth!” [page:1]
- H2:
  - Section titles: “Base Ghana”, “Base Diaspora”, “Our Vision”, “Our Mission”, “Our Values”, “Ready to Make a Difference?”, “Movement”, “Connect”. [page:1]
- H3–H4:
  - Subsection headings inside cards or content blocks
- Body:
  - All narrative copy describing vision, mission, values, agendas, instructions. [page:1]
- Meta:
  - Stat labels (“People Joined”, “Platforms (Ghana & Diaspora)”). [page:1]

Rules:

- Max 4 font sizes on any given page.
- Line length 60–75 characters for main paragraphs.
- Body font 16px minimum on all devices.

---

## 4. Components

### 4.1 Header & navigation

Elements:

- Logo (symbol + “THE BASE” wordmark)
- Nav links:
  - Home
  - Our Agenda
  - Register
  - Store
  - Donate
  - Login
  - Contact Us
  - Admin Login [page:1]
- Primary button: Register Now

Behavior:

- Desktop: full nav visible; highlight current page.
- Mobile:
  - Logo left, menu toggle right.
  - Sliding panel with nav links and register CTA.

States:

- Hover: slightly darker text, underline or subtle bottom border.
- Active: bold + accent underline/left indicator.
- Scroll: optional sticky header.

### 4.2 Hero section (Home)

Content (based on current homepage): [page:1]

- Eyebrow: THE BASE
- H1: “Ghana First, Jobs for the youth!”
- Subtext: “A global movement uniting people worldwide to build a stronger, more prosperous Ghana. Register for Base Ghana or Base Diaspora and be part of the change.”
- Primary CTA: Register Now
- Secondary CTA: Download Form
- Utility: Invite & Share, Contact Us, social links (icons). [page:1]

Layout:

- Left: text + CTAs.
- Right: illustration/photo or subtle movement graphic.
- On mobile: image below text.

CTAs:

- “Register Now” (primary button)
- “Download Form” (outlined button)
- “Our Agenda” secondary button in later section.

### 4.3 Ghana vs Diaspora cards

Source: “Base Ghana” and “Base Diaspora” blocks. [page:1]

Each card:

- Title:
  - “Base Ghana”
  - “Base Diaspora”
- Subtitle:
  - Short explanation from current copy.
- CTA:
  - “Register – Base Ghana” (links to register?platform=GHANA)
  - “Register – Base Diaspora” (links to register?platform=DIASPORA) [page:1]

Design:

- Two cards side-by-side on desktop, stacked on mobile.
- Clear badges/taglines:
  - “For Ghanaians living in Ghana”
  - “For Ghanaians and friends of Ghana living abroad” [page:1]
- Primary button style on each card.

### 4.4 Vision / Mission / Values section

From current content: [page:1]

- H2: “Our Vision, Mission & Values”
- H3 blocks:
  - Our Vision
  - Our Mission
  - Our Values
- Paragraphs:
  - Use the existing statements as long-form copy placeholder.

Design:

- Three vertical cards on mobile.
- Three-column grid on desktop.
- Icon/top accent per card (optional but consistent).

### 4.5 Stats / social proof

Current stats: “355,482 People Joined”, “2 Platforms (Ghana & Diaspora)”. [page:1]

Component:

- Large number
- Label text below
- Optional short description

Behavior:

- Count-up animation on scroll.
- Card or inline block.

Placement:

- Under Vision/Mission/Values.
- Reused in “Ready to Make a Difference?” area. [page:1]

### 4.6 Primary CTA band

Based on “Ready to Make a Difference?” section. [page:1]

Content:

- H2: “Ready to Make a Difference?”
- Supporting copy: “Join over 355,482 people who are building a better future for Ghana. Your voice, your community, your movement.”
- Buttons:
  - Primary: Register Now
  - Secondary: Our Agenda
- Social icons: Facebook, Instagram, TikTok, YouTube. [page:1]

Design:

- Full-width band, slightly darker background than main page.
- Centered or left-aligned text with buttons.

### 4.7 Footer

From current site: [page:1]

Footer blocks:

1. Brand

   - Logo
   - “THE BASE”
   - “Ghana First, Jobs for the youth!”
   - Short description: “A global political movement connecting Ghanaians and friends of Ghana worldwide. Building community, driving progress.”
2. Movement

   - Aims & Objectives
   - Chapters
   - Members
   - Donate
   - Impact
3. Connect

   - Join
   - Sign In
   - Privacy Agreement
   - Social links (Facebook, Instagram, TikTok, YouTube)
4. Copyright

   - “© 2026 The Base. All rights reserved.” [page:1]

Design:

- 3-column layout on desktop, stacked on mobile.
- Simple dividers.
- Social icons as inline row.

---

## 5. Page patterns

### 5.1 Home

Use sections above in this order:

1. Hero
2. Ghana vs Diaspora cards
3. Vision / Mission / Values
4. Stats
5. CTA band (“Ready to Make a Difference?”)
6. Footer

All content is already present in the current site; this system changes **how** it’s presented, not **what** it says. [page:1]

### 5.2 Our Agenda

- Hero:
  - Title: “Our Agenda”
  - Short description referencing the vision text.
- Layout:
  - Left: sticky jump nav with six agenda pillars.
  - Right: content sections for each pillar, with headings and objectives.
- End with CTA:
  - “Join The Base”
  - Buttons: Register / Contact

### 5.3 Register

- Hero:
  - Title: “Join The Base”
  - Copy that reinforces membership significance.
- Step 1:
  - Choose platform: Ghana / Diaspora
- Step 2:
  - Registration form fields.
- Alternative path:
  - “Download Form” + upload option.
- Confirmation:
  - Clear success message + “Next steps” info.

### 5.4 Contact

Fields informed by current contact pattern: name, email, phone, platform, message. [page:1]

Sections:

- Hero: “Contact Us”
- Form block
- Secondary contact info (email, possible phone/WhatsApp)
- Social links

---

## 6. Interaction & motion

### 6.1 Hover & focus

- Links: underline on hover, color shift to primary.
- Buttons: background darkens slightly, subtle scale (max 1.03).
- Cards: soft shadow on hover, border accent.

### 6.2 Scroll behavior

- Smooth reveal for sections (fade/slide).
- Stat counters animate only once when they first enter viewport.

### 6.3 Responsiveness

- Test at:
  - 360–400px (common Ghana mobile viewports)
  - ~768px tablets
  - 1280px desktop
- Components must stack gracefully; no horizontal scroll for text.

---

## 7. Accessibility & content rules

- Contrast AA-level minimum.
- All icons have accessible labels.
- All CTAs have meaningful text (no “Click here”).
- Heading levels in order:
  - H1: page
  - H2: major sections
  - H3: subsections

Content style:

- Short sentences.
- Clear calls to action.
- Avoid jargon and overly technical language.
- Keep movement language consistent with current site’s positioning: “global movement”, “Ghanaians and friends of Ghana”, “build a stronger, more prosperous Ghana”. [page:1]

---

## 8. Implementation notes

For dev:

- Treat each section above as a reusable component or block (Hero, CTA band, Stats block, 2-card split, etc.).
- Make navigation and footer global components.
- Expose:
  - Text
  - Links
  - Stats numbers
  - Social URLs
  - Section visibility
    via CMS to allow non-dev edits.

This design system should be paired with your **brand doc** so AI tools generate code that feels like The Base, not just “a clean site”.
