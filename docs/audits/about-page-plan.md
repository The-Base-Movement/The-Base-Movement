# About Page — Build Plan

## Status: In Progress

## Inspiration → Our System mapping

| Inspiration              | Our system                                          |
| ------------------------ | --------------------------------------------------- |
| Cream bg `#F2F2EB`       | `hsl(var(--surface-warm))`                          |
| Dark navy `#202e44`      | `hsl(var(--on-surface))`                            |
| Warm gold `#88734C`      | `hsl(var(--accent))`                                |
| framer-motion fade/slide | `IntersectionObserver` + CSS `transition`           |
| framer-motion count-up   | `requestAnimationFrame` counter hook                |
| Lucide icons             | Material Symbols Outlined                           |
| shadcn Button            | `Button` from `@/components/buttons/ui/neon-button` |
| Arbitrary hex colors     | `hsl(var(--*))` CSS variables                       |

## Page sections

```
AboutHero     — eyebrow + h1 + BrandLine + tagline paragraph
AboutPillars  — 3-col grid: left (3 items) | center image | right (3 items)
AboutStats    — 4 animated counters (data from adminService.getPublicStats())
AboutCTA      — dark banner + "Join the Movement" button → /register
```

## File structure

```
src/pages/About.tsx
src/pages/about/
  AboutHero.tsx
  AboutPillars.tsx
  AboutStats.tsx
  AboutCTA.tsx
```

## The 6 pillar items

**Left column**

1. Our Mission — `flag` — Delivering an honest, detailed agenda rooted in the realities of ordinary Ghanaians
2. Ghana Network — `location_on` — Organized across all 275 constituencies, mobilizing patriots at the grassroots
3. Leadership — `groups` — Dedicated leaders across regions driving transformational change

**Right column** 4. Diaspora Network — `public` — Uniting Ghanaian patriots worldwide under one movement 5. Our Values — `diamond` — Guided by Patriotism, Honesty, and Discipline in everything we do 6. The Vision — `visibility` — Quality education, lean government, and industrialisation for Ghana

## Stats (from `adminService.getPublicStats()`)

| Field      | Label            | Suffix |
| ---------- | ---------------- | ------ |
| `members`  | Ghana patriots   | +      |
| `chapters` | Active chapters  | +      |
| `regions`  | Regions covered  | / 16   |
| `diaspora` | Diaspora members | +      |

## Route + Nav

- Route: `/about` (public) + `/dashboard/about` (dashboard, same page)
- Nav: insert "About" after "Home" in `NAV_LINKS`

## Animation approach (no framer-motion)

- Fade-in / slide-up on scroll: `IntersectionObserver` sets `data-visible="true"` → CSS `opacity/transform` transition
- Stat counter: `requestAnimationFrame` loop easing from 0 → value when section enters viewport
- Hover effects: CSS `transition: transform 0.2s` inline or Tailwind `hover:` classes

## Checklist

- [x] Plan written
- [x] AboutHero.tsx
- [x] AboutPillars.tsx
- [x] AboutStats.tsx
- [x] AboutCTA.tsx
- [x] About.tsx (page shell)
- [x] Route added to routes.tsx
- [x] Nav link added to Navbar.tsx
- [x] Committed and pushed
