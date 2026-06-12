# The Base Movement — Design System

> **"Ghana First, Jobs for the Youth!"**
>
> A high-fidelity political-movement brand system rooted in the colors, voice
> and visual authority of the Republic of Ghana.

---

## 1. Company Context

**The Base Movement** ("The Base") is a grassroots Ghanaian political movement
with two main audiences:

| Audience           | Tagline / Role                                         |
| :----------------- | :----------------------------------------------------- |
| **Base Ghana**     | Citizens inside Ghana — district & community organising |
| **Base Diaspora**  | Ghanaians abroad — networks, skills, support           |

The platform is a **member-portal + content site + commerce + admin command
center** combined. Core surfaces:

- **Public website** — hero, The Plan, Polls, Chapters, Updates (blog),
  Supplies (store), Donate, Contact, Press, Register / Login.
- **Member dashboard** — profile, membership card with QR, polls, feedback,
  canvasser tools, store w/ wishlist + cart.
- **Admin command center** — leadership hub, war room, ground-game,
  mobilization metrics, donations verification, blog/media/regions admin.

### Mission, Vision, Values
- **Vision** — A Ghana with quality education, lean accountable government,
  and industrialisation.
- **Mission** — An honest, detailed, actionable agenda rooted in the realities
  of ordinary Ghanaians.
- **Values** — Patriotism · Honesty · Discipline.

### Sources used to build this system
- **Codebase:** github.com/Styphler17/The-Base-Movement (`main`)
  - `tailwind.config.js`, `src/index.css` (color + type tokens)
  - `src/components/ui/BrandLine.tsx` (3-stripe motif)
  - `src/pages/Home.tsx`, `src/components/Navbar.tsx`, `Footer.tsx`,
    `MembershipCard.tsx`, `MovementRoadmap.tsx` (key UI patterns)
  - `docs/typography_modernization.md`, `docs/layout_guidelines.md`
- **Brand assets:** `public/branding/*`, `public/social-icons/*`,
  `public/fonts/*`
- **Live site:** https://thebasemovement.com

---

## 2. Content Fundamentals

The voice is **direct, credible, hopeful, and politically aware** — closer to
a national newsroom or campaign press release than a SaaS product.

| Dimension          | Rule                                                        |
| :----------------- | :---------------------------------------------------------- |
| **Tone**           | Confident, hopeful, practical, nation-building              |
| **Person**         | Mostly **"we"** (the movement) and **"you"** (the citizen)  |
| **Casing**         | **Sentence case everywhere.** No `UPPERCASE`, no Title Case for body labels. The codebase explicitly purges `tracking-widest` + `uppercase`. |
| **Emoji**          | **None in product UI.** README/docs may use 🇬🇭 🚀 sparingly. |
| **Iconography**    | Lucide outline icons + Material Symbols Outlined            |
| **Punctuation**    | Em dashes, sharp full stops. Sentences are short.           |
| **Numerals**       | Locale-aware with `toLocaleString()` ("355,000 members")    |

### Vocabulary
- "The Plan" (= the agenda) · "Updates" (= blog) · "Supplies" (= store) ·
  "Chapters" (= local branches) · "Verified citizen" · "Patriot" · "Movement"
- Hero verbs: **Join · Register · Learn · Get involved · Donate**

### Examples (all from the live codebase)
- Hero: *"Ghana First, Jobs for the youth!"*
- Subhead: *"We are a grassroots movement committed to youth jobs,
  accountable leadership, and national development."*
- Card label: *"For Citizens in Ghana."* / *"For Ghanaians Abroad."*
- Stat label: *"Members registered nationwide"* (sentence case, full
  prepositional phrase — not "MEMBERS" alone)
- Button: *"Join the Movement →"*, *"Get Involved →"*

### Phrases to avoid
empowering your journey · unlocking potential · transformative solutions ·
all-in-one platform · generic movement slogans without explanation.

---

## 3. Visual Foundations

### 3.1 Colors — the Ghanaian flag, used as a system
| Role          | Hex        | Usage                                        |
| :------------ | :--------- | :------------------------------------------- |
| **Red**       | `#CE1126`  | Call to action, urgency, errors              |
| **Gold**      | `#DAA520`  | Values & emphasis, secondary CTA, BrandLine  |
| **Green**     | `#006B3F`  | Primary brand, success, links, focus rings   |
| **Black**     | `#000000`  | The Black Star — strength, unity, dark slabs |

Surfaces are a slightly **green-warm off-white** (`#f6fbf4`) — never pure
white. Dark slabs are `#181d19` (the `on-surface` ink) or `#1A1A1A`
(charcoal-dark, used on the newsletter block).

### 3.2 Typography
Two superfamilies:
- **Public Sans** — display, headings, meta labels (700 / 800)
- **Work Sans** — body copy (400 regular, 700 bold)

The codebase enforces a strict modernization protocol
(`docs/typography_modernization.md`):
> **All text:** `normal-case · font-bold · tracking-tight`.
> **Purge:** `uppercase`, `tracking-widest`, `tracking-wider`, `font-black`,
> `font-extrabold`.

H1–H6 use `clamp()` so the entire scale breathes between mobile and desktop.

### 3.3 Spacing & Layout
- Container max **1280 px**, gutter **24 px**.
- Section padding **40 px mobile / 96 px desktop**.
- Stack tokens: `8 / 16 / 32 px`.
- **Layout rule** (from `layout_guidelines.md`): *Grid for 2-D structure
  (sidebar + main, dashboards). Flex for 1-D content flow (toolbars, lists).
  If you use `width:50%`, ask if it should be intrinsic.*

### 3.4 Backgrounds & imagery
- **Off-white green-tint** is the default.
- **Hero**: full-bleed black portrait + low-opacity (`opacity:.4`)
  hero photo with `mix-blend-mode: luminosity`, plus a `radial-gradient`
  spotlight that follows the cursor (`mouse-pos masked image`).
- **Noise texture** (`/noise.png`) at 2–3% opacity over slab sections.
- **Bottom gradient overlay** on hero: `from-on-surface via-on-surface/60`.
- Imagery is **warm, photojournalistic**, with strong contrast — Ghanaian
  citizens, rallies, party HQ, the founder. No stock-illustration vibes.

### 3.5 Borders, radii, shadows
- **Radii are SMALL.** Default `2px` (`--radius-xs`), buttons commonly
  `rounded-sm` (`4px`), card `rounded-sm` (`4px`); only pill badges and the
  membership-card outer use `8px+`. The CTA hero card uses `2rem` exception.
- **Shadows are subtle.** Default `0 1px 2px rgb(0 0 0 / .05)`. Cards use
  `0 4px 20px -2px rgb(0 0 0 / .05)` (`.civic-card-shadow`).
- The CTA slab uses a heavy `0 48px 96px -16px rgb(0 0 0 / .5)` for drama.
- **Borders are pencil-thin** (`1px`). Section dividers commonly use
  `border-t-[4px]` in **brand red / gold / green** as an "editorial rule".

### 3.6 The BrandLine motif
A **3-stripe horizontal flag bar** — red · gold · green — `128 × 6 px`,
appears under every major heading (`<BrandLine />`). It's the most
recognisable atom of the system and must never be hand-rolled.

### 3.7 Animation
- **Easing:** `ease-out` (default), `transition-all duration-200/300`.
- **Hovers:** `hover:-translate-y-1 hover:shadow-lg` (lift),
  `hover:scale-105` on imagery, color swap to `text-primary` for links.
- **Press:** native opacity dim + slight darken via `bg-primary/90`.
- **Counters:** custom `<AnimatedCounter />` with intersection-observer
  trigger; numerals shift color **red → gold → green** as the value grows.
- **Reading progress bar** at top of every page (3-color gradient).
- No bounces, no parallax, no floating shapes.

### 3.8 Hover / press / focus states
| State    | Treatment                                                    |
| :------- | :----------------------------------------------------------- |
| Hover    | Color → `--primary`, `opacity-80`, or 1px translate-y lift   |
| Press    | `bg-primary/90`, no shrink                                   |
| Focus    | `ring-2 ring-primary/40`, 2 px green outline                 |
| Disabled | `opacity-50 cursor-not-allowed`                              |

### 3.9 Transparency / blur
Used **sparingly** and always on dark slabs:
- Pill badges `bg-white/5 border-white/10` (CTA trust row)
- `backdrop-blur-md` only on the `.glass-card` utility (rare)
- Form inputs over dark `bg-white/5 border-white/10` (newsletter)

### 3.10 Cards
- White (`#fff`), `border 1px var(--border)`, `rounded-sm` (4 px),
  `shadow-card`, `padding 24 px`.
- Hover: `hover-lift` utility — `-translate-y-1 + shadow-lift`.
- Variant: **pillar card** with a left `border-l-4 border-accent`.

### 3.11 Layout rules / fixed elements
- Sticky header (`h-20`, white, 1 px bottom border).
- Reading progress bar fixed top, gradient.
- Back-to-top button.
- Footer never sticky.

---

## 4. Iconography

The Base uses **two icon systems together**:

1. **Lucide React** — outline, 1.5 px stroke, 24 px default.
   Used everywhere in product UI. CDN: `https://unpkg.com/lucide@latest`.
2. **Material Symbols Outlined** — Google Fonts, variable axis
   `FILL 0, wght 400, GRAD 0, opsz 24`. Used for hamburger / camera / utility
   glyphs. Loaded via the `<link>` in `index.html`.

**Social icons** are **bespoke SVGs** that ship with the codebase
(`public/social-icons/*.svg`) and are rendered as `<img>` elements through a
typed `SocialIcons.tsx` wrapper. Copies are in `assets/icons/`:
`facebook · instagram · x · tiktok · youtube · whatsapp · linkedin`.

**Emoji:** never in product UI. **Unicode glyphs as icons:** never.

When extending the system, prefer **Lucide** for any utility/UI icon. Reach
for Material Symbols only when Lucide lacks the glyph.

---

## 5. Index — what's in this folder

```
.
├── README.md                     ← you are here
├── SKILL.md                      ← Agent-Skills compatible entry point
├── colors_and_type.css           ← all CSS vars + @font-face
├── fonts/                        ← Public Sans + Work Sans (woff2)
├── assets/                       ← logos, hero/founder/HQ images
│   └── icons/                    ← brand social SVGs
├── preview/                      ← Design-System tab cards
│   ├── colors-brand.html
│   ├── colors-surfaces.html
│   ├── colors-semantic.html
│   ├── type-display.html
│   ├── type-body.html
│   ├── type-scale.html
│   ├── brandline.html
│   ├── spacing.html
│   ├── radii-shadows.html
│   ├── buttons.html
│   ├── badges.html
│   ├── cards.html
│   ├── inputs.html
│   ├── stats.html
│   ├── icons-social.html
│   └── logo.html
└── ui_kits/
    └── website/                  ← public website kit
        ├── index.html            ← interactive home + nav demo
        ├── Navbar.jsx
        ├── Footer.jsx
        ├── Hero.jsx
        ├── PillarsSection.jsx
        ├── StatsSection.jsx
        ├── PlatformSplit.jsx
        ├── CTASection.jsx
        ├── BrandLine.jsx
        └── Buttons.jsx
```

---

## 6. Caveats

- **Fonts are official woff2 builds** lifted from the codebase
  (`public/fonts`). No substitutions required.
- **Iconography:** Lucide is loaded via CDN; no need to import each glyph.
- The admin / dashboard surfaces are documented but **only the public website
  UI kit is built out** — the admin command center is too large to recreate
  faithfully without the user prioritising it.
- The membership-card component uses `qrcode.react`; the UI-kit demo shows a
  static placeholder QR.

© 2026 The Base Movement — Ghana First.
