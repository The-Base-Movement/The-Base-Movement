# Layout Architecture Reference

This guide documents the actual layout classes defined in `src/index.css` and the rules for using them in admin and dashboard pages. All admin/dashboard layout is done with these classes and inline styles — not Tailwind grid/flex utilities.

---

## Core page structure

```
.app-shell          grid: 220px sidebar | 1fr content  (admin shell)
.main               page content wrapper — padding, fade-in animation
.top                page header row — flex, justify-between, align-center
.top .actions       right-side action buttons — flex, gap: 8px
.actions            standalone action row — flex, align-center, gap: 12px, flex-wrap
```

### `.app-shell` — admin shell grid

`grid-template-columns: 220px 1fr` — the root grid of `AdminLayout`. Never use this directly in pages; it is injected by the layout component.

### `.main` — page content wrapper

The outer wrapper for all page content inside the admin/dashboard shell. Provides padding (`24px 28px 60px`), min-width 0, and the `mainFadeIn` entrance animation. Use as the root element of every admin page.

### `.top` — page header bar

Flex row with `justify-content: space-between`. Standard pattern:

```tsx
<div className="top">
  <h2>Page Title</h2>
  <div className="actions">
    <button className="btn btn-outline">Secondary</button>
    <button className="btn btn-primary">Primary</button>
  </div>
</div>
```

---

## Two-column layouts

```
.sidebar-main       grid: 280px sidebar | 1fr main content
.main-sidebar       grid: 1fr main content | 320px sidebar
.panel-twocol       grid: 1fr 1fr (collapses to 1 col on mobile)
```

Both `.sidebar-main` and `.main-sidebar` collapse to a single column on mobile (`≤768px`).

---

## KPI strips

```
.kpis               grid: repeat(4, 1fr), gap 12px
                    → mobile: horizontal scroll strip (flex, nowrap)
```

Always wrap KPI tiles in `.kpis`. See `docs/audits/kpi-stats-reference.md` for KPI tile patterns and the `--kpi-num-size` variable.

---

## Panel / card containers

```
.panel              card — white bg, border, border-radius 6px
.ph                 panel header — flex row, title + subtitle
.ph h3              panel title
.ph .meta           panel subtitle / metadata
```

Standard panel pattern:

```tsx
<div className="panel">
  <div className="ph">
    <div>
      <h3>Section Title</h3>
      <span className="meta">Subtitle or count</span>
    </div>
    <div className="actions">
      <button className="btn btn-sm btn-outline">Action</button>
    </div>
  </div>
  {/* content */}
</div>
```

---

## Specialized grids

```
.grid-stats         auto-fit grid: minmax(var(--grid-min-width, 240px), 1fr)
                    — use when column count should be content-driven
.war-room-main-grid 1 col mobile → 3 col desktop (1.4fr 0.8fr 1fr)
```

---

## Utility layout classes

```
.flex-columns       flex-col on mobile → flex-row on md+, gap-6
                    — use for two side-by-side cards that stack on mobile
.flow               vertical rhythm — applies margin-top: var(--flow-space, 1em)
                    to every child except the first
.desktop-only       display: none on mobile (≤768px)
.mobile-only        display: none on desktop (>768px)
```

`flex-columns` is appropriate for pairs of equal-weight panels that should stack on mobile. It is NOT the pattern for KPI strips (those use `.kpis`).

---

## When to use Grid vs Flex

Use the layout classes above rather than writing raw `display: grid` or `display: flex` in pages. When a class doesn't fit:

| Situation                         | Approach                                                         |
| --------------------------------- | ---------------------------------------------------------------- |
| Page-level two-column split       | `.sidebar-main` or `.main-sidebar`                               |
| KPI tiles in a strip              | `.kpis`                                                          |
| Auto-sizing stat cards            | `.grid-stats`                                                    |
| Two equal panels, mobile-stacking | `.flex-columns`                                                  |
| Custom column ratios              | Inline `style={{ display: 'grid', gridTemplateColumns: '...' }}` |
| Header bar with title + actions   | `.top` + `.actions`                                              |
| Vertical spacing between sections | `.flow` or explicit `marginBottom` on `.panel`                   |

Prefer the named classes — they carry built-in responsive collapse behaviour that raw inline styles don't.

---

## Responsive breakpoint

The single breakpoint for layout collapse is `768px`. Above it: multi-column. At or below it: `.sidebar-main`, `.main-sidebar`, `.panel-twocol`, and `.kpis` all collapse to single-column or scroll strips.
