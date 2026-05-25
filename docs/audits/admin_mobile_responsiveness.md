## Context

This is a React + TypeScript + Vite project called **The Base Movement** admin panel. All admin pages are already built and working on desktop. Your job is to make specific pages **fully mobile-responsive** without changing any colors, fonts, component logic, or desktop layouts.

---

## Design System Rules — DO NOT change these

**Fonts:** `'Public Sans'` (headings, labels, UI) and `'Work Sans'` (body). Never substitute.

**Colors:** All colors use CSS variables — `hsl(var(--primary))`, `hsl(var(--on-surface))`, `hsl(var(--border))`, `hsl(var(--accent))`, `hsl(var(--destructive))`, `hsl(var(--on-surface-muted))`, `hsl(var(--container-low))`. Never hardcode color values.

**Core CSS classes** (defined in `src/index.css`):

```
.main          — page wrapper, padding 24px 28px
.top           — flex row: title left, actions right
.kpis          — 4-col grid of KPI cards (collapses to 2-col at ≤768px automatically)
.kpi           — individual KPI card with .l (label), .v (value), .d (detail) children
.panel         — white card with border-radius + border
.ph            — panel header: flex row, title left (h3), meta right
.ph2           — same as .ph, slightly different padding
.btn           — base button
.btn-primary   — green primary button
.btn-dest      — red destructive button
.btn-outline   — outlined button
.btn-ghost     — ghost button
.btn-sm        — small size modifier
.pill          — status badge
.pill-ok       — green pill
.pill-warn     — amber pill
.pill-err      — red pill
.pill-mute     — grey pill
.twocol        — 2-col grid (collapses to 1-col at ≤768px)
.panel-twocol  — 2-col panel grid (collapses at ≤900px)
.crumbs        — breadcrumb text above page title
.actions       — flex row of header action buttons
```

---

## Responsive Strategy — follow this exactly

### Step 1 — Global breakpoint rules (already in `src/index.css`)

```css
/* Visibility toggles */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .main {
    padding: 14px 14px 60px;
  }
  .top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .top .actions {
    flex-wrap: wrap;
  }
  .kpis {
    grid-template-columns: repeat(2, 1fr);
  }
  .twocol {
    grid-template-columns: 1fr;
  }
  .pagination-bar {
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
@media (min-width: 769px) {
  .mobile-only {
    display: none !important;
  }
}
```

Add new `@media (max-width: 768px)` rules to `src/index.css` for any page-specific overrides. **Always add them inside the existing `@media (max-width: 768px)` block, never create new duplicate blocks.**

Use `!important` only when overriding inline styles that cannot be removed from the JSX (e.g. a grid with `style={{ gridTemplateColumns: '...' }}`).

### Step 2 — Tables → Cards on mobile

For any table that would require horizontal scrolling on mobile, do this:

**A) Wrap the table:**

```tsx
<div className="desktop-only" style={{ overflowX: 'auto' }}>
  <table>...</table>
</div>
```

**B) Add a mobile card list immediately after:**

```tsx
<div className="mobile-only">
  {items.map(item => (
    <MobileCardComponent key={item.id} ... />
  ))}
</div>
```

**C) Create the card component** in `src/components/admin/XxxListCard.tsx`. Standard card layout:

```
Row 1: [avatar/icon 38-42px] [main title + subtitle] [status pill, flex-shrink:0]
Row 2: [icon 13px] meta text (region, phone, etc.)
Row 3: [action buttons]
```

Card wrapper styles:

```tsx
style={{
  padding: '13px 16px',
  borderBottom: '1px solid hsl(var(--border))',
  background: isActive ? 'rgba(0,107,63,.04)' : '#fff',
  boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
}}
```

Text styles:

- Title: `fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))'`
- Subtitle/meta: `fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5-12, color: 'hsl(var(--on-surface-muted))'`
- Icons: `<span className="material-symbols-outlined" style={{ fontSize: 13 }}>icon_name</span>` (uses Google Material Symbols, already loaded)

### Step 3 — Two-column splits

Any `display: grid; gridTemplateColumns: 'X Y'` inline style that creates a 2-col layout:

1. Add a named CSS class to that element (e.g. `className="my-feature-split"`)
2. In `src/index.css`, define the class outside media queries:
   ```css
   .my-feature-split {
     display: grid;
     grid-template-columns: X Y;
     gap: ...;
   }
   ```
3. Override inside the existing `@media (max-width: 768px)` block:
   ```css
   .my-feature-split {
     grid-template-columns: 1fr !important;
   }
   ```

### Step 4 — Detail/review panels

Dark header panels (dark gradient background with member/item identity info) use this pattern for mobile:

```css
/* In @media (max-width: 768px) */
.my-detail-header {
  padding: 18px 16px !important;
}
.my-detail-header h2 {
  font-size: 22px !important;
}
.my-detail-identity-row {
  flex-wrap: wrap;
  gap: 12px !important;
}
.my-detail-actions {
  width: 100%;
  order: 2;
}
```

For pills/tags inside a flex identity row that sit inside a `flex: 1` info column (leaving blank space below the avatar on mobile), duplicate them:

```tsx
{
  /* Desktop only — inside info column */
}
;<div className="desktop-only" style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
  {pills}
</div>

{
  /* Mobile only — full-width row after the info column */
}
;<div
  className="mobile-only"
  style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', order: 1 }}
>
  {pills}
</div>
```

### Step 5 — Filter bars and search inputs

Never put category filter pills + search input in the same single-line flex row on mobile. Instead, split into two stacked rows:

```tsx
{/* Title row */}
<div className="ph">
  <h3>Section title</h3>
  <span className="meta">count</span>
</div>

{/* Filter controls — always stacked column */}
<div style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 8, background: 'hsl(var(--container-low))' }}>
  {/* Pills — horizontally scrollable */}
  <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
    {filterOptions.map(opt => <button key={opt}>...</button>)}
  </div>
  {/* Search — full width */}
  <div style={{ position: 'relative' }}>
    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>search</span>
    <input style={{ width: '100%', height: 34, paddingLeft: 30, boxSizing: 'border-box', ... }} />
  </div>
</div>
```

### Step 6 — Pagination bars

Add `className="pagination-bar"` to any pagination row — CSS already handles wrapping.

---

## What NOT to do

- Do not change any color values, font families, or font weights
- Do not remove any functionality or change component logic
- Do not use Tailwind responsive classes (`sm:`, `md:`, `lg:`) — this project uses named CSS classes + `@media` in `src/index.css`
- Do not use `display: none` inline — always use the `.desktop-only` / `.mobile-only` CSS classes
- Do not create new `@media` blocks in `index.css` — append to the existing ones
- Do not touch `ProductFormDialog.tsx` or any modal that uses shadcn `Dialog` — those are fine
- Do not restructure JSX logic, rename variables, or add features

---

## Pages already done (skip these)

- `WarRoomCommand.tsx`
- `Members.tsx` (member directory)
- `MemberVerification.tsx` (KYC queue)
- `DonationVerification.tsx`
- `Dashboard.tsx`
- `Store.tsx` + all sub-components

---

## Reference files to read before starting

1. `src/index.css` — all CSS classes and existing media queries
2. `src/components/admin/MemberListCard.tsx` — canonical example of a mobile card component
3. `src/components/admin/VerificationListCard.tsx` — another card example (no action buttons, tappable row)
4. `src/components/admin/DonationListCard.tsx` — card with amount + method badge
5. `src/pages/admin/Members.tsx` — reference for: bulk action bar, desktop-only table, mobile-only cards, detail panel header, pills duplication for mobile
6. `src/pages/admin/DonationVerification.tsx` — reference for split-view mobile collapse

---

## How to approach each new page

1. Open the page in a mobile browser (or DevTools at 390px width)
2. Identify what breaks: overflowing tables, cramped flex rows, fixed-width elements, multi-col grids that need to collapse
3. For tables → follow Step 2 (wrap + card component)
4. For grids → follow Step 3 (named class + CSS override)
5. For detail panels → follow Step 4
6. For filter bars → follow Step 5
7. Run `npx tsc --noEmit` to confirm no TypeScript errors before finishing
