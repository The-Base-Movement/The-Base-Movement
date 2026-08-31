# Developer Handoff — The Base Movement Design System

**Version:** 2.1 · **Date:** 2026-08-09 · **Target:** React 19 + TypeScript 5.9 + Vite 7
**Apple Design Benchmark:** 7.7 / 10 (Strong / Premium Standard)
**Source of truth:** `src/index.css` (62 KB) + `tailwind.config.js`
**Companion doc:** [`the-base-movement-design-system/project/README.md`](the-base-movement-design-system/project/README.md) — brand foundations and rationale

> This document is the authority on the rules below. Where it disagrees with
> `src/index.css`, the codebase wins and this document should be corrected in the
> same PR.

---

## Overview

The Base Movement is a political-movement membership platform for Ghana with three
distinct surfaces, each with its own layout shell and its own styling medium:

| Surface              | Shell             | Styling medium                                     | Audience                      |
| :------------------- | :---------------- | :------------------------------------------------- | :---------------------------- |
| **Public site**      | `PublicLayout`    | design-system classes + inline styles; GSAP motion | visitors, prospective members |
| **Member dashboard** | `DashboardLayout` | design-system classes + inline styles              | logged-in patriots            |
| **Admin panel**      | `AdminLayout`     | design-system classes + inline styles              | staff                         |

**The single most important rule for a new developer:** this codebase was migrated
_off_ shadcn/ui and _off_ Tailwind-in-components. Everything below is a custom CSS
system. Reach for an existing class or component before writing anything new.

### Read this before your first commit

1. **Colours** — `hsl(var(--token))` only. Never raw hex.
2. **Radii** — `var(--radius-*)` only. Never hardcoded px.
3. **Weights** — `var(--font-weight-medium, 500)`. Never 700+ outside logos.
4. **Icons** — Material Symbols only. Lucide is banned and fully purged (0 imports).
5. **No new Tailwind** in migrated pages, no shadcn/ui, no new UI/icon libraries.
6. **No external CDN assets** — CSP forbids it. Fonts, flags and icons are self-hosted.
7. **Everything must survive dark mode and three density modes.**

---

## Design tokens

All tokens are CSS custom properties declared on `:root` in `src/index.css`, stored
as **HSL triplets** (not hex) so opacity modifiers and theming work:
`hsl(var(--primary) / 0.4)`.

### Brand colours

| Token            | Light                    | Dark               | Usage                                      |
| :--------------- | :----------------------- | :----------------- | :----------------------------------------- |
| `--primary`      | `156 100% 21%` (#006B3F) | `156 80% 35%`      | primary brand, success, links, focus rings |
| `--accent`       | `45 80% 45%` (#DAA520)   | `45 90% 55%`       | secondary CTA, emphasis, BrandLine gold    |
| `--destructive`  | `0 85% 44%` (#CE1126)    | `0 85% 55%`        | destructive actions, errors, urgency       |
| `--panel-header` | `156 100% 21%`           | **`156 100% 21%`** | green panel headers carrying white text    |

> **`--panel-header` is deliberately theme-invariant.** Dark mode's lighter
> `--primary` fails WCAG AA behind white text. Any green surface with white text on
> it must use `--panel-header`, not `--primary`.

### Surfaces and text

| Token                | Light                   | Dark         | Usage                                                      |
| :------------------- | :---------------------- | :----------- | :--------------------------------------------------------- |
| `--background`       | `103 47% 97%` (#f6fbf4) | `132 9% 6%`  | page background — green-tinted off-white, never pure white |
| `--card`             | `0 0% 100%`             | `132 9% 10%` | panels, cards                                              |
| `--surface-warm`     | `36 24% 96%`            | `132 9% 8%`  | footer, soft sections                                      |
| `--container-low`    | `#f1f5ee`               | `#0f1110`    | subtle inset background                                    |
| `--on-surface`       | `132 9% 10%` (#181d19)  | `0 0% 95%`   | primary text                                               |
| `--on-surface-muted` | `131 5% 40%` (#616b63)  | `131 5% 65%` | secondary text — **AA-compliant**                          |
| `--border`           | `103 12% 88%` (#dfe4dd) | `132 9% 20%` | 1px borders, dividers                                      |
| `--charcoal`         | `#1a1a1a`               | `0 0% 96%`   | dark slabs — **inverts** in dark mode                      |

### Radii — closed set

| Token           | Value | Usage                             |
| :-------------- | :---- | :-------------------------------- |
| `--radius-xs`   | 2px   | inputs, checkboxes                |
| `--radius-sm`   | 4px   | buttons, small controls, cards    |
| `--radius-md`   | 8px   | compact panels, asides, dropdowns |
| `--radius-lg`   | 12px  | main cards, modals, CTA strips    |
| `--radius-pill` | 999px | status badges, pills, tags        |

Legacy files may still carry px literals — migrate them when you touch the file
(`docs/audits/border-radius-token-audit-2026-05-26.md`).

### Typography

**Public Sans is the default family.** `font-sans` resolves to
`["Public Sans", "Work Sans", "ui-sans-serif", "system-ui", "sans-serif"]`.
Work Sans is opt-in (`font-body-md`) for long-form body only. All faces are
self-hosted woff2 in `public/fonts/`, including Material Symbols.

For inline styles: `fontFamily: "'Public Sans', sans-serif"`.

**Step scale:** `--fs-micro 12` · `tiny 13` · `xs 14` · `sm 16` · `base 18` ·
`lg 22` · `xl 28` · `2xl 36` · `3xl 48` · `4xl 64` (px).

**Fluid headings** — every clamp is multiplied by a runtime scale variable so admins
can retune global type size without a deploy:

```css
--h1-size: clamp(
  calc(2.25rem * var(--font-heading-scale)),
  calc(5vw * var(--font-heading-scale)),
  calc(4.5rem * var(--font-heading-scale))
);
```

`--font-scale` / `--font-heading-scale` default to `1`, rise to `1.1` / `1.15` at
≥1280px, and are overridable by `BrandingContext`.

**Weights** map onto `--font-weight-*` (100–900) so weight is themeable.
**Use `var(--font-weight-medium, 500)`.** 700+ is reserved for logos.

**KPI numerals:** always `fontSize: 'var(--kpi-num-size)'` (22px default). Never px.

### Density — consumed by every panel and table

| Token                  | comfortable | compact   | high-density |
| :--------------------- | :---------- | :-------- | :----------- |
| `--panel-padding`      | 24px        | 16px      | 12px         |
| `--panel-gap`          | 24px        | 16px      | 12px         |
| `--table-cell-padding` | 14px 16px   | 10px 12px | 6px 10px     |
| `--fs-base`            | 18px        | 18px      | **14px**     |

A panel with hardcoded padding silently ignores the user's density setting. This is
the most common review rejection.

### Shadows

| Purpose                     | Value                               |
| :-------------------------- | :---------------------------------- |
| default                     | `0 1px 2px rgb(0 0 0 / .05)`        |
| card (`.civic-card-shadow`) | `0 4px 20px -2px rgb(0 0 0 / .05)`  |
| lift (hover)                | `0 10px 30px -8px rgb(0 0 0 / .15)` |
| CTA slab                    | `0 48px 96px -16px rgb(0 0 0 / .5)` |

Borders are pencil-thin (1px). Section dividers use border-t-[4px] in brand
red / gold / green as an editorial rule.

### Section Rhythm & Surface Alternation (Apple Design Benchmark)

Never use monotonous line dividers (`<WingDivider />`) between every consecutive section.
Instead, establish a deliberate visual narrative through alternating surface-tone backgrounds:

| Surface Tone           | Class / Color                      | Usage & Purpose                                           |
| :--------------------- | :--------------------------------- | :-------------------------------------------------------- |
| **Hero / Dark Accent** | `bg-[#0f1310]` / `bg-[#181d19]`    | High-impact hero, core foundation pillars, key statements |
| **Warm Editorial**     | `bg-[#F7F5F2]` / `bg-surface-warm` | Secondary pathways, updates, featured news                |
| **Crisp Light**        | `bg-white` / `bg-background`       | Stats grid, interactive timelines, form panels            |
| **Container Low**      | `hsl(var(--container-low))`        | Inset content cards, network structure breakdowns         |

---

## Layout

### Breakpoints

There is **no custom `screens` block** in `tailwind.config.js` — Tailwind defaults
apply (`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`). The design system's own
media queries cluster at **640 / 768 / 1024 / 1280**; treat those four as canonical
and avoid inventing new ones.

**JS breakpoint:** `useIsMobile()` (`src/hooks/use-mobile.ts`) — `< 768px`.
Use it, plus `useMediaQuery()`, rather than reading `window.innerWidth` directly.

**Public vs admin mobile/desktop split (as of 2026-09-01):** `.desktop-only` /
`.mobile-only` (768px) is the **admin/dashboard** convention — leave it alone
there. **Public-facing pages** (`PublicLayout`) now standardize on `lg`
(1024px) via plain Tailwind (`lg:hidden` / `hidden lg:flex`) instead, so
tablet widths (768–1023px) get the same layout as mobile rather than a
squeezed desktop layout. Reference: `src/pages/Chapters.tsx` (Diaspora page).
Don't reuse `.desktop-only`/`.mobile-only` on a public page — it disagrees
with pages already on the `lg` convention in that 768–1023px range.

### Container

Max width **1280px**, gutter **24px**. Section padding **40px mobile / 96px - 112px desktop** (`py-20 md:py-28`).
Stack rhythm **8 / 16 / 32px**.

### Layout classes

| Class                                                                | Purpose                                 |
| :------------------------------------------------------------------- | :-------------------------------------- |
| `.app-shell`                                                         | outermost app frame                     |
| `.main`                                                              | full-width content wrapper              |
| `.page-container` / `.admin-page-container`                          | page padding wrappers                   |
| `.sidebar-main`                                                      | 2-column: sidebar │ main                |
| `.main-sidebar`                                                      | reverse: main │ sidebar                 |
| `.twocol` / `.panel-twocol` / `.flex-columns`                        | generic 2-column splits                 |
| `.kpis`                                                              | 4-column KPI tile grid                  |
| `.grid-stats` / `.stat-grid` / `.hero-stats-grid` / `.campaign-grid` | responsive stat grids                   |
| `.flow > * + *`                                                      | vertical rhythm (owl selector)          |
| `.top` / `.actions` / `.breadcrumb-nav`                              | page header row, action cluster, crumbs |
| `.desktop-only` / `.mobile-only`                                     | visibility helpers                      |

Domain grids already exist for war room, logistics, mobilization, profile, vault,
verification, donations and footer — **check before inventing a layout.**

**Rule:** Grid for 2-D structure (sidebar + main, dashboards). Flex for 1-D content
flow (toolbars, lists). If you reach for `width: 50%`, ask whether it should be
intrinsic.

### Responsive behaviour of the shared grids

| Breakpoint          | `.stat-grid` | `.campaign-grid`    | `.kpis`   |
| :------------------ | :----------- | :------------------ | :-------- |
| Desktop (>1024px)   | 4 columns    | 3 columns           | 4 columns |
| Tablet (640–1024px) | 2 columns    | 2 columns, gap 20px | 2 columns |
| Mobile (<640px)     | 1 column     | 1 column            | 1 column  |

---

## Components

### Buttons

Two systems, both driven by CSS variables that `BrandingContext` injects at runtime.
**Never hardcode a button colour** — admins retune these from the branding screen.

**Admin / dashboard — `.btn` family**

| Class                                   | Appearance              |
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

Typed wrappers: `src/components/buttons/` — `ButtonPrimary`, `ButtonAccent`,
`ButtonDestructive`, `ButtonActiveTab`, `ButtonInactiveTab`.

**Public site — `NeonButton`** (`src/components/buttons/ui/neon-button.tsx`, CVA
variants in `neon-button-variants.ts`)

| Prop      | Values                                                                                                                                    |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | `default · solid · primary · accent · gold · destructive · ghost · outline · outline-destructive · ghost-destructive · active-tab · link` |
| `size`    | `default` 44px · `sm` 34px · `lg` 52px · `icon` 36px                                                                                      |

Themeable variables consumed by both: `--accent-hover`, `--active-tab-bg`,
`--inactive-tab-bg`, `--inactive-tab-text`, `--inactive-tab-hover`,
`--brand-green-rgb`, `--brand-gold-rgb`, `--brand-red-rgb`.

### Panels, tables, cards

| Class                 | Purpose                                             | Parts                                                                            |
| :-------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------- |
| `.panel`              | card container — white bg, 1px border, radius       | —                                                                                |
| `.ph` / `.ph2`        | panel header                                        | `h3`, `.meta` subtitle                                                           |
| `.table`              | data table                                          | `.who`, `.reg`, `.row-actions`                                                   |
| `.card`               | stat card                                           | `.num` `.lbl` `.foot` `.delta` `.eye`; `.green` `.gold` `.red` `.black` variants |
| `.kpi`                | KPI tile                                            | `.l` `.v` `.d`; `.r` `.g` `.k` `.gr` bar colours                                 |
| `.pillar-card`        | public pillar card, left `border-l-4 border-accent` | —                                                                                |
| `.log` / `.log-row`   | activity feed                                       | `.stamp` `.body` `.tag.create/.edit/.delete`                                     |
| `.member-quick-stats` | member stat strip                                   | `.sl` `.sv` `.sd`                                                                |

### Status pills

| Class        | Meaning                                                      |
| :----------- | :----------------------------------------------------------- |
| `.pill`      | base badge — `--radius-pill`, 10.5px Public Sans, weight 600 |
| `.pill-ok`   | green — Verified / Active / Approved                         |
| `.pill-warn` | yellow — Pending                                             |
| `.pill-err`  | red — error / flagged                                        |
| `.pill-mute` | grey — Inactive                                              |

```tsx
<span
  className={`pill ${
    isVerified(m) ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'
  }`}
>
  {m.status}
</span>
```

`isVerified(m)` ⇔ `m.status === 'Active' || m.status === 'Approved' || !m.status`.

### Typography helpers

| Class                                         | Use                                                       |
| :-------------------------------------------- | :-------------------------------------------------------- |
| `.eye` (+ `.eye-gold` `.eye-red` `.eye-mute`) | 10px uppercase eyebrow                                    |
| `.field-label`                                | 10.5px uppercase form label                               |
| `.text-micro` / `.text-tiny`                  | 12px / 13px                                               |
| `.tnum`                                       | tabular numerals — **required on aligned number columns** |
| `.prose-standard`                             | long-form article body                                    |

`.field-label` and `.eye` are the **only** sanctioned uppercase in the system.

### Forms

`.form-understate`, `.compose .field` (+ `.lbl` `.chips` `.ch` `.toolbar`),
`.ico` icon button (`.ok` / `.no`), `.settings-tabs`, `.settings-form-grid`,
`.settings-form-grid-3`, `.btn-option-grid`, `.settings-save-row`.

Auth has a dedicated kit: `.auth-frame`, `.auth-header-label`, `.auth-content`,
`.auth-brand`, `.auth-heading`, `.auth-subheading`, `.auth-divider`,
`.auth-footer`, `.auth-stepper` (`.step.done` / `.step.current`),
`.verify-checks .check-row`, `.auth-foot-note`.

**Always set `boxSizing: 'border-box'` on inputs.**

### Shared components

`<BrandLine />` — the 3-stripe red·gold·green motif, 128 × 6px, under every major
heading. **Never hand-roll it.**

Also: `<WingDivider />`, `<TrustSignals />`, `<SortToggle />`, `<BrandIcon />`,
`<Breadcrumbs />`, `<Pagination />`, `<BackToTop />`, `<ReadingProgressBar />`,
`<ShareModal />`, `<SearchBar />`, `<GenderAvatar />`, `<CountryBadge />`,
`<MembershipCard />`, `<OfflineBanner />`.

Cards: `BlogPostCard`, `ChapterCard`, `ConstituencyCard`, `OfficerCard`,
`ProductCard`, `OpinionPollCard`, `MemberProfileCard`.

---

## States

**Do not hand-roll loading, empty or error states.** Import from
`src/components/states/`:

| Component           | When                                                                                  |
| :------------------ | :------------------------------------------------------------------------------------ |
| `<Skeleton />`      | content-shaped loading placeholder — **preferred over spinners** for lists and tables |
| `<Spinner />`       | inline / button-level busy indicator                                                  |
| `<EmptyState />`    | no data — icon, message, optional action                                              |
| `<Banner />`        | inline info / warning / error strip                                                   |
| `<FullPageState />` | whole-route loading or error                                                          |

### Required state coverage

Every interactive element ships all of these:

| Element      | State        | Behaviour                                                                |
| :----------- | :----------- | :----------------------------------------------------------------------- |
| Button       | default      | per variant                                                              |
| Button       | hover        | colour → `--primary`, `opacity-80`, or 1px translate-y lift              |
| Button       | active/press | `bg-primary/90`, no shrink                                               |
| Button       | focus        | 2px green ring — `hsl(var(--primary))`, never browser blue               |
| Button       | disabled     | `opacity-50; cursor: not-allowed`                                        |
| Button       | loading      | `<Spinner />` inside, button disabled, label retained                    |
| Input        | focus        | border → `--primary`, `box-shadow: 0 0 0 2px hsla(var(--primary), 0.15)` |
| Input        | error        | red border + message below; set `aria-invalid`                           |
| Input        | disabled     | `opacity-50`, non-interactive                                            |
| Table / list | loading      | `<Skeleton />` rows, not a centred spinner                               |
| Table / list | empty        | `<EmptyState />` with an action where one exists                         |
| Table / list | error        | `<Banner />` with retry                                                  |
| Card         | hover        | `hover-lift` — `-translate-y-1` + `shadow-lift`                          |

---

## Theming modes

Three orthogonal runtime axes, all attributes on `:root`. **Every new surface must
work across all three.**

### 1. Dark mode — `:root[data-theme='dark']`

A full token override, not a filter. Brand colours lighten so they stay legible on
near-black; `--panel-header` deliberately does not (see token table).

Read theme state via `src/hooks/useIsDarkTheme.ts`.

> **Legacy bridge, not a pattern:** `index.css` contains a block of
> `:root[data-theme='dark'] .bg-white / .bg-stone-50 / .bg-slate-100 / …`
> overrides that repaint hardcoded Tailwind utilities in unmigrated pages. New code
> must use semantic tokens so it themes for free. Do not add to that block.

### 2. Density — `:root[data-density='comfortable' | 'compact' | 'high-density']`

Consume `--panel-padding`, `--panel-gap`, `--table-cell-padding`.

### 3. Low bandwidth — `.low-bandwidth`

Disables transitions and animations, neutralises `animate-pulse` / `animate-bounce` /
`animate-spin` and `.spinner`, force-shows `[data-fade]` and
`[data-fade-stagger] > *`, downgrades image rendering.

**Never gate content behind an animation** — it must be readable with motion off.

---

## Motion

Motion on the public site is **opt-in via data-attributes**, not per-page GSAP.
`useSiteMotion` (mounted once in `PublicLayout`) wires them on every route change;
the engine is `src/lib/motion/`.

| Attribute           | Effect                                             |
| :------------------ | :------------------------------------------------- |
| `data-fade`         | element fades + rises once when scrolled into view |
| `data-fade-stagger` | the element's **direct children** stagger in       |
| `data-countup="N"`  | numeric counter animates to `N`                    |

### The motion vocabulary — do not invent new values

| Property | Value                                         |
| :------- | :-------------------------------------------- |
| duration | `0.5s`                                        |
| easing   | `power2.out`                                  |
| distance | `16px` translateY                             |
| stagger  | `0.08s` between items, total capped at `0.6s` |
| trigger  | `top 85%`                                     |

For CSS transitions: `ease-out`, `duration-200` / `duration-300`.

**Built-in safety rails:** reveals are idempotent (elements marked `data-fade-done`,
safe to re-run as lazy content mounts); content is hidden by **JS, never CSS**, so
SSR / no-JS renders it visible; the engine no-ops under `prefers-reduced-motion` and
`.low-bandwidth`.

**No bounces, no parallax, no floating shapes.**

---

## Interaction patterns

**Modal** — fixed overlay `rgba(0,0,0,0.45)` at `zIndex: 100`, flex-centred,
click-outside to dismiss, `e.stopPropagation()` on the inner panel.

**Dropdown** — `openMenuId` state; a `position: fixed; inset: 0` click-catcher at
`zIndex: 40`; menu at `zIndex: 50`, `top: 'calc(100% + 4px)'`.

**Money** — format through `src/lib/currency.ts` (GHS/USD). Never inline.
**Counts** — `toLocaleString()` ("355,000 members").

---

## Content rules

| Dimension   | Rule                                                      |
| :---------- | :-------------------------------------------------------- |
| Tone        | confident, hopeful, practical, nation-building            |
| Person      | "we" (the movement) and "you" (the citizen)               |
| Casing      | sentence case everywhere except `.field-label` and `.eye` |
| Emoji       | **none** in product UI                                    |
| Punctuation | em dashes, short sentences, sharp full stops              |
| Numerals    | locale-aware via `toLocaleString()`                       |

**Vocabulary:** "The Plan" (agenda) · "Updates" (blog) · "Supplies" (store) ·
**"Diaspora"** (overseas branches) · "Verified citizen" · "Patriot" · "Movement".

> **Diaspora rename is display-only.** All code identifiers stay `chapter` — DB
> tables and columns, `/chapters` routes, `scope_type === 'chapter'`,
> `chapterService`. Render labels through `src/lib/diaspora.ts`
> (`diasporaName` / `diasporaSlug` / `matchesChapterSlug`). Never hardcode
> "Diaspora" where a `chapter` identifier is expected.

**Avoid:** "empowering your journey", "unlocking potential", "transformative
solutions", "all-in-one platform", generic slogans without explanation.

---

## Edge cases

| Case                       | Handling                                                                                                                                                                     |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty data**             | `<EmptyState />` — icon, one-sentence explanation, action if one exists. Never a bare "No results".                                                                          |
| **Long text**              | Names and titles truncate with ellipsis; the full value goes in `title`. Ghanaian names and constituency names run long — test with the longest real value, not lorem ipsum. |
| **Long numbers**           | `.tnum` on aligned columns; `toLocaleString()` for grouping.                                                                                                                 |
| **Slow connection**        | `.low-bandwidth` strips motion; skeletons carry perceived performance.                                                                                                       |
| **Offline**                | `<OfflineBanner />` + IndexedDB queue (`src/utils/offlineDb`); see `docs/audits/offline-mode-hardening-2026-05-25.md`.                                                       |
| **Missing avatar**         | `<GenderAvatar />` fallback — never a broken image.                                                                                                                          |
| **Missing optional field** | render an em dash, not an empty cell.                                                                                                                                        |
| **Large lists**            | paginate with `<Pagination />`; the reveal stagger is already capped so long grids don't drag.                                                                               |
| **International text**     | Diaspora country names and non-Latin characters must not break layout — labels wrap, they don't clip.                                                                        |
| **Dark mode**              | verify every new surface; the legacy Tailwind bridge does not cover new classes.                                                                                             |
| **High-density mode**      | verify padding still reads; `--fs-base` drops to 14px.                                                                                                                       |

---

## Accessibility

### Contrast

- `--on-surface-muted` was darkened to `#616b63` specifically to pass **AA 4.5:1**
  on white and tinted surfaces. Do not lighten it back.
- `--panel-header` exists so white-on-green headers keep AA **in both themes**.
- Any new colour pairing must be checked at AA before it ships.

### Focus

- A universal safeguard in `index.css` forces `outline-color` and `--tw-ring-color`
  to `hsl(var(--primary))` on `*:focus` and `*:focus-visible` — the browser's default
  blue ring never appears.
- Inputs on focus: border → `--primary` plus a 2px `hsla(var(--primary), 0.15)` halo.
- **Never remove a focus indicator** without providing a visible replacement.
- Focus order follows DOM order — keep DOM order matching visual order.

### ARIA — current baseline

`aria-label` (251 uses) · `aria-hidden` (33) · `aria-labelledby` (15) ·
`aria-checked` (5) · `aria-expanded` (3) · `aria-selected` / `aria-haspopup` (2 each) ·
`aria-pressed` / `aria-modal` / `aria-live` / `aria-invalid` / `aria-describedby` (1 each).

Requirements for new work:

| Element          | Requirement                                                                                                        |
| :--------------- | :----------------------------------------------------------------------------------------------------------------- |
| Icon-only button | `aria-label` describing the action                                                                                 |
| Decorative icon  | `aria-hidden="true"`                                                                                               |
| Modal            | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus trapped; Esc closes; focus returns to the trigger |
| Dropdown         | `aria-expanded` + `aria-haspopup` on the trigger; Esc closes; arrow keys move                                      |
| Tabs             | `aria-selected` on the active tab; arrow keys move between tabs                                                    |
| Form field       | label associated with the input; `aria-invalid` + `aria-describedby` pointing at the error on failure              |
| Async result     | `aria-live="polite"` on the region that updates                                                                    |
| Status pill      | the status must be readable as text, not colour alone                                                              |

`aria-live` and `aria-describedby` are each used once today — **that is a gap, not a
standard.** Toast/async feedback and form errors in new work should raise those counts.

### Keyboard

All interactive elements reachable by Tab; Enter/Space activate; Esc dismisses
overlays. Use `sr-only` for screen-reader-only text (7 files use it today).

### Motion

`prefers-reduced-motion` is honoured by the motion engine automatically. Do not
bypass it with bespoke animation.

---

## Implementation rules

1. **No new Tailwind classes in migrated components.** Tailwind 3 still compiles the
   legacy surfaces, but new work uses the class library plus inline style objects.
2. **Preserve existing inline styles.** Do not convert them to utilities.
3. **No shadcn/ui.** `components.json` is legacy config only.
4. **No new UI or icon libraries** without an explicit request.
5. **Services own Supabase.** Pages never call `supabase` directly — go through
   `src/services/*` (23 services).
6. **Routes are lazy-loaded** via `React.lazy()` + `Suspense` in `src/routes.tsx`.
7. **CSP is split by surface.** `vercel.json` applies a strict policy to the public
   site (A+) and a looser one to `/admin` + `/graphify` for TinyMCE and inline
   visualisation. Public and dashboard HTML must stay free of inline scripts, and
   nothing may load from an external CDN.
8. **New `public.users` columns need column-level grants:**
   ```sql
   GRANT SELECT (new_column) ON TABLE public.users TO authenticated;
   GRANT SELECT (new_column) ON TABLE public.users TO anon;
   ```
   `national_id` is the exception — read only via the `admin_get_national_id(reg_no)`
   RPC. See `docs/database/users-column-security.md`.

### Validation — in this order, before every commit

```bash
npm run typecheck && npm run lint && npm run build
```

### Deployment

`npm run typecheck` → `npm run build` → `git push` (Vercel auto-deploys from main) →
`supabase functions deploy <name>` for edge functions. Migrations go through the
Supabase MCP `apply_migration`, **never `supabase db push`** — the remote migration
history is out of sync.

---

## Pre-merge checklist

- [ ] Colours via `hsl(var(--token))` — no raw hex
- [ ] Radii via `var(--radius-*)` — no hardcoded px
- [ ] Weight is `var(--font-weight-medium, 500)` — no 700+ outside logos
- [ ] KPI numbers use `var(--kpi-num-size)`
- [ ] Icons are Material Symbols — no Lucide, no emoji
- [ ] Panels/tables consume `--panel-padding` / `--panel-gap` / `--table-cell-padding`
- [ ] Verified in **dark mode**
- [ ] Verified in **compact** and **high-density**
- [ ] Verified at **640 / 768 / 1024 / 1280**
- [ ] Loading, empty and error states use `src/components/states/*`
- [ ] Focus visible and green on every interactive element
- [ ] Icon-only buttons have `aria-label`
- [ ] Long values and missing values tested
- [ ] Reused an existing component/class rather than adding one
- [ ] `npm run typecheck && npm run lint && npm run build` all pass

---

## Where things live

| Path                                     | Contents                                                                  |
| :--------------------------------------- | :------------------------------------------------------------------------ |
| `src/index.css`                          | the design system — tokens, all classes (62 KB; search, don't read whole) |
| `tailwind.config.js`                     | font families, weight variable mapping, legacy Tailwind                   |
| `src/components/`                        | shared components — **check here first**                                  |
| `src/components/states/`                 | Skeleton, Spinner, EmptyState, Banner, FullPageState                      |
| `src/components/buttons/`                | admin `.btn` wrappers + public NeonButton                                 |
| `src/components/ui/`                     | BrandLine, BrandIcon, WingDivider, TrustSignals, SortToggle               |
| `src/components/layouts/`                | AdminLayout, admin sidebar/topbar                                         |
| `src/context/BrandingContext.tsx`        | runtime CSS-variable injection                                            |
| `src/lib/motion/`                        | GSAP core + reveal engine                                                 |
| `src/lib/currency.ts` · `diaspora.ts`    | money formatting · Diaspora labels                                        |
| `src/hooks/`                             | `useIsDarkTheme`, `use-mobile`, `useMediaQuery`, `useSiteMotion`          |
| `src/services/`                          | the only layer that calls Supabase (23 services)                          |
| `docs/design-system-handoff/…/README.md` | brand foundations and rationale                                           |
| `docs/audits/`                           | per-topic audits (radii, typography, buttons, states, mobile)             |

---

## Known gaps

| Gap                                 | Status                                                                                                           |
| :---------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `preview/*.html` cards              | light mode only — no dark, density or state-component cards                                                      |
| `ui_kits/` prototypes               | 16 kits as static HTML; only `website/` has React components; all predate the `data-fade` motion engine          |
| Admin command center                | documented in prose, not reproduced as a kit — treat `src/index.css` and the live admin pages as source of truth |
| `aria-live` / `aria-describedby`    | one use each — under-adopted, raise in new work                                                                  |
| Legacy Tailwind in unmigrated pages | held together by the dark-mode compatibility bridge; migrate on touch                                            |
| Hardcoded px radii in legacy files  | migrate on touch                                                                                                 |

**Precedence:** where this handoff and a prototype file disagree, this document wins.
Where this document and `src/index.css` disagree, **the codebase wins** — and this
document should be corrected in the same PR.

---

© 2026 The Base Movement — Ghana First.
