# Typography System Reference

Documents the actual typography architecture in `src/index.css` and `tailwind.config.js`. Use this before making typographic changes.

---

## Font scale variables

Two CSS variables control all heading and body sizes. Both are set on `:root` and updated by `BrandingContext` from Admin → Settings.

| Variable               | Default | 1280px+ |
| ---------------------- | ------- | ------- |
| `--font-scale`         | `1`     | `1.1`   |
| `--font-heading-scale` | `1`     | `1.15`  |

Heading sizes (`--h1-size` through `--h6-size`) and body text (`--p-size`) are defined as `clamp()` expressions in `:root` that multiply against these variables. Changing either variable in the Admin Command Center proportionally scales the affected tier.

---

## Font size tokens

Fixed-size utility tokens (not responsive, not variable-multiplied):

```
--fs-micro: 12px
--fs-tiny:  13px
--fs-xs:    14px
--fs-sm:    16px
--fs-base:  18px
--fs-lg:    22px
--fs-xl:    28px
--fs-2xl:   36px
--fs-3xl:   48px
--fs-4xl:   64px
```

These are mapped in `tailwind.config.js` as `text-micro`, `text-tiny`, `text-xs` … `text-4xl`. The heading sizes (`text-h1` through `text-h3`) map to `var(--h1-size)` etc., which resolve to the clamp expressions above.

---

## Font weight variables

All nine weight steps are defined as CSS variables and mapped into Tailwind's `fontWeight`:

```
--font-weight-thin:       100   → font-thin
--font-weight-extralight: 200   → font-extralight
--font-weight-light:      300   → font-light
--font-weight-normal:     400   → font-normal
--font-weight-medium:     500   → font-medium
--font-weight-semibold:   600   → font-semibold
--font-weight-bold:       700   → font-bold
--font-weight-extrabold:  800   → font-extrabold
--font-weight-black:      900   → font-black
```

Using `font-bold` in a Tailwind class resolves to `var(--font-weight-bold, 700)`, not a hardcoded value.

### Conventions by surface

| Surface                      | Typical weight                                           |
| ---------------------------- | -------------------------------------------------------- |
| Admin labels (10px all-caps) | `var(--font-weight-medium, 500)`                         |
| Admin body / table cells     | `var(--font-weight-medium, 500)`                         |
| Admin panel titles / h3      | `var(--font-weight-medium, 500)` (no-bold directive)     |
| Public headings (h1/h2)      | `var(--font-weight-medium, 500)` — see no-bold directive |
| Public body copy             | `var(--font-weight-normal, 400)`                         |
| KPI stat numbers             | `var(--font-weight-medium, 500)`                         |

The no-bold design directive means weights 700+ are reserved for logos and decorative brand elements — not for body, labels, or headings.

---

## Letter spacing and case

### Admin pages

Admin label text uses 10px all-caps with modest tracking. This is intentional and correct:

```tsx
style={{
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
}}
```

Do not remove `uppercase` or `letterSpacing` from admin label elements — they are part of the design system.

### Public / marketing pages

Sections like `StatsSection`, `RoadmapSection`, and `PollsSection` use `tracking-wider` or `tracking-widest` for section eyebrow labels and decorative counters. These are deliberate choices for the marketing surface and should not be uniformly purged.

---

## BrandLine component

All movement branding line elements must use the centralized component:

```tsx
import { BrandLine } from '@/components/ui/BrandLine'
```

Hardcoded `flex h-1 w-24` sequences should be replaced with `<BrandLine />`. The component's dimensions are controlled in `index.css` under `.brand-line`.

---

## Inline styles vs Tailwind classes

**Admin and dashboard pages** use inline styles as the primary convention (see `CLAUDE.md`). Font sizes, weights, and colors should be set with CSS variable references:

```tsx
style={{
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 12,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
}}
```

**Public / marketing pages** may use Tailwind typography classes (`text-h1`, `text-sm`, `font-medium`, etc.) since those map to the same CSS variables.

Hardcoding arbitrary pixel or rem values for font sizes is discouraged but not always avoidable at the component level — use tokens where possible.

---

## What `!important` is still used for

`index.css` retains `!important` in mobile responsive overrides (grid collapse, padding resets, Material Symbols font-family). This is not a defect — it is necessary to override Tailwind utilities at the responsive breakpoint. Do not remove these without verifying the responsive layouts still function.
