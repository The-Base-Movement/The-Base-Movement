# The Base Movement — Design System

> **"Ghana First, Jobs for the Youth!"**
>
> A high-fidelity political-movement brand system rooted in the colors, voice
> and visual authority of the Republic of Ghana.

---

## 1. Company Context

**The Base Movement** ("The Base") is a grassroots Ghanaian political movement
with two main audiences:

| Audience          | Tagline / Role                                          |
| :---------------- | :------------------------------------------------------ |
| **Base Ghana**    | Citizens inside Ghana — district & community organising |
| **Base Diaspora** | Ghanaians abroad — networks, skills, support            |

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
  - `tailwind.config.js`, `src/index.css` (color + type tokens, 62 KB)
  - `src/components/ui/BrandLine.tsx` (3-stripe motif)
  - `src/components/states/*` (Skeleton, Spinner, EmptyState, Banner, FullPageState)
  - `src/components/buttons/*` (admin `.btn` wrappers + public NeonButton)
  - `src/lib/motion/*`, `src/hooks/useSiteMotion.ts` (GSAP reveal engine)
  - `src/context/BrandingContext.tsx` (runtime CSS-variable injection)
  - `src/pages/Home.tsx`, `src/components/Navbar.tsx`, `Footer.tsx`,
    `MembershipCard.tsx`, `MovementRoadmap.tsx` (key UI patterns)
  - `docs/typography_modernization.md`, `docs/layout_guidelines.md`
- **Brand assets:** `public/branding/*`, `public/social-icons/*`,
  `public/fonts/*`
- **Live site:** https://www.thebasemovement.org.gh (canonical host);
  `thebasemovement.info` is a live alias.
  ⚠️ `thebasemovement.com` is **not ours** — never link to it or cite it as a
  brand source.

> **Doc status:** revised 2026-08-04 against `main`. Sections marked
> **`[v2]`** were added or corrected in this revision; the original bundle
> (2026-06-11) predates the Lucide purge, dark mode, density modes and the
> admin class library.

---

## 2. Content Fundamentals

The voice is **direct, credible, hopeful, and politically aware** — closer to
a national newsroom or campaign press release than a SaaS product.

| Dimension       | Rule                                                                                                                                                                                                                                                                        |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tone**        | Confident, hopeful, practical, nation-building                                                                                                                                                                                                                              |
| **Person**      | Mostly **"we"** (the movement) and **"you"** (the citizen)                                                                                                                                                                                                                  |
| **Casing**      | **Sentence case for all prose and headings.** Two sanctioned exceptions **`[v2]`**: the `.field-label` form label and the `.eye` eyebrow, both of which are uppercase + `letter-spacing:.05–.06em` by design. Everywhere else `uppercase` and `tracking-widest` are purged. |
| **Emoji**       | **None in product UI.** README/docs may use 🇬🇭 🚀 sparingly.                                                                                                                                                                                                                |
| **Iconography** | **Material Symbols Outlined only** **`[v2]`** — Lucide is banned (see §4)                                                                                                                                                                                                   |
| **Punctuation** | Em dashes, sharp full stops. Sentences are short.                                                                                                                                                                                                                           |
| **Numerals**    | Locale-aware with `toLocaleString()` ("355,000 members")                                                                                                                                                                                                                    |

### Vocabulary

- "The Plan" (= the agenda) · "Updates" (= blog) · "Supplies" (= store) ·
  "Diaspora" (= overseas branches) · "Verified citizen" · "Patriot" · "Movement"

> **`[v2]` Diaspora rename.** What was shown as **"Chapters"** is now labelled
> **"Diaspora"** in every user-facing string. This is a **display rename only** —
> all code identifiers stay `chapter` (DB tables/columns, `/chapters` routes,
> `scope_type === 'chapter'`, `chapterService`). Render labels through
> `src/lib/diaspora.ts` (`diasporaName` / `diasporaSlug` / `matchesChapterSlug`);
> never hardcode "Diaspora" where a `chapter` identifier is expected.

- Hero verbs: **Join · Register · Learn · Get involved · Donate**

### Examples (all from the live codebase)

- Hero: _"Ghana First, Jobs for the youth!"_
- Subhead: _"We are a grassroots movement committed to youth jobs,
  accountable leadership, and national development."_
- Card label: _"For Citizens in Ghana."_ / _"For Ghanaians Abroad."_
- Stat label: _"Members registered nationwide"_ (sentence case, full
  prepositional phrase — not "MEMBERS" alone)
- Button: _"Join the Movement →"_, _"Get Involved →"_

### Phrases to avoid

empowering your journey · unlocking potential · transformative solutions ·
all-in-one platform · generic movement slogans without explanation.

---

## 3. Visual Foundations

### 3.1 Colors — the Ghanaian flag, used as a system

| Role      | Hex       | Usage                                        |
| :-------- | :-------- | :------------------------------------------- |
| **Red**   | `#CE1126` | Call to action, urgency, errors              |
| **Gold**  | `#DAA520` | Values & emphasis, secondary CTA, BrandLine  |
| **Green** | `#006B3F` | Primary brand, success, links, focus rings   |
| **Black** | `#000000` | The Black Star — strength, unity, dark slabs |

Surfaces are a slightly **green-warm off-white** (`#f6fbf4`) — never pure
white. Dark slabs are `#181d19` (the `on-surface` ink) or `#1A1A1A`
(charcoal-dark, used on the newsletter block).

**`[v2]` Corrections since the original bundle:**

| Token                | Was       | Now                | Why                                                                                                                                                                |
| :------------------- | :-------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--on-surface-muted` | `#6f7a71` | **`#616b63`**      | darkened to pass WCAG AA (4.5:1) on white and tinted surfaces                                                                                                      |
| `--muted-foreground` | —         | **`#616b63`**      | aligned to the same value                                                                                                                                          |
| `--panel-header`     | —         | **`156 100% 21%`** | new: a _fixed_ dark green for panel headers. It deliberately does **not** follow `--primary`, because dark mode's lighter green fails AA against white header text |

**Always write colors as `hsl(var(--token))`.** Raw hex in components is a
violation — the variables carry HSL triplets precisely so opacity modifiers
(`hsl(var(--primary) / 0.4)`) and theming work.

### 3.2 Typography **`[v2]` — corrected**

**Public Sans is now the default family**, not Work Sans. `tailwind.config.js`
resolves `font-sans` to:

```
["Public Sans", "Work Sans", "ui-sans-serif", "system-ui", "sans-serif"]
```

| Role                     | Family                                      |
| :----------------------- | :------------------------------------------ |
| Everything by default    | **Public Sans** (`font-sans`, `font-brand`) |
| Meta labels, pills, KPIs | **Public Sans** (`font-meta`)               |
| Long-form body (opt-in)  | **Work Sans** (`font-body-md`)              |
| Icons                    | **Material Symbols Outlined** (self-hosted) |

All four faces are **self-hosted woff2** in `public/fonts/` — including
Material Symbols, which was moved off the `fonts.googleapis.com` CDN. There is
no external font request at runtime (this is also a CSP requirement, see §7.6).

For inline styles, write `fontFamily: "'Public Sans', sans-serif"`.

#### The no-bold rule **`[v2]`**

The modernization protocol tightened. The old guidance ("all text `font-bold`",
Public Sans 700/800 headings) is **superseded**:

> **Body, labels, headings, KPI numerals → `var(--font-weight-medium, 500)`.**
> **Do not use 700+ anywhere except logos and the wordmark.**

`tailwind.config.js` maps every Tailwind weight utility onto a
`--font-weight-*` variable, so weight is themeable rather than literal:

```
--font-weight-thin 100 · extralight 200 · light 300 · normal 400
--font-weight-medium 500 · semibold 600 · bold 700 · extrabold 800 · black 900
```

Still purged: `uppercase` (outside `.field-label` / `.eye`),
`tracking-widest`, `tracking-wider`, `font-black`, `font-extrabold`.

#### Scale

H1–H6 use `clamp()` so the scale breathes between mobile and desktop. **`[v2]`**
Every heading clamp is now multiplied by `--font-heading-scale`, and `--p-size`
by `--font-scale`, both injected at runtime by `BrandingContext` so admins can
retune global type size without a deploy:

```css
--h1-size: clamp(
  calc(2.25rem * var(--font-heading-scale)),
  calc(5vw * var(--font-heading-scale)),
  calc(4.5rem * var(--font-heading-scale))
);
```

Defaults are `1`; at `≥1280px` they rise to `1.1` / `1.15`. Step tokens
`--fs-micro 12 · tiny 13 · xs 14 · sm 16 · base 18 · lg 22 · xl 28 · 2xl 36 ·
3xl 48 · 4xl 64` are unchanged.

KPI numerals have their own token — **always** `fontSize: 'var(--kpi-num-size)'`
(22px default), never a hardcoded px value.

### 3.3 Spacing & Layout

- Container max **1280 px**, gutter **24 px**.
- Section padding **40 px mobile / 96 px desktop**.
- Stack tokens: `8 / 16 / 32 px`.
- **Layout rule** (from `layout_guidelines.md`): _Grid for 2-D structure
  (sidebar + main, dashboards). Flex for 1-D content flow (toolbars, lists).
  If you use `width:50%`, ask if it should be intrinsic._

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

- **Radii are SMALL**, and **`[v2]` are now a closed token set — never hardcode
  a px radius.** Legacy files may still carry literals; migrate them on touch
  (see `docs/audits/border-radius-token-audit-2026-05-26.md`).

  | Token           | Value | Use                               |
  | :-------------- | :---- | :-------------------------------- |
  | `--radius-xs`   | 2px   | inputs, checkboxes                |
  | `--radius-sm`   | 4px   | buttons, small controls, cards    |
  | `--radius-md`   | 8px   | compact panels, asides, dropdowns |
  | `--radius-lg`   | 12px  | main cards, modals, CTA strips    |
  | `--radius-pill` | 999px | status badges, pills, tags        |

  The CTA hero card keeps its `2rem` exception.

- **Shadows are subtle.** Default `0 1px 2px rgb(0 0 0 / .05)`. Cards use
  `0 4px 20px -2px rgb(0 0 0 / .05)` (`.civic-card-shadow`).
- The CTA slab uses a heavy `0 48px 96px -16px rgb(0 0 0 / .5)` for drama.
- **Borders are pencil-thin** (`1px`). Section dividers commonly use
  `border-t-[4px]` in **brand red / gold / green** as an "editorial rule".

### 3.6 The BrandLine motif

A **3-stripe horizontal flag bar** — red · gold · green — `128 × 6 px`,
appears under every major heading (`<BrandLine />`). It's the most
recognisable atom of the system and must never be hand-rolled.

### 3.7 Animation **`[v2]` — replaced by the data-attribute motion system**

Motion on the public site is **opt-in via data-attributes**, not per-page GSAP
and not per-component `<AnimatedCounter />`. `useSiteMotion` (mounted once in
`PublicLayout`) wires them on every route change; the engine lives in
`src/lib/motion/`.

| Attribute           | Effect                                             |
| :------------------ | :------------------------------------------------- |
| `data-fade`         | element fades + rises once when scrolled into view |
| `data-fade-stagger` | the element's **direct children** stagger in       |
| `data-countup="N"`  | numeric counter animates to `N`                    |

**The single motion vocabulary** (`src/lib/motion/gsapCore.ts` — do not invent
new values):

| Constant      | Value                                         |
| :------------ | :-------------------------------------------- |
| duration      | `0.5s`                                        |
| ease          | `power2.out`                                  |
| distance      | `16px` translateY                             |
| stagger       | `0.08s` between items, total capped at `0.6s` |
| trigger start | `top 85%`                                     |

Safety rails baked in: reveals are **idempotent** (elements marked
`data-fade-done`, safe to re-run as lazy content mounts); content is hidden by
**JS, never CSS**, so SSR/no-JS renders it visible; and the whole engine no-ops
under `prefers-reduced-motion` or the app's `.low-bandwidth` mode (see §7.5).

Still true: `ease-out` + `transition-all duration-200/300` for CSS transitions;
`hover:-translate-y-1 hover:shadow-lg` lift; `hover:scale-105` on imagery;
`bg-primary/90` on press; the 3-color reading progress bar.
**No bounces, no parallax, no floating shapes.**

### 3.8 Hover / press / focus states

| State    | Treatment                                                  |
| :------- | :--------------------------------------------------------- |
| Hover    | Color → `--primary`, `opacity-80`, or 1px translate-y lift |
| Press    | `bg-primary/90`, no shrink                                 |
| Focus    | `ring-2 ring-primary/40`, 2 px green outline               |
| Disabled | `opacity-50 cursor-not-allowed`                            |

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

## 4. Iconography **`[v2]` — Lucide removed**

> **Lucide is banned.** It has been fully purged: **0 files** in `src/` import
> `lucide-react`. Do not reintroduce it, and do not add any other icon library.

**Material Symbols Outlined is the only icon system.** 475 files use it.

```tsx
<span className="material-symbols-outlined" style={{ fontSize: N }}>
  icon_name
</span>
```

- **Self-hosted**, not Google Fonts CDN: `public/fonts/MaterialSymbolsOutlined.woff2`,
  `font-weight: 100 700`, `font-display: block`.
- Variable axis defaults `FILL 0, wght 400, GRAD 0, opsz 24`, and
  `vertical-align: middle` is applied globally by the `.material-symbols-outlined`
  rule in `index.css` — don't re-declare these per component.
- Size via inline `fontSize`, colour via `color`.

**Country flags** **`[v2]`** come from the `flag-icons` npm package, imported in
`index.css` and served from `/assets/` — also no CDN.

**Social icons** are **bespoke SVGs** shipped in `public/social-icons/*.svg`,
rendered as `<img>` through the typed `src/components/icons/SocialIcons.tsx`
wrapper. Copies are in `assets/icons/`:
`facebook · instagram · x · tiktok · youtube · whatsapp · linkedin`.

**Brand icon:** `src/components/ui/BrandIcon.tsx`.

**Emoji:** never in product UI. **Unicode glyphs as icons:** never.

---

## 5. Component class library **`[v2]` — new section**

The original bundle documented brand foundations but not the **class system**
that admin and dashboard surfaces are actually built from. These classes live
in `src/index.css` and are the primary building blocks — **reuse them before
writing new CSS or new components.**

### 5.1 Layout

| Class                                                             | Purpose                                 |
| :---------------------------------------------------------------- | :-------------------------------------- |
| `.app-shell`                                                      | outermost app frame                     |
| `.main`                                                           | full-width content wrapper              |
| `.page-container` / `.admin-page-container`                       | page padding wrappers                   |
| `.sidebar-main`                                                   | 2-column: sidebar │ main                |
| `.main-sidebar`                                                   | reverse: main │ sidebar                 |
| `.twocol`, `.panel-twocol`, `.flex-columns`                       | generic 2-column splits                 |
| `.kpis`                                                           | 4-column KPI tile grid                  |
| `.grid-stats`, `.stat-grid`, `.hero-stats-grid`, `.campaign-grid` | responsive stat/card grids              |
| `.flow > * + *`                                                   | vertical rhythm (owl selector)          |
| `.top`, `.actions`, `.breadcrumb-nav`                             | page header row, action cluster, crumbs |
| `.desktop-only` / `.mobile-only`                                  | visibility helpers                      |

Domain-specific grids also exist (`.war-room-main-grid`, `.logistics-grid`,
`.mobilization-main-grid`, `.profile-cols`, `.vault-body-grid`,
`.verify-split`, `.donation-split`, `.footer-grid`) — check for one before
inventing a layout.

**Layout rule** (from `layout_guidelines.md`): _Grid for 2-D structure
(sidebar + main, dashboards). Flex for 1-D content flow (toolbars, lists).
If you reach for `width:50%`, ask whether it should be intrinsic._

### 5.2 Panels, tables, cards

| Class                 | Purpose                                                                                                  |
| :-------------------- | :------------------------------------------------------------------------------------------------------- |
| `.panel`              | card container — white bg, 1px border, radius                                                            |
| `.ph` / `.ph2`        | panel header (flex row: title + `.meta` subtitle)                                                        |
| `.table`              | data table; `.who`, `.reg`, `.row-actions` cell helpers                                                  |
| `.card`               | stat card; `.green` `.gold` `.red` `.black` accent variants; `.num` `.lbl` `.foot` `.delta` `.eye` parts |
| `.kpi`                | KPI tile; `.r` `.g` `.k` `.gr` bar-colour variants; `.l` `.v` `.d` parts                                 |
| `.pillar-card`        | public pillar card, left `border-l-4 border-accent`                                                      |
| `.civic-card-shadow`  | the card shadow utility                                                                                  |
| `.log`, `.log-row`    | activity/audit feed; `.tag.create` `.tag.edit` `.tag.delete`                                             |
| `.member-quick-stats` | member profile stat strip                                                                                |

Panel padding, gap and table cell padding are **density-driven** — use
`var(--panel-padding)`, `var(--panel-gap)`, `var(--table-cell-padding)` rather
than fixed values (see §6.2).

### 5.3 Buttons

Two coexisting button systems, both driven by CSS variables that
`BrandingContext` injects at runtime:

**Admin / dashboard — the `.btn` class family**

| Class                                   | Look                    |
| :-------------------------------------- | :---------------------- |
| `.btn`                                  | base                    |
| `.btn-primary`                          | green filled            |
| `.btn-accent`                           | gold filled             |
| `.btn-dest`                             | red filled              |
| `.btn-outline`                          | bordered                |
| `.btn-outline-dest`                     | transparent, red border |
| `.btn-ghost`                            | transparent, no border  |
| `.btn-active-tab` / `.btn-inactive-tab` | tab states              |
| `.btn-sm`                               | small size (30px)       |

Typed React wrappers: `src/components/buttons/ButtonPrimary.tsx`,
`ButtonAccent`, `ButtonDestructive`, `ButtonActiveTab`, `ButtonInactiveTab`.

**Public site — NeonButton** (`src/components/buttons/ui/neon-button.tsx`,
variants in `neon-button-variants.ts`, built with `class-variance-authority`).

- Variants: `default · solid · primary · accent · gold · destructive · ghost ·
outline · outline-destructive · ghost-destructive · active-tab · link`
- Sizes: `default` 44px · `sm` 34px · `lg` 52px · `icon` 36px

Both read runtime-themeable variables: `--accent-hover`, `--active-tab-bg`,
`--inactive-tab-bg`, `--inactive-tab-text`, `--inactive-tab-hover`,
`--brand-green-rgb`, `--brand-gold-rgb`, `--brand-red-rgb`. Admins retune these
from the branding settings screen — so **never hardcode a button colour.**

### 5.4 Status pills

| Class        | Meaning                                          |
| :----------- | :----------------------------------------------- |
| `.pill`      | base badge (`--radius-pill`, 10.5px Public Sans) |
| `.pill-ok`   | green — Verified / Active / Approved             |
| `.pill-warn` | yellow — Pending                                 |
| `.pill-err`  | red — error / flagged                            |
| `.pill-mute` | grey — Inactive                                  |

Canonical member-status usage:

```tsx
<span
  className={`pill ${
    isVerified(m) ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'
  }`}
>
  {m.status}
</span>
```

where `isVerified(m)` ⇔ `m.status === 'Active' || m.status === 'Approved' || !m.status`.

### 5.5 Typography helpers

| Class                                         | Use                                                       |
| :-------------------------------------------- | :-------------------------------------------------------- |
| `.eye` (+ `.eye-gold` `.eye-red` `.eye-mute`) | 10px uppercase eyebrow                                    |
| `.field-label`                                | 10.5px uppercase form label                               |
| `.text-micro` / `.text-tiny`                  | 12px / 13px                                               |
| `.tnum`                                       | tabular numerals — **use on every aligned number column** |
| `.prose-standard`                             | long-form article body (blog)                             |

### 5.6 Forms & feedback

`.form-understate` (understated input), `.compose .field` (composer fields,
`.lbl`, `.chips`, `.ch`, `.toolbar`), `.ico` icon button (`.ok` / `.no`
variants), `.spinner`, `.settings-tabs`, `.settings-form-grid`,
`.settings-form-grid-3`, `.btn-option-grid`, `.settings-save-row`.

**Auth surfaces** have a dedicated kit: `.auth-frame`, `.auth-header-label`,
`.auth-content`, `.auth-brand`, `.auth-heading`, `.auth-subheading`,
`.auth-divider`, `.auth-footer`, `.auth-stepper` (`.step.done` / `.step.current`),
`.verify-checks .check-row`, `.auth-foot-note`.

Always set `boxSizing: 'border-box'` on inputs.

### 5.7 State components **`[v2]`**

Do **not** hand-roll loading, empty or error states. Import from
`src/components/states/`:

| Component           | Use                                                                           |
| :------------------ | :---------------------------------------------------------------------------- |
| `<Skeleton />`      | content-shaped loading placeholder (preferred over spinners for lists/tables) |
| `<Spinner />`       | inline/button-level busy indicator                                            |
| `<EmptyState />`    | no-data state with icon, message, optional action                             |
| `<Banner />`        | inline info / warning / error strip                                           |
| `<FullPageState />` | whole-route loading or error                                                  |

Reference: `docs/audits/states-component-audit-2026-05-27.md`.

### 5.8 Other shared components

`<BrandLine />` (§3.6 — **never hand-roll the 3-stripe motif**),
`<WingDivider />` / `.wing-divider-eagle`, `<TrustSignals />`, `<SortToggle />`,
`<BrandIcon />`, `<Breadcrumbs />`, `<Pagination />`, `<BackToTop />`,
`<ReadingProgressBar />`, `<ShareModal />`, `<SearchBar />`, `<GenderAvatar />`,
`<CountryBadge />`, `<MembershipCard />`, `<OfflineBanner />`.

Card components: `BlogPostCard`, `ChapterCard`, `ConstituencyCard`,
`OfficerCard`, `ProductCard`, `OpinionPollCard`, `MemberProfileCard`.

**Check `src/components/` before creating anything new.**

### 5.9 Canonical patterns

**KPI tile** — brand-colour left bar, uppercase micro label, token-sized numeral:

```tsx
<div
  className="panel"
  style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
>
  <div
    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }}
  />
  {/* bar colours: on-surface (charcoal) · primary (green) · accent (gold) · destructive (red) */}
  <p
    style={{
      fontSize: 10,
      fontWeight: 'var(--font-weight-medium, 500)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'hsl(var(--on-surface-muted))',
      margin: '0 0 6px',
    }}
  >
    {kpi.label}
  </p>
  <p
    style={{
      fontSize: 'var(--kpi-num-size)',
      fontWeight: 'var(--font-weight-medium, 500)',
      color: 'hsl(var(--on-surface))',
      margin: 0,
    }}
  >
    {kpi.value}
  </p>
</div>
```

**Modal** — fixed overlay `rgba(0,0,0,0.45)`, `zIndex: 100`, click-outside to
dismiss, `e.stopPropagation()` on the inner panel.

**Dropdown** — `openMenuId` state, a `position: fixed; inset: 0` click-catcher
at `zIndex: 40`, menu at `zIndex: 50`, `top: 'calc(100% + 4px)'`.

**Money** — always format through `src/lib/currency.ts` (GHS/USD). Never inline.
**Counts** — `toLocaleString()`.

---

## 6. Theming modes **`[v2]` — new section**

The original bundle documented a single light theme. There are now **three
orthogonal runtime axes**, all driven by attributes on `:root`.

### 6.1 Dark mode — `:root[data-theme='dark']`

A full token override, not a filter. Every semantic variable is re-declared:

| Token                | Light          | Dark                 |
| :------------------- | :------------- | :------------------- |
| `--background`       | `103 47% 97%`  | `132 9% 6%`          |
| `--card`             | `0 0% 100%`    | `132 9% 10%`         |
| `--on-surface`       | `132 9% 10%`   | `0 0% 95%`           |
| `--on-surface-muted` | `131 5% 40%`   | `131 5% 65%`         |
| `--border`           | `103 12% 88%`  | `132 9% 20%`         |
| `--primary`          | `156 100% 21%` | `156 80% 35%`        |
| `--accent`           | `45 80% 45%`   | `45 90% 55%`         |
| `--destructive`      | `0 85% 44%`    | `0 85% 55%`          |
| `--charcoal`         | `#1a1a1a`      | `0 0% 96%` (inverts) |

Two rules worth knowing:

- **Brand colours lighten in dark mode** so they stay legible on near-black.
- **`--panel-header` deliberately does not** — it stays `156 100% 21%` in both
  modes, because dark mode's lighter green fails AA behind white header text.
  Use `--panel-header` for any green surface carrying white text.

There is also a **legacy-Tailwind compatibility layer**: a block of
`:root[data-theme='dark'] .bg-white / .bg-stone-50 / .bg-slate-100 / …`
overrides that repaint hardcoded Tailwind utilities left in unmigrated pages.
**This is a bridge, not a pattern** — new code must use semantic tokens so it
themes for free. Read theme state via `src/hooks/useIsDarkTheme.ts`.

### 6.2 Density — `:root[data-density='…']`

| Mode                    | `--panel-padding` | `--panel-gap` | `--table-cell-padding` | `--fs-base` |
| :---------------------- | :---------------- | :------------ | :--------------------- | :---------- |
| `comfortable` (default) | 24px              | 24px          | 14px 16px              | 18px        |
| `compact`               | 16px              | 16px          | 10px 12px              | 18px        |
| `high-density`          | 12px              | 12px          | 6px 10px               | **14px**    |

Any panel or table you build **must** consume these variables, or it will
ignore the user's density setting.

### 6.3 Low bandwidth — `.low-bandwidth`

A class on an ancestor that strips motion cost for slow connections: disables
transitions/animations, neutralises `animate-pulse` / `animate-bounce` /
`animate-spin` and `.spinner`, force-shows `[data-fade]` and
`[data-fade-stagger] > *` (the CSS backstop to the JS no-op in §3.7), and
downgrades image rendering. Never gate content behind an animation — it must be
readable with motion off.

---

## 7. Implementation rules **`[v2]` — new section**

These are enforced in code review and are the most common source of rejections.

1. **No Tailwind in migrated components.** TailwindCSS 3 is still in
   `tailwind.config.js` and still compiles the legacy surfaces, but **do not add
   new Tailwind classes** to migrated dashboard/admin pages. Use the class
   library (§5) plus inline style objects.
2. **Preserve existing inline styles.** Do not "modernise" them into utility
   classes. Inline styles are the intended medium here — they avoid purge and
   specificity conflicts.
3. **No shadcn/ui.** `components.json` is legacy config only. The system was
   migrated _off_ shadcn; do not reintroduce it.
4. **No new UI or icon libraries** without an explicit request.
5. **`hsl(var(--token))` for every colour.** No raw hex.
6. **Radius from tokens** (§3.5). No hardcoded px.
7. **Weight from `var(--font-weight-medium, 500)`.** No 700+ outside logos.
8. **Services own Supabase.** Pages never call `supabase` directly — go through
   `src/services/*`.
9. **CSP is split by surface.** `vercel.json` applies a strict policy to the
   public site (A+ rated) and a looser one to `/admin` + `/graphify` for TinyMCE
   and inline visualisation. **Public and dashboard HTML must stay free of
   inline scripts**, and nothing may load from an external CDN — which is why
   fonts, flags and icons are all self-hosted.
10. **Validate before commit:** `npm run typecheck` → `npm run lint` →
    `npm run build`.

---

## 8. Index — what's in this folder

```
.
├── README.md                     ← you are here
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
└── ui_kits/                      ← 16 kits; only `website/` has React components
    ├── shared/base.css           ← shared kit stylesheet
    ├── admin/ · admin-blog/ · admin-donations/ · admin-groundgame/
    ├── admin-member/ · admin-warroom/
    ├── auth/ · civic/ · commerce/ · dashboard/ · donate/ · emails/
    ├── impact/ · mobile/ · print/ · prototype/ · states/ · the-plan/
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

## 9. Caveats

- **Fonts are official woff2 builds** lifted from the codebase
  (`public/fonts`). No substitutions required.
- **Iconography `[v2]`:** Material Symbols only, self-hosted. The earlier
  "Lucide via CDN" guidance is void — see §4.
- The membership-card component uses `qrcode.react`; the UI-kit demo shows a
  static placeholder QR.

### Known gaps in this bundle **`[v2]`**

The prose in §5–§7 is current, but the **prototype files have not been
regenerated** since 2026-06-11. Specifically:

| Gap                    | Impact                                                                                                                                                     |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preview/*.html` cards | show light mode only; no dark-mode, density or state-component cards                                                                                       |
| `ui_kits/`             | 16 kits exist as static HTML; `ui_kits/website/` is the only one with React (`.jsx`) components                                                            |
| `colors_and_type.css`  | partially refreshed (see its own header); still lacks the full dark-mode token block                                                                       |
| Admin command center   | documented in §5 but **not** reproduced as a kit — it is too large to recreate faithfully; treat `src/index.css` + live admin pages as the source of truth |
| BrandLine / motion     | documented, but prototypes predate the `data-fade` engine                                                                                                  |

**Rule of precedence:** where this README and a prototype file disagree, the
README wins; where the README and `src/index.css` disagree, **the codebase
wins** — and this doc should then be corrected.

© 2026 The Base Movement — Ghana First.
