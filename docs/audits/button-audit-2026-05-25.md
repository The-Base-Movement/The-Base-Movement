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

---

## Mobile Button Layout Standard (established 2026-05-27)

### The Rule

On mobile, buttons inside an `.actions` group **grow to fill their row, never shrink below content width, and never break text**. A button alone on a row takes full width. Two buttons on the same row share it equally from their natural content widths.

This is enforced globally in `src/index.css` inside `@media (max-width: 768px)`:

```css
/* Buttons grow to fill row, never shrink below content width */
.actions .btn,
.actions label.btn {
  flex-grow: 1 !important;
  flex-shrink: 0 !important;
  flex-basis: auto !important;
}

/* Wrapper divs inside actions also grow and wrap */
.actions > div {
  flex-grow: 1 !important;
  flex-wrap: wrap !important;
}

/* Admin page header actions take full available width */
.admin-page-header .actions {
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
```

### How Buttons Wrap

With `flex-wrap: wrap` on `.actions` and `flex-grow: 1` on each `.btn`:

| Buttons in group                     | Mobile layout                                        |
| ------------------------------------ | ---------------------------------------------------- |
| 1 button                             | Full width                                           |
| 2 buttons that fit on one row        | Each takes ~50% — same row                           |
| 2 buttons that are too wide to share | Each wraps to its own full-width row                 |
| 3 buttons                            | First 2 share row 1 (or wrap); 3rd fills its own row |

The wrapping is **content-driven** — buttons never have text forced to break. If "Generate Audit" + "Direct Appoint" would cause text to break at a given size, they wrap to separate rows and each fills the full width.

### Using `btn-sm` in Admin Page Headers

Admin page header actions **must use `btn-sm`** so that two buttons fit on the same row on mobile (≥320px viewports). Full-size buttons are too wide and will each wrap to their own row.

```tsx
// ✅ Correct — btn-sm fits 2 per row on mobile
actions={
  <>
    <button className="btn btn-outline btn-sm">Generate Audit</button>
    <button className="btn btn-primary btn-sm">Direct Appoint</button>
  </>
}

// ❌ Wrong — full-size buttons each wrap to their own row on mobile
actions={
  <>
    <button className="btn btn-outline">Generate Audit</button>
    <button className="btn btn-primary">Direct Appoint</button>
  </>
}
```

### Fragment vs Wrapper `<div>`

Buttons in `actions={}` must be **direct children of the `.actions` div** to receive the `flex-grow` rule. Use a `<>` fragment — never a wrapper `<div>` — unless you have intentional grouping.

```tsx
// ✅ Correct — buttons are direct children of .actions
actions={
  <>
    <button className="btn btn-outline btn-sm">Export</button>
    <button className="btn btn-primary btn-sm">Add member</button>
  </>
}

// ❌ Wrong — wrapper div blocks the flex-grow rule
actions={
  <div style={{ display: 'flex', gap: 10 }}>
    <button className="btn btn-outline btn-sm">Export</button>
    <button className="btn btn-primary btn-sm">Add member</button>
  </div>
}
```

**Exception:** A wrapper `<div>` is acceptable when there is intentional column stacking (e.g. `SentimentHeader` stacks a score widget above two buttons). In that case the wrapper must have `flex-wrap: wrap` so its inner buttons still follow the grow rule.

### Button Labels on Mobile

Keep button labels short. Long labels cause buttons to wrap to their own rows even at `btn-sm` size:

| ❌ Too long             | ✅ Use instead |
| ----------------------- | -------------- |
| Confirm Appointment     | Confirm        |
| Export CSV Report       | Export         |
| Run AI Analysis         | Run Analysis   |
| Generate Purchase Order | Generate PO    |

The goal: 2 action buttons should always share one row on a 375px screen at `btn-sm` size.

### Mobile Card Pattern (Tables → Cards)

Data tables with more than 3 columns break on mobile. The correct pattern is:

- Wrap the table in `<div className="desktop-only">` — hidden on mobile
- Add a `<div className="mobile-only">` card list below it

Each card shows only the essential columns (name, primary info, status pill, action button). Secondary columns (phone, geography, ID) are omitted from cards.

```tsx
{
  /* Desktop */
}
;<div className="desktop-only" style={{ overflowX: 'auto' }}>
  <table>...</table>
</div>

{
  /* Mobile cards */
}
;<div className="mobile-only">
  {items.map((item) => (
    <div
      key={item.id}
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* avatar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ color: 'hsl(var(--on-surface-muted))' }}>{item.subtitle}</p>
      </div>
      <button className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
        View
      </button>
    </div>
  ))}
</div>
```

CSS utilities:

- `.desktop-only` — `display: none !important` at `max-width: 768px`
- `.mobile-only` — `display: none !important` at `min-width: 769px`
