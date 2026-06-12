# About Page — Build Plan

## Status: COMPLETE ✅ (2026-05-26)

---

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

---

## Page sections

```
AboutHero     — eyebrow + h1 + BrandLine + tagline paragraph (CMS-editable)
AboutPillars  — 3-col grid: left (3 items) | center LeaderSlider | right (3 items)
AboutStats    — 4 animated counters (data from get_public_stats RPC)
AboutCTA      — dark banner + "Join the Movement" button → /register
```

---

## File structure

```
src/pages/About.tsx
src/pages/about/
  AboutHero.tsx
  AboutPillars.tsx
  AboutStats.tsx
  AboutCTA.tsx
  LeaderSlider.tsx                        ← added: Swiper fade slider of executive officials
src/pages/admin/settings/components/
  AboutPageTab.tsx                        ← added: admin CMS tab for about page content
```

---

## The 6 pillar items (final order)

**Left column** (red → gold → green)

1. Our Mission — `flag` — `hsl(var(--destructive))`
2. Our Vision — `visibility` — `hsl(var(--accent))`
3. Our Values — `diamond` — `hsl(var(--primary))`

**Right column** (red → gold → green)

4. Leadership — `groups` — `hsl(var(--destructive))`
5. Ghana Network — `location_on` — `hsl(var(--accent))`
6. Diaspora Network — `public` — `hsl(var(--primary))`

> Color order rule: Red → Gold → Green always. Applied per column, not across columns.

All pillar descriptions are CMS-editable via `site_settings` keys (`about_pillar_mission`, etc.).
Hardcoded fallbacks remain in the PILLARS array for first-load before DB rows exist.

---

## Center column — LeaderSlider

- Fetches `party_officials` where `tier = 'executive'`, ordered by `order_index`
- Uses Swiper (`EffectFade` + `Autoplay` + `Pagination`) — same library as `OfficerCardSlider`
- Falls back to Unsplash placeholder if no data
- Decorative offset border via `box-shadow`: `-10px 10px 0 0 hsl(var(--primary) / 0.2)`
- Name/role overlay on image; CTA below: `Button variant="outline" size="sm"` → `/officers`
- Managed via existing Officers admin (no separate data source)

---

## Stats (from `get_public_stats` RPC)

| Field      | Label            | Accent bar color          |
| ---------- | ---------------- | ------------------------- |
| `members`  | Ghana patriots   | `hsl(var(--primary))`     |
| `chapters` | Active chapters  | `hsl(var(--accent))`      |
| `regions`  | Regions covered  | `hsl(var(--destructive))` |
| `diaspora` | Diaspora members | `hsl(var(--on-surface))`  |

Stats are fetched via `supabase.rpc('get_public_stats')` — a `SECURITY DEFINER` Postgres function
that bypasses RLS to return aggregate counts without exposing PII. Granted to `anon` + `authenticated`.

---

## CMS — Admin Settings tab

Added **About Page** tab to `/admin/settings` (between Movement Info and Security).

Editable fields:

- `about_hero_tagline` — hero paragraph below the h1
- `about_pillar_mission` — left pillar 1
- `about_pillar_vision` — left pillar 2
- `about_pillar_values` — left pillar 3
- `about_pillar_leadership` — right pillar 1
- `about_pillar_ghana_network` — right pillar 2
- `about_pillar_diaspora` — right pillar 3

Saved to `site_settings` table via `adminService.updateSiteSetting()` (upsert on conflict `key`).
Dispatches `site_settings_updated` CustomEvent on save for live branding reload.

---

## Route + Nav

- Route: `/about` (public, under `PublicLayout`)
- Added to `ssgOptions.includedRoutes` in `vite.config.ts` for SSG prerendering
- Nav: "About" link present in Navbar

---

## Animation approach (no framer-motion)

- Fade-in / slide-up on scroll: `IntersectionObserver` → inline `opacity/transform` CSS transitions
- Stat counter: `requestAnimationFrame` loop with cubic ease-out easing from 0 → value
- Pillar items: staggered `delay` prop (0ms, 120ms, 240ms per column)

---

## Typography compliance

All files follow the no-bold directive:

- `fontWeight: 'var(--font-weight-medium, 500)'` for all headings and labels
- `fontWeight: 'var(--font-weight-normal, 400)'` for body/paragraph text
- No hardcoded `700/800/900` values anywhere

---

## Checklist

- [x] Plan written
- [x] AboutHero.tsx — accepts `tagline` prop with hardcoded fallback
- [x] AboutPillars.tsx — accepts 6 description override props; color order Red→Gold→Green per column
- [x] AboutStats.tsx — matches StatCard handoff pattern (white card, top accent bar, corner dot, sparkline)
- [x] AboutCTA.tsx
- [x] LeaderSlider.tsx — Swiper fade slider from `party_officials` executive tier
- [x] About.tsx — fetches `getPublicStats()` + `getSiteSettings()`, passes props to sub-components
- [x] Route added to routes.tsx + ssgOptions
- [x] Nav link in Navbar.tsx
- [x] get_public_stats SECURITY DEFINER RPC created and granted to anon
- [x] AboutPageTab.tsx — admin CMS tab with hero tagline + 6 pillar fields
- [x] AboutPageTab wired into Settings.tsx (tab id: `about`, icon: `info`)
- [x] Officers.tsx h2 corrected: `font-semibold` → `font-medium`
- [x] Typography audit file updated (typography-frontend-audit-2026-05-25.md)
