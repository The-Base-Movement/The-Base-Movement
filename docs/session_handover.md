# Session Handover — The Base Movement Platform

This file is a structured summary of all work completed so far so that a new session can continue without re-discovering context. Read this before starting any task.

---

## Project Overview

**The Base Movement** is a Ghanaian political/civic movement platform. Stack: React + TypeScript + Vite + Tailwind (being phased out) + Supabase. Routes split across three layouts:
- `PublicLayout` — public-facing pages (`/`, `/blog`, `/chapters`, etc.)
- `DashboardLayout` — logged-in member area (`/dashboard/*`)
- `AdminLayout` — admin panel (`/admin/*`)

**Key files:**
- `src/index.css` — all global CSS classes and design tokens
- `src/routes.tsx` — all routes
- `src/services/adminService.ts` — unified service layer (wraps chapterService, pollService, tacticalService, etc.)
- `src/types/admin.ts` — all TypeScript types (Chapter, Poll, Milestone, BlogPost, etc.)

---

## Design System — Strict Rules

All new or refactored code must follow these conventions. **Do not deviate.**

### Colour tokens (always `hsl(var(--...))`, never hex or Tailwind colour classes)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--primary` | `#006B3F` | Brand green — CTAs, active states, links |
| `--accent` | `#DAA520` | Gold — secondary CTAs, highlights |
| `--destructive` | `#CE1126` | Red — danger, live indicators |
| `--on-surface` | near-black | Primary text, dark backgrounds |
| `--on-surface-muted` | muted | Secondary text, labels |
| `--border` | hairline | Borders, dividers |
| `--container-low` | subtle tint | Card backgrounds, input fills |
| `--surface-warm` | warm off-white | Footer background |

### Icons — Material Symbols Outlined ONLY
Remove all `lucide-react` imports. Use:
```tsx
<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
```
See `docs/frontend_mobile_guide.md` for the full Lucide → Material Symbol mapping table.

### Buttons — native elements only, no neon-button
Remove all `import { Button } from '@/components/ui/neon-button'`. Replace with:
```tsx
// Primary (green)
<Link to="..." style={{ background: 'hsl(var(--primary))', color: '#fff', padding: '12px 24px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, borderRadius: 4, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>...</Link>

// Accent (gold)
style={{ background: 'hsl(var(--accent))', color: '#000', ... }}

// Outline
style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--on-surface))', ... }}
```

### Typography
- Font: `'Public Sans', sans-serif` — weights 700 (body), 800 (labels/headings), 900 (hero)
- No Tailwind font utilities (`font-meta`, `font-body-md`) in new code — use inline `fontFamily`
- Fluid headings: `fontSize: 'clamp(32px, 8vw, 64px)'` for hero, `clamp(26px, 5vw, 44px)` for sections

### Layout classes (defined in `src/index.css`)
- `.desktop-only` / `.mobile-only` — 768px toggle via `display: none !important`
- `.footer-grid` — footer 3→2→1 col breakpoints (has `!important` overrides)
- `.profile-page`, `.profile-cols`, `.profile-form-grid`, `.profile-form-full` — member settings page
- Admin layout only: `.main`, `.ph`, `.panel`, `.crumbs`, `.btn`, `.btn-primary`, `.btn-outline`, `.btn-dest`, `.btn-sm`, `.kpis`, `.kpi`, `.pill`

---

## Completed Work (do not redo)

### Components
| File | What was done |
| :--- | :--- |
| `src/components/Navbar.tsx` | Full rewrite — removed lucide/neon-button, custom state dropdown, `desktop-only`/`mobile-only` drawer |
| `src/components/Footer.tsx` | Full rewrite — removed lucide/neon-button, `footer-grid` CSS class, mobile dividers via `> * + *` |
| `src/components/layouts/AdminLayout.tsx` | Topbar rebuilt — removed shadcn DropdownMenu/lucide, custom `isUserMenuOpen` state dropdown, fixed `pt-3` alignment bug |

### Pages
| File | What was done |
| :--- | :--- |
| `src/pages/Home.tsx` | Full rewrite — mobile responsiveness, fluid `clamp()` headings, roadmap flex-row mobile layout, roadmap now fetches from `adminService.getMilestones()`, new Chapters Near You section, new Open Polls section, "Movement at a Glance" tag stacked below heading, roadmap title forced `<br />` between "Where we are," and "what's next.", blog/CTA divider fixed |
| `src/pages/ProfileSettings.tsx` | Full rewrite — removed lucide/neon-button/shadcn except Switch, `.profile-page`/`.profile-cols` layout, `SelIcon` helper, inline label/input style constants |

### CSS additions (`src/index.css`)
- Profile page grid classes (`.profile-page`, `.profile-cols`, `.profile-form-grid`, `.profile-form-full`)
- Footer grid with mobile dividers (`.footer-grid` with `!important` breakpoints and `> * + *` border-top)

---

## Homepage Section Order (as of handover)

1. Hero (dark bg, mouse-parallax logo)
2. Ghana vs Diaspora (two join paths)
3. Foundation Pillars (3 pillars on dark bg)
4. Movement at a Glance (live stats, animated counters)
5. Movement Roadmap (4 milestones — **fetched from `adminService.getMilestones()`**)
6. Chapters Near You (3 chapters — fetched from `adminService.getChapters()`)
7. Open Polls (active polls — fetched from `adminService.getPolls()`, hidden if none active)
8. Latest Updates (3 blog posts)
9. CTA (dark card with register/get-involved CTAs)

---

## Admin Roadmap Management

The roadmap on the homepage is now fully dynamic. Admin manages it at `/admin/roadmap` (`src/pages/admin/Roadmap.tsx`).

**Milestone type** (`src/types/admin.ts`):
```ts
interface Milestone {
  id: string
  title: string
  description: string
  target_date: string          // ISO date string
  status: 'Completed' | 'In Progress' | 'Upcoming'
  category: string
  importance_level: 'Normal' | 'High' | 'Critical'
  target_members?: number
}
```

**Homepage mapping:**
- Milestones sorted by `target_date` ascending, first 4 shown
- `status === 'Completed'` → filled dot with check
- `status === 'In Progress'` → pulsing dot, year label gets `· Now` suffix
- Colors assigned by index: 0=red, 1=gold, 2=charcoal, 3=green
- Falls back to hardcoded 2024/2025/2026/2028 data if no milestones in DB

---

## New UI Kit Sections (from `docs/The Base Movement Design System-handoff/...civic/index.html`)

The UI kit defines three sections not previously on the homepage. They are now all implemented:

| UI Kit section | Placed at | Data source |
| :--- | :--- | :--- |
| Chapters near you | After roadmap, before polls | `adminService.getChapters().slice(0,3)` |
| Open polls | After chapters, before blog | `adminService.getPolls().filter(active).slice(0,2)` — hidden if no active polls |
| Updates from the movement | Already existed as "Latest updates" | `adminService.getBlogPosts().slice(0,3)` |

---

## Pending Work — Frontend Mobile Responsiveness

The following public pages still use Tailwind colour classes, Lucide icons, and neon-button. They need to be migrated to the design system and made mobile-responsive. See `docs/frontend_mobile_guide.md` for the complete guide.

**Priority 1 (high traffic):**
- `src/pages/Blog.tsx` — Lucide: `ArrowRight`, `Loader2`, `Newspaper`
- `src/pages/BlogPost.tsx` — check imports
- `src/pages/OurAgenda.tsx` — Lucide: `GraduationCap`, `Building2`, `Factory`, `Construction`, `Landmark`, `Sprout`, `ArrowRight`
- `src/pages/Contact.tsx` — Lucide: `Mail`, `Phone`, `MapPin`, `Send`
- `src/pages/Donate.tsx` + sub-components in `src/pages/donate/components/` — Lucide: `Heart`, `Check`

**Priority 2:**
- `src/pages/Impact.tsx`
- `src/pages/Chapters.tsx`
- `src/pages/ChapterDetails.tsx`
- `src/pages/Members.tsx`
- `src/pages/Press.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`

**Priority 3 (store):**
- `src/pages/Store.tsx`
- `src/pages/ProductDetails.tsx`
- `src/pages/Cart.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/Polls.tsx`

For each page the checklist is in `docs/frontend_mobile_guide.md` § "Checklist for Each Page".

---

## Key Service Methods Used on Homepage

```ts
adminService.getPublicStats()        // { members, chapters, regions, diaspora, ...deltas }
adminService.getBlogPosts()          // BlogPost[] — filter to slice(0,3)
adminService.getMilestones()         // Milestone[] — sort by target_date, slice(0,4)
adminService.getChapters()           // Chapter[]  — slice(0,3)
adminService.getPolls()              // Poll[]     — filter status==='Active', slice(0,2)
```

All calls use `.catch(() => {})` — graceful degradation on network failure.

---

## Branch & Repo

- Branch: `main`
- Remote: GitHub (Styphler17)
- All work above is committed and pushed to `main`
