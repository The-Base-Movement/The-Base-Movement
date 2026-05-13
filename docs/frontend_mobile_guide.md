# Frontend Mobile Responsiveness Guide

This document is the authoritative reference for implementing mobile responsiveness across The Base frontend pages. All changes must strictly follow the conventions established in the admin handoff and the completed pages listed below. Do not deviate from these patterns.

---

## What Has Already Been Fixed — Do NOT Modify

| Component / Page | Status | Notes |
| :--- | :--- | :--- |
| `src/components/Navbar.tsx` | ✅ Done | Uses `desktop-only` / `mobile-only` + custom state dropdown |
| `src/components/Footer.tsx` | ✅ Done | Uses `.footer-grid` class with `!important` breakpoints |
| `src/pages/Home.tsx` | ✅ Done | clamp hero font, roadmap flex-row mobile, responsive paddings |
| `src/pages/ProfileSettings.tsx` | ✅ Done | `.profile-page`, `.profile-cols`, `.profile-form-grid` |

---

## Design System Tokens (hsl variables)

All colours must use these tokens — **no hex codes, no Tailwind colour classes**.

```
--primary          Brand green   #006B3F
--accent           Gold          #DAA520
--destructive      Red           #CE1126
--on-surface       Near-black text
--on-surface-muted Muted/secondary text
--border           Hairline border colour
--container-low    Subtle background tint
--surface-warm     Warm off-white (footer background)
```

Usage syntax: `color: 'hsl(var(--primary))'`, `background: 'hsl(var(--border))'`

---

## Global CSS Classes (defined in `src/index.css`)

### Visibility utilities (768px breakpoint)
```css
.desktop-only  → display: none !important  on screens ≤ 768px
.mobile-only   → display: none !important  on screens > 768px
```
Use these to show/hide entire blocks rather than adding inline media queries.

### Admin layout classes (AdminLayout children only)
`.main`, `.ph`, `.panel`, `.crumbs`, `.kpis`, `.kpi`, `.pill`, `.btn`, `.btn-primary`, `.btn-outline`, `.btn-dest`, `.btn-sm`

### Public / dashboard page classes
`.profile-page` — page wrapper with responsive padding  
`.profile-cols` — 5fr/7fr grid that stacks at 960px  
`.profile-form-grid` — 2-col form grid that stacks at 640px  
`.profile-form-full` — full-width form field  
`.footer-grid` — 3-col footer grid that goes 2-col at 1024px, 1-col at 640px  

---

## Replacing Lucide Icons

Every Lucide icon import must be removed and replaced with a Material Symbol. Pattern:

```tsx
// BEFORE (remove this)
import { ArrowRight, Loader2, Newspaper } from 'lucide-react'
<ArrowRight className="w-4 h-4" />
<Loader2 className="animate-spin" />

// AFTER (use this)
<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
<span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1.2s linear infinite' }}>sync</span>
```

### Common icon mappings
| Lucide | Material Symbol name |
| :--- | :--- |
| `ArrowRight` | `arrow_forward` |
| `Loader2` | `sync` |
| `Newspaper` | `newspaper` |
| `GraduationCap` | `school` |
| `Building2` | `apartment` |
| `Factory` | `factory` |
| `Construction` | `construction` |
| `Landmark` | `account_balance` |
| `Sprout` | `eco` |
| `Heart` | `favorite` |
| `Check` | `check` |
| `Mail` | `mail` |
| `Phone` | `call` |
| `MapPin` | `location_on` |
| `Send` | `send` |
| `Globe` | `language` |
| `ChevronDown` | `expand_more` |
| `ChevronRight` | `chevron_right` |
| `X` / `Close` | `close` |
| `Search` | `search` |
| `User` | `person` |
| `Settings` | `settings` |
| `LogOut` | `logout` |
| `Bell` | `notifications` |
| `ExternalLink` | `open_in_new` |
| `Plus` | `add` |
| `Minus` | `remove` |
| `Trash` | `delete` |
| `Edit` | `edit` |
| `Share` | `share` |
| `Download` | `download` |
| `Upload` | `upload` |
| `Filter` | `filter_list` |
| `BarChart2` | `bar_chart` |
| `Info` | `info` |
| `AlertCircle` | `error` |
| `CheckCircle` | `check_circle` |
| `Lock` | `lock` |

---

## Replacing neon-button `Button`

Remove all `import { Button } from '@/components/ui/neon-button'` imports.  
Replace with native `<button>` or `<Link>` elements using inline styles.

### Primary CTA (green fill)
```tsx
<Link
  to="/some-path"
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px',
    background: 'hsl(var(--primary))',
    color: '#fff',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 800, fontSize: 13,
    borderRadius: 4, textDecoration: 'none', border: 'none',
  }}
>
  Label <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
</Link>
```

### Outline button
```tsx
<Link
  to="/some-path"
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px',
    background: 'transparent',
    color: 'hsl(var(--on-surface))',
    border: '1px solid hsl(var(--border))',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 800, fontSize: 13,
    borderRadius: 4, textDecoration: 'none',
  }}
>
  Label
</Link>
```

### Accent button (gold fill)
```tsx
style={{
  background: 'hsl(var(--accent))',
  color: '#fff',
  /* rest same as primary */
}}
```

---

## Section Padding Pattern

Replace all fixed vertical padding with the responsive pair pattern:

| Old (Tailwind fixed) | New (responsive pair) |
| :--- | :--- |
| `py-24` | `py-16 md:py-24` |
| `py-32` | `py-20 md:py-32` |
| `pt-24` | `pt-16 md:pt-24` |
| `pb-48` | `pb-16 md:pb-32` |
| `px-8` | `px-4 md:px-8` |
| `py-16` | keep as-is |

When using inline `style` instead of Tailwind, use `clamp()` for fluid spacing:
```tsx
style={{ padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px)' }}
```

---

## Typography — Fluid Headings

Hero and section headings should scale fluidly instead of switching at a fixed breakpoint:

```tsx
// Hero H1
style={{ fontSize: 'clamp(32px, 8vw, 64px)', lineHeight: 1.05 }}

// Section H2
style={{ fontSize: 'clamp(26px, 5vw, 44px)', lineHeight: 1.1 }}

// Section H3
style={{ fontSize: 'clamp(18px, 3.5vw, 26px)', lineHeight: 1.2 }}
```

---

## Grid Responsiveness Without Tailwind

For components using CSS Grid via inline styles (which cannot use media queries), add a named CSS class in `src/index.css` instead:

```css
/* in index.css */
.my-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 768px) { .my-grid { grid-template-columns: 1fr !important; } }
```

Then use `className="my-grid"` on the container. Use `!important` in breakpoints when an inline `style` also sets `display` or `grid-template-columns` (inline styles win without it).

---

## Stat/KPI Grids

On mobile, stat grids should show 2 columns, not 1:

```tsx
// Tailwind
className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"

// CSS Grid class approach
// index.css: .stat-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:16px; }
// @media(max-width:768px){ .stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
```

---

## Select Dropdowns — `SelIcon` Helper

Any native `<select>` element that needs a custom chevron arrow should use this helper:

```tsx
function SelIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        position: 'absolute', right: 9, top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 16, color: 'hsl(var(--on-surface-muted))',
        pointerEvents: 'none',
      }}
    >
      expand_more
    </span>
  )
}
// Wrap the <select> in: <div style={{ position: 'relative' }}> ... <SelIcon /> </div>
// Add to select: style={{ appearance: 'none', paddingRight: 34 }}
```

---

## Page-by-Page Mobile Work Needed

The following public-facing pages still use Tailwind, Lucide, and neon-button and need to be migrated to the design system:

### Priority 1 — High-traffic public pages

#### `src/pages/Blog.tsx`
- Remove: `ArrowRight`, `Loader2`, `Newspaper` from lucide-react; `Button` from neon-button
- Replace: Lucide icons → material symbols per mapping table above
- Replace: `Button` → native `<Link>` / `<button>` with inline styles
- Hero heading: apply `clamp()` font sizing
- Category filter pills: keep functional, update colours to `hsl(var(--primary))` / `hsl(var(--border))`
- Post grid: verify `sm:grid-cols-2 md:grid-cols-3` (should already be reasonable — check spacing on 375px)
- Remove `bg-stone-50/50`, `font-meta` class — use `fontFamily: "'Public Sans', sans-serif"` inline or existing CSS

#### `src/pages/BlogPost.tsx`
- Remove any Lucide icons and neon-button usage (check imports)
- Ensure article body text is readable at 375px (max-width and appropriate font-size)
- Hero image aspect ratio: use `paddingBottom: '56.25%'` trick or `aspect-video` equivalent

#### `src/pages/OurAgenda.tsx`
- Remove: `GraduationCap`, `Building2`, `Factory`, `Construction`, `Landmark`, `Sprout`, `ArrowRight` from lucide-react; `Button` from neon-button
- Replace icons: use material symbols per mapping above
- Pillar cards: check that they stack cleanly at 375px
- Tab/section navigation: ensure touch targets are ≥ 44px tall
- Hero heading: `clamp()` font sizing

#### `src/pages/Contact.tsx`
- Remove: `Mail`, `Phone`, `MapPin`, `Send` from lucide-react; `Button` from neon-button
- Replace icons: use material symbols in contact info list
- Form layout: should be single-column on mobile — check padding and input height (min 44px)
- Submit button: native `<button>` with primary green fill

#### `src/pages/Donate.tsx`
- Remove: `Heart`, `Check` from lucide-react; `Button` from neon-button
- Note: Donate has sub-components in `src/pages/donate/components/` — check each for Lucide/neon-button usage
- Step wizard: ensure step indicators are visible and tappable at 375px
- Amount buttons: minimum 44px touch target
- Hero stats: 2-column grid on mobile

### Priority 2 — Secondary public pages

#### `src/pages/Impact.tsx`
- Remove any Lucide icons and neon-button
- Data visualisations / charts: ensure they have `width: 100%` and a sensible min-height on mobile
- Stat cards: 2-column grid on mobile

#### `src/pages/Chapters.tsx` (public route `/chapters`)
- Note: This page also renders inside DashboardLayout — changes apply to both routes
- Remove Lucide icons, neon-button
- Chapter cards grid: `sm:grid-cols-2 lg:grid-cols-3` — verify no horizontal overflow at 375px
- Filter/search bar: full-width on mobile

#### `src/pages/ChapterDetails.tsx`
- Remove Lucide icons, neon-button
- Leadership cards: stack to 1-column on mobile
- Hero section: `clamp()` heading size

#### `src/pages/Members.tsx`
- Remove Lucide icons, neon-button
- Member cards: 2-column grid → 1-column at 480px
- Search/filter: full-width inputs on mobile

#### `src/pages/Press.tsx`
- Remove Lucide icons, neon-button
- Press release cards: single column on mobile, comfortable padding

#### `src/pages/Login.tsx`
- Remove Lucide icons, neon-button if present
- Form: centred card should not overflow at 375px — check horizontal padding (min 16px)
- Input height: 44px min for touch targets

#### `src/pages/Register.tsx`
- Remove Lucide icons, neon-button
- Multi-step or long form: single column on mobile
- Progress indicator: horizontally scrollable or stacked if multi-step

### Priority 3 — Store / transaction pages

#### `src/pages/Store.tsx`
- Product grid: `grid-cols-2` on mobile (do not drop to 1 column — too sparse)
- Filter sidebar: convert to a bottom sheet or collapsible section on mobile
- Remove Lucide icons, neon-button

#### `src/pages/ProductDetails.tsx`
- Image gallery: full-width hero image on mobile, thumbnails below or in horizontal scroll
- Add-to-cart button: fixed to bottom of viewport on mobile if not already
- Remove Lucide icons, neon-button

#### `src/pages/Cart.tsx`
- Line items: stack product image and details vertically at 480px
- Remove Lucide icons, neon-button

#### `src/pages/Checkout.tsx`
- Form sections: single column on mobile
- Order summary: display below form (not side-by-side) on mobile
- Remove Lucide icons, neon-button

#### `src/pages/Polls.tsx`
- Poll cards: single column on mobile
- Voting controls: full-width buttons, 44px tall
- Remove Lucide icons, neon-button

---

## Checklist for Each Page

Before marking a page as complete, verify:

- [ ] No `import` from `lucide-react` remains
- [ ] No `import { Button }` from `neon-button` remains
- [ ] No Tailwind colour classes (e.g., `text-brand-green`, `bg-stone-50`, `text-emerald-600`) remain
- [ ] No fixed `px-8` / `py-24` paddings that would be too cramped or too spacious at 375px
- [ ] Hero headings use `clamp()` font sizing or `text-3xl md:text-5xl` equivalents
- [ ] All tap targets (buttons, links) are at least 44px tall
- [ ] Grids stack correctly — run Chrome DevTools at 375px (iPhone SE) and 390px (iPhone 14)
- [ ] No horizontal scroll at any width between 320px and 768px
- [ ] TypeScript compiles with no errors after changes (`npx tsc --noEmit`)

---

## Reference Files

| File | Purpose |
| :--- | :--- |
| `src/index.css` | All global CSS classes and token definitions |
| `src/components/Navbar.tsx` | Reference for mobile drawer, `desktop-only`/`mobile-only` usage |
| `src/components/Footer.tsx` | Reference for `footer-grid` class with `!important` breakpoints |
| `src/pages/Home.tsx` | Reference for fluid typography, roadmap mobile layout, section padding pattern |
| `src/pages/ProfileSettings.tsx` | Reference for `SelIcon`, `inputStyle`, `labelStyle` constants |
| `docs/layout_guidelines.md` | Grid vs Flexbox decision rules |
| `docs/mobile_responsiveness_audit.md` | Status tracker for admin pages (separate scope) |
