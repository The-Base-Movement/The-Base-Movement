# States Component Audit — 2026-05-27

**Scope:** `src/components/states/` — all loading, empty, banner, and error-state primitives  
**Status:** COMPLETE — all components implemented; loading-state sweep across all pages done ✅

---

## Component Inventory

All components live at `src/components/states/` and are re-exported via `index.ts`.

```ts
import {
  Skeleton,
  EmptyState,
  Banner,
  Spinner,
  DotLoader,
  FullPageState,
} from '@/components/states'
```

---

### `Skeleton`

Content-shaped loading placeholder with shimmer animation driven by CSS vars.

| Variant     | Height | Radius          | Use case                   |
| ----------- | ------ | --------------- | -------------------------- |
| `text-sm`   | 11px   | `--radius-xs`   | Caption, label, meta text  |
| `text-md`   | 14px   | `--radius-xs`   | Body paragraph, table cell |
| `text-lg`   | 20px   | `--radius-xs`   | Subheading, large label    |
| `text-xl`   | 32px   | `--radius-xs`   | H1 / KPI stat number       |
| `avatar`    | 36px   | `50%`           | User avatar (circular)     |
| `avatar-sm` | 28px   | `50%`           | Small avatar in tables     |
| `img`       | 120px  | `--radius-md`   | Image / banner area        |
| `btn`       | 38px   | `--radius-sm`   | Button placeholder         |
| `chip`      | 24px   | `--radius-pill` | Status chip / tag          |

Props: `variant`, `width` (string or px number), `height` (override), `style` (CSSProperties).  
Circular variants auto-set `width = height`. All others default to `width: 100%`.

Shimmer is `animation: sk-shimmer 1.6s infinite linear` with `background-size: 800px 100%`, both defined in `src/index.css`. The gradient transitions between `var(--container-low)` and `var(--container-hi)`.

---

### `DotLoader`

Three bouncing dots (`dl-bounce` animation in `src/index.css`). Used for procedural waits where no content shape exists to mirror.

Props: `label` (optional caption below dots), `style`.  
Dots are 8px circles in `hsl(var(--primary))` with 0.15s staggered animation delays.

**Use `DotLoader` when:** the wait is procedural (AI init, identity verification, data sync). There is no page content to shape.

---

### `Spinner`

Single-ring CSS spinner. Used inline (button submit states, tiny inline indicators).

Props: `size` (`sm` = 20px, `md` = 36px), `variant` (`primary` / `dest` / `white`), `style`.

**Do not replace** `Spinner` or `animate-spin` when the element is a live-status dot (≤ 8px pulse circle) or an inline action-feedback indicator inside a submit button.

---

### `EmptyState`

Zero-items panel. Centered icon + title + body + optional action slot.

Props: `icon` (Material Symbol name), `title`, `body`, `action` (ReactNode), `bordered` (dashed border when `true`), `style`.  
Layout: white bg, `--radius-lg` border, 40px/24px padding, max-width 280px on body text.

---

### `Banner`

Inline alert strip. `role="alert"` for accessibility.

| Variant | Background | Use case                                      |
| ------- | ---------- | --------------------------------------------- |
| `error` | Red tint   | Validation failure, destructive action result |
| `warn`  | Gold tint  | Degraded state, caution                       |
| `info`  | Blue tint  | Informational notice                          |
| `ok`    | Green tint | Success confirmation                          |

Props: `variant`, `title`, `body` (optional sub-copy), `onDismiss` (shows ✕ button), `style`.

---

### `FullPageState`

Full-card error/maintenance screen. Embeds a large ghost watermark behind the content.

| Variant       | Watermark | Background                | Primary CTA class       |
| ------------- | --------- | ------------------------- | ----------------------- |
| `404`         | `404`     | White                     | `btn btn-primary`       |
| `403`         | `403`     | Charcoal (`--on-surface`) | `btn btn-accent`        |
| `maintenance` | `⚙`       | White                     | — (renders `DotLoader`) |

Props: `variant`, `title` (override), `body` (override), `primaryLabel` (override), `onPrimary` (override; defaults to `navigate('/dashboard')`).

---

## Decision Rule: Skeleton vs DotLoader

| Signal                                                    | Use                                                     |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `if (loading) return <...>` guards a full content block   | `Skeleton` — mirror the shape of the incoming content   |
| Full-page procedural wait (AI init, ID verify, data sync) | `DotLoader`                                             |
| Live-status indicator (small ≤8px pulse dot)              | Keep `animate-pulse` — intentional UI                   |
| Submit button in-flight state                             | Keep `animate-spin` on `Spinner` — intentional feedback |

---

## Loading-State Sweep — 2026-05-26 to 2026-05-27

All `animate-pulse` / `animate-spin` loading gates replaced. Zero remaining in page-level loading states (confirmed by grep post-sweep).

### Skeleton replacements

| File                                                         | Previous pattern                          | Replacement                                                                      |
| ------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `src/pages/admin/Dashboard.tsx`                              | 4× `animate-pulse h-48 bg-white` KPI divs | `Skeleton` KPI tile structure (`text-sm` label + `text-xl` value)                |
| `src/pages/admin/orders/OrdersKPIs.tsx`                      | `animate-pulse h-48 bg-white`             | `Skeleton` KPI tile structure                                                    |
| `src/pages/admin/orders/OrdersTable.tsx`                     | Spinner in loading block                  | 5× `Skeleton` table rows (`avatar-sm` + text columns + `chip`)                   |
| `src/pages/admin/donationverification/DonationsTable.tsx`    | Spinner in loading block                  | 6× `Skeleton` table rows (`avatar-sm` + text columns + `chip`)                   |
| `src/pages/admin/memberverification/VerificationQueue.tsx`   | Spinner in loading block                  | 5× `Skeleton` list rows (`avatar` + text columns + `chip`)                       |
| `src/pages/admin/leadershiphub/ChapterApplicationsTable.tsx` | `animate-pulse` div rows                  | `Skeleton` rows (`avatar-sm` + `text-sm`)                                        |
| `src/pages/admin/ChapterLeadHub.tsx`                         | 4× `animate-pulse` panel divs             | `Skeleton` KPI tile structure                                                    |
| `src/pages/ChapterHub.tsx`                                   | 4× `animate-pulse` panel divs             | `Skeleton` KPI tile structure                                                    |
| `src/pages/BlogPost.tsx`                                     | Full-page `animate-spin` icon             | Article-shaped skeleton (chip + `text-xl` + `text-md`×3 + `img` + `text-md`×5)   |
| `src/pages/home/LatestUpdatesSection.tsx`                    | 3× `animate-pulse` card divs              | `Skeleton` cards (`img` + `text-md` + `text-sm`)                                 |
| `src/pages/home/ChaptersSection.tsx`                         | `animate-pulse` chapter card divs         | `Skeleton` chapter card (banner `img` + `text-sm` + 3× `btn`)                    |
| `src/pages/store/ProductGrid.tsx`                            | `animate-pulse rounded-[6px]` squares     | 6× `Skeleton` product cards (`img` 1:1 + `text-md` + `text-sm`)                  |
| `src/pages/product-details/components/RelatedProducts.tsx`   | `animate-pulse` aspect-ratio divs         | 4× `Skeleton` product cards (`img` 4:5 + `text-md` + `text-sm`)                  |
| `src/pages/Wishlist.tsx`                                     | `animate-pulse` aspect-ratio divs         | `Skeleton` product cards (`img` 3:4 + `text-md` + `text-sm`)                     |
| `src/pages/ProductDetails.tsx`                               | `animate-pulse space-y-8` block           | 2-col product skeleton (`text-sm` breadcrumb + `img` 1:1 + 5× `text-md` + `btn`) |
| `src/pages/OrderSummary.tsx`                                 | Full-page spinner                         | Content-shaped skeleton (`text-xl` + `text-sm` + `img` 200px + 4× `text-md`)     |
| `src/pages/Press.tsx`                                        | Inline spinner                            | 3× `Skeleton` press cards (`text-sm` + `text-lg` + `text-md`×2 + `text-sm`)      |

### DotLoader replacements

| File                                        | Previous pattern              | Label                                  |
| ------------------------------------------- | ----------------------------- | -------------------------------------- |
| `src/pages/admin/StrategicPriorities.tsx`   | `sync animate-spin` full-page | `"Synchronizing tactical priorities…"` |
| `src/pages/admin/trash/TrashContent.tsx`    | CSS custom spinner            | `"Loading…"`                           |
| `src/pages/admin/RallyCommand.tsx`          | Full-page spinner             | `"Initializing mobilization command…"` |
| `src/pages/admin/SentimentIntelligence.tsx` | Full-page spinner             | `"Initializing AI intelligence core…"` |
| `src/pages/VerifyID.tsx`                    | CSS rotating-border spinner   | `"Verifying identity…"`                |

---

## Border Radius — Co-migration (Donate on Touch)

Three donation-flow files were edited for other reasons and had their hardcoded radius values migrated at the same time:

| File                                                             | Migrated values                                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/admin/donationverification/DonationsTable.tsx`        | `borderRadius: 3` on method badge → `var(--radius-xs)`                                                                                                     |
| `src/pages/admin/donationverification/DonationDetailSidebar.tsx` | `borderRadius: 6` on aside → `var(--radius-md)`, `borderRadius: 3` badge → `var(--radius-xs)`, `borderRadius: 4` textarea → `var(--radius-sm)`             |
| `src/pages/admin/DonationVerification.tsx`                       | `borderRadius: 4` fieldStyle → `var(--radius-sm)`, `borderRadius: 6` filter bar → `var(--radius-md)`, `borderRadius: 4` segment group → `var(--radius-sm)` |

Also: `DonationDetailSidebar` — `btn-dest` → `btn-primary` on "Approve & receipt" button (approve is green, not destructive red).

---

## Intentionally Preserved Animations

These use `animate-pulse` or `animate-spin` but are **not loading states**:

| Pattern                                             | Location            | Reason                                         |
| --------------------------------------------------- | ------------------- | ---------------------------------------------- |
| 6px live-status dot + `animate-pulse`               | Various admin pages | Signals live/real-time status — intentional UI |
| `Spinner` on submit button during in-flight request | Forms               | Action-feedback to user — must not be replaced |
