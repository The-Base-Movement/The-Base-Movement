# About CTA Redesign — Design Spec

**Date:** 2026-06-08  
**File:** `src/pages/about/AboutCTA.tsx`  
**Status:** Approved

---

## Goal

Replace the existing light horizontal strip CTA at the bottom of the About page with a modern, SEO-optimized dark section that has stronger visual hierarchy and social proof signals.

---

## Layout

Full-width `<section>` with dark charcoal background (`hsl(var(--on-surface))`), centered content in a max-width container (1280px). Vertical stack:

1. `<h2>` — "Ready to Join the Movement?" — large white headline, proper heading hierarchy after the stats section above it
2. `<p>` subtext — "Add your name. Strengthen the cause. Ghana First."
3. Trust signal row — 3 inline chips with Material Symbol icon, gold value, faint white label:
   - `groups` icon — "10,000+ Patriots"
   - `map` icon — "16 Regions"
   - `public` icon — "Global Diaspora"
4. CTA button — gold accent, "Join the Base" + `arrow_forward` icon, links to `/register`

On mobile the trust signal row wraps to a single column.

---

## Semantics & SEO

- Wrapping element is `<section aria-label="Join The Base Movement">` — landmark for screen readers and search crawlers
- Headline is `<h2>` — meaningful heading in the page outline
- Trust signals are a `<ul>` of `<li>` items — semantically meaningful list, not decorative divs
- CTA link text is descriptive ("Join the Base") — good for accessibility and anchor text signals

---

## Styling

| Token                    | Usage                                           |
| ------------------------ | ----------------------------------------------- |
| `hsl(var(--on-surface))` | Section background                              |
| `hsl(var(--accent))`     | Top 3px accent bar, trust signal values, button |
| `hsl(var(--card))`       | Headline text (pure white)                      |
| `rgba(255,255,255,0.6)`  | Subtext                                         |
| `rgba(255,255,255,0.5)`  | Trust signal labels                             |
| `rgba(255,255,255,0.15)` | Vertical dividers between trust chips           |
| `var(--radius-lg)`       | Container border radius (12px)                  |

Section has a 3px `hsl(var(--accent))` bar at the very top (matches KPI tile left-bar pattern in the design system).

Font: `'Public Sans', sans-serif` throughout. Font weight: `var(--font-weight-medium, 500)`.

---

## Animation

- Keep existing `IntersectionObserver` pattern with `visible` state (`threshold: 0.2`)
- Whole section fades + translates up on enter (opacity 0→1, translateY 24px→0)
- Trust signal chips stagger in: delays of 0ms, 120ms, 240ms on the three items
- Transition: `opacity 0.6s ease, transform 0.6s ease`

---

## Component Interface

No props — all content is static. Self-contained component, no services called.

---

## Out of Scope

- No member count fetched from DB (static copy "10,000+" is intentional — avoids async complexity in a CTA)
- No second button (single focused CTA)
- No Tailwind classes — inline styles only per design system rules
