# Button System Audit

**Audit Date:** 2026-05-25
**Status:** Store section migrated ✅ — Public page CTAs migrated ✅ — Audit complete

---

## Official Button Systems

The platform defines two button systems, both driven by CSS variables set by `BrandingContext`
so the admin Settings → Button Customizer tab applies globally without a page reload.

### System 1 — `.btn` CSS Classes (Admin/Dashboard)

Defined in `src/index.css`. Use these classes in admin and dashboard pages.

| Class          | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `.btn`         | Base — border, padding, font, radius via `var(--button-radius)` |
| `.btn-primary` | Green filled (`hsl(var(--primary))`)                            |
| `.btn-outline` | Bordered, transparent fill                                      |
| `.btn-dest`    | Destructive red (`hsl(var(--destructive))`)                     |
| `.btn-sm`      | Small size modifier                                             |

### System 2 — `NeonButton` Component (Public)

Defined at `src/components/buttons/ui/neon-button.tsx`. CVA component with inline
`style={{ borderRadius: 'var(--button-radius)', fontWeight: 'var(--button-font-weight)' }}`.
Intended for all public-facing (`PublicLayout`) pages.

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
| Shared components                               | Mixed                        | ⚠️ Partially compliant                                                    |
| `NeonButton` component (via wrappers)           | n/a                          | ✅ Active — used in Home sections via wrappers                            |

---

## Store Pages — Detailed Findings

All 9 store-related files use raw `<button>` / `<Link>` / `<a>` elements with Tailwind classes.
Zero `.btn` or `NeonButton` usage detected.

### `src/pages/Store.tsx`

| Line | Element                      | Issue                                               |
| ---- | ---------------------------- | --------------------------------------------------- |
| ~108 | `<button>` qty decrease      | Raw, Tailwind only                                  |
| ~124 | `<button>` qty increase      | Raw, Tailwind only                                  |
| ~145 | `<button>` remove from cart  | Raw, Tailwind only                                  |
| ~234 | `<Link>` to checkout         | `bg-accent text-white` — design color but no `.btn` |
| ~288 | `<button>` close cart drawer | Raw, Tailwind only                                  |

### `src/pages/ProductDetails.tsx`

| Line | Element                  | Issue                    |
| ---- | ------------------------ | ------------------------ |
| ~130 | `<Link>` back link       | Raw styled link          |
| ~175 | `<Link>` "Back to Store" | Raw, no `.btn`           |
| ~185 | `<Link>` Wishlist        | Raw, custom border/hover |
| ~204 | `<Link>` Add to Bag      | Raw, custom border/hover |

### `src/pages/Cart.tsx`

| Line | Element                  | Issue                                |
| ---- | ------------------------ | ------------------------------------ |
| ~70  | `<button>` qty decrease  | Raw, Tailwind only                   |
| ~85  | `<button>` remove item   | Raw, `hover:text-[var(--brand-red)]` |
| ~130 | `<Link>` to checkout     | `bg-primary text-white` — no `.btn`  |
| ~158 | `<Link>` empty state CTA | `bg-primary text-white` — no `.btn`  |

### `src/pages/Checkout.tsx`

| Line | Element                  | Issue                               |
| ---- | ------------------------ | ----------------------------------- |
| ~288 | `<button type="submit">` | `bg-primary text-white` — no `.btn` |

### `src/pages/Wishlist.tsx`

| Line | Element                         | Issue                               |
| ---- | ------------------------------- | ----------------------------------- |
| ~26  | `<Link>` "Back to store"        | Raw styled                          |
| ~43  | `<Link>` Add to Bag             | Raw, custom border                  |
| ~69  | `<button>` delete from wishlist | Raw, `hover:text-brand-red`         |
| ~91  | `<button>` "Add to Cart"        | `bg-primary text-white` — no `.btn` |
| ~95  | `<Link>` "Details"              | Raw, `border-stone-200`             |
| ~108 | `<Link>` "Explore Store"        | `bg-primary text-white` — no `.btn` |

### `src/pages/OrderSummary.tsx`

| Line | Element                      | Issue                                 |
| ---- | ---------------------------- | ------------------------------------- |
| ~65  | `<Link>` to /store           | `bg-stone-900 text-white` — no `.btn` |
| ~235 | `<button>` print invoice     | Raw, `border-stone-200`               |
| ~244 | `<button>` share             | Raw, `border-stone-200`               |
| ~257 | `<Link>` "Back to dashboard" | `bg-primary text-white` — no `.btn`   |
| ~273 | `<Link>` "Contact support"   | `text-brand-green font-bold`          |

### `src/pages/store/CategoryFilter.tsx`

| Line   | Element                          | Issue                                  |
| ------ | -------------------------------- | -------------------------------------- |
| ~19–31 | Five `<button>` category filters | Raw, `rounded-full border` — no `.btn` |

### `src/pages/store/Pagination.tsx`

| Lines      | Element                         | Issue              |
| ---------- | ------------------------------- | ------------------ |
| 14, 24, 37 | Three `<button>` prev/next/page | Raw, Tailwind only |

### `src/pages/store/ProductGrid.tsx`

No `<button>` elements. Renders `<ProductCard>` components — see below.

---

## Shared Components — Findings

### `src/components/ProductCard.tsx` ❌

| Line | Element                    | Issue                                             |
| ---- | -------------------------- | ------------------------------------------------- |
| ~111 | `<button>` wishlist toggle | Raw, `w-10 h-10 bg-white shadow-md`, no `.btn`    |
| ~129 | `<button>` quick-add       | Raw, `w-10 h-10 bg-white shadow-md`, no `.btn`    |
| ~141 | `<button>` "Add to Cart"   | `bg-primary text-white` — no `.btn`               |
| ~204 | `<button>` variant select  | `bg-primary text-white rounded-[4px]` — no `.btn` |

### `src/components/OpinionPollCard.tsx` ⚠️

- Lines ~124–165: Poll option buttons use raw Tailwind with CSS variable references (`var(--border)`, `var(--primary)`) — functionally correct but not using `.btn`.
- Line ~165: Vote submit button — raw, no `.btn`.

### `src/components/ErrorBoundary.tsx` ✅

- Line 91: `<button className="btn btn-primary">` — compliant
- Line 94: `<button className="btn btn-outline">` — compliant

### `src/components/Navbar.tsx` ⚠️

- Multiple `<button>` elements for mobile nav toggle, search, theme — raw utility buttons. Navigation-specific; `.btn` not appropriate here.

### `src/components/DashboardLayout.tsx` ⚠️

- Multiple icon `<button>` elements for sidebar toggles, notifications, etc. — layout chrome, not semantic action buttons. `.btn` not appropriate.

---

## Public Pages — Findings

All public pages under `PublicLayout` use raw `<button>` / `<Link>` elements with Tailwind classes. The `.btn` class system is absent from all public-facing routes. `NeonButton` was defined for this purpose but is never imported or rendered anywhere.

Notable non-compliant CTAs:

- `src/pages/Polls.tsx` — vote buttons, submit CTAs
- `src/pages/Officers.tsx` — currently no action CTAs (display-only)
- `src/pages/Contact.tsx` — form submit button
- `src/pages/Home.tsx` — hero CTA, section CTAs
- Register flow — all navigation/submit buttons (already documented in typography audit)

---

## `NeonButton` Status

`src/components/buttons/ui/neon-button.tsx` — **active, used via wrapper components**.

The component is exported as `Button` (not `NeonButton`) and consumed through thin wrapper components:

| Wrapper             | Variant       | Used in                                                              |
| ------------------- | ------------- | -------------------------------------------------------------------- |
| `ButtonPrimary`     | `primary`     | `ChaptersSection`, `LatestUpdatesSection`, `PlatformsSection` (Home) |
| `ButtonAccent`      | `accent`      | `PlatformsSection` (Home)                                            |
| `ButtonDestructive` | `destructive` | Utilities                                                            |
| `ButtonActiveTab`   | `active-tab`  | Tab UIs                                                              |
| `ButtonInactiveTab` | `default`     | Tab UIs                                                              |

Both systems read the same CSS variables (`--button-radius`, `--button-font-weight`) so admin Settings → Button Customizer applies to both.

---

## Migration Status (2026-05-25)

### Store section — ✅ MIGRATED

All primary action CTAs in the 9 store files have been migrated to `.btn` classes:

| File                                | Buttons migrated                                                           |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `ProductCard.tsx`                   | Quick Add overlay, Add bottom card button                                  |
| `ProductInfo.tsx` (product-details) | Add to bag, regional Check                                                 |
| `Cart.tsx`                          | Proceed to Checkout, Remove item, Explore Store (empty state)              |
| `Checkout.tsx`                      | Complete Purchase submit                                                   |
| `Wishlist.tsx`                      | Add to Cart, Details link, Explore Store (empty state)                     |
| `OrderSummary.tsx`                  | Back to store (not-found), Print invoice, Share support, Back to dashboard |
| `Store.tsx`                         | Checkout securely (desktop sidebar), Checkout securely (mobile drawer)     |

Intentionally left as raw (not appropriate for `.btn`):

- Quantity stepper +/− buttons (icon-only, inline stepper)
- Wishlist/share icon buttons on product cards (icon-only overlay)
- Category filter pills (`rounded-full` pill style incompatible)
- Mobile cart bar (full-height custom dark bar)

### Public page CTAs — ✅ MIGRATED

| File                                 | Change                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `contact/components/ContactForm.tsx` | Submit → `btn btn-primary w-full`                                                     |
| `Home.tsx` sections                  | Already compliant — all CTAs via `ButtonPrimary` / `ButtonAccent` NeonButton wrappers |
| `Polls.tsx`                          | No CTA buttons — poll option buttons are selection widgets (kept raw)                 |
| `Officers.tsx`                       | Display-only page — no action buttons                                                 |

### Priority 3 — Utility/icon buttons

Icon-only buttons in `Navbar`, `DashboardLayout`, `ProductCard` (wishlist/quickview icon) — layout chrome, not semantic action buttons. `.btn` not appropriate.
