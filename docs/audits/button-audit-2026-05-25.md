# Button System Audit

**Audit Date:** 2026-05-25
**Status:** All primary CTAs migrated ✅ — Audit complete

---

## Official Button Systems

The platform defines two button systems, both driven by CSS variables set by `BrandingContext`
so the admin Settings → Button Customizer tab applies globally without a page reload.

### System 1 — `.btn` CSS Classes (Admin/Dashboard/Store/Public)

Defined in `src/index.css`. Use these classes across admin, dashboard, store, and public pages.

| Class               | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `.btn`              | Base — border, padding, font, radius via `var(--button-radius)` |
| `.btn-primary`      | Green filled (`hsl(var(--primary))`)                            |
| `.btn-outline`      | Bordered, transparent fill                                      |
| `.btn-dest`         | Destructive red (`hsl(var(--destructive))`)                     |
| `.btn-accent`       | Gold filled (`hsl(var(--accent))`)                              |
| `.btn-ghost`        | Transparent, no border                                          |
| `.btn-outline-dest` | Transparent with red border                                     |
| `.btn-sm`           | Small size modifier (30px height)                               |

### System 2 — `NeonButton` Component (Home/Marketing sections)

Defined at `src/components/buttons/ui/neon-button.tsx`. CVA component with inline
`style={{ borderRadius: 'var(--button-radius)', fontWeight: 'var(--button-font-weight)' }}`.
Used exclusively in home page marketing sections via wrapper components.

| Wrapper             | Variant       | Used in                                                              |
| ------------------- | ------------- | -------------------------------------------------------------------- |
| `ButtonPrimary`     | `primary`     | `ChaptersSection`, `LatestUpdatesSection`, `PlatformsSection` (Home) |
| `ButtonAccent`      | `accent`      | `PlatformsSection` (Home)                                            |
| `ButtonDestructive` | `destructive` | Utilities                                                            |
| `ButtonActiveTab`   | `active-tab`  | Tab UIs                                                              |
| `ButtonInactiveTab` | `default`     | Tab UIs                                                              |

### CSS Variables (both systems share)

| Variable                   | Source setting                           |
| -------------------------- | ---------------------------------------- |
| `--button-radius`          | `settings.button_border_radius`          |
| `--button-font-weight`     | `settings.button_font_weight`            |
| `--primary-foreground`     | `settings.button_primary_text_color`     |
| `--accent-foreground`      | `settings.button_gold_text_color`        |
| `--destructive-foreground` | `settings.button_destructive_text_color` |

---

## Compliance Summary

| Surface                                         | System                       | Status                                                                    |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| Admin panel (`/admin/*`)                        | `.btn` classes               | ✅ Compliant — 100+ files, consistent                                     |
| Dashboard pages (`/dashboard/*`)                | `.btn` classes               | ✅ Compliant — chapters, donate, members, etc.                            |
| Store pages (`/store/*`)                        | `.btn` classes               | ✅ Migrated — primary CTAs on `.btn` system                               |
| Public pages (`/`, `/officers`, `/polls`, etc.) | `.btn` + NeonButton wrappers | ✅ Migrated — Contact submit on `.btn`; Home CTAs via NeonButton wrappers |
| Shared components                               | `.btn` classes               | ✅ Action buttons migrated; chrome/icon buttons intentionally raw         |
| `NeonButton` component (via wrappers)           | n/a                          | ✅ Active — used in Home sections via wrappers                            |

---

## Migration Log (2026-05-25)

### Store section

All primary action CTAs migrated from raw Tailwind to `.btn` classes:

| File                                                   | Buttons migrated                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/ProductCard.tsx`                       | Quick Add overlay (`btn-primary`), Add card button (`btn-primary btn-sm`)                                                      |
| `src/pages/product-details/components/ProductInfo.tsx` | Add to bag (`btn-primary`), regional Check (`btn-primary btn-sm`)                                                              |
| `src/pages/Cart.tsx`                                   | Proceed to Checkout (`btn-primary`), Remove item (`btn-outline-dest btn-sm`), Explore Store empty state (`btn-primary`)        |
| `src/pages/Checkout.tsx`                               | Complete Purchase submit (`btn-primary`)                                                                                       |
| `src/pages/Wishlist.tsx`                               | Add to Cart (`btn-primary`), Details link (`btn-outline`), Explore Store empty state (`btn-primary`)                           |
| `src/pages/OrderSummary.tsx`                           | Back to store (`btn-primary`), Print invoice (`btn-outline`), Share support (`btn-outline`), Back to dashboard (`btn-primary`) |
| `src/pages/Store.tsx`                                  | Checkout securely desktop sidebar (`btn-accent`), mobile drawer (`btn-accent`)                                                 |

### Public pages

| File                                           | Change                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/pages/contact/components/ContactForm.tsx` | Submit → `btn btn-primary w-full`                                                     |
| `src/pages/Home.tsx` sections                  | Already compliant — all CTAs via `ButtonPrimary` / `ButtonAccent` NeonButton wrappers |
| `src/pages/Polls.tsx`                          | No CTA buttons — poll options are selection widgets (kept raw by design)              |
| `src/pages/Officers.tsx`                       | Display-only page — no action buttons                                                 |

---

## Intentionally Raw (not `.btn`)

These button patterns are appropriate to leave as raw Tailwind — they are not semantic action CTAs and `.btn` would be inappropriate:

| Pattern                             | Location                   | Reason                                             |
| ----------------------------------- | -------------------------- | -------------------------------------------------- |
| Qty stepper +/−                     | Cart, Store, ProductInfo   | Icon-only inline stepper                           |
| Wishlist/share icon overlays        | ProductCard                | Icon-only floating overlay                         |
| Close drawer button                 | Store mobile cart          | Icon-only chrome                                   |
| Category filter pills               | `store/CategoryFilter.tsx` | `rounded-full` pill style incompatible with `.btn` |
| Mobile cart bar                     | `Store.tsx`                | Full-height custom dark bar, not an action button  |
| Pagination prev/next/page           | `store/Pagination.tsx`     | Specialized navigation chrome                      |
| Poll option buttons                 | `OpinionPollCard.tsx`      | Selection widget, not a CTA                        |
| Nav icon buttons                    | `Navbar.tsx`               | Layout chrome                                      |
| Sidebar toggle/notification buttons | `DashboardLayout.tsx`      | Layout chrome                                      |
| Size guide text link                | `ProductInfo.tsx`          | Text link style, not a button                      |
| Size/color selector buttons         | `ProductInfo.tsx`          | Selection widget                                   |

---

## `ErrorBoundary.tsx` — Reference

The canonical example of correct `.btn` usage in a shared component:

```tsx
<button className="btn btn-primary">Try Again</button>
<button className="btn btn-outline">Go Home</button>
```
