# Breadcrumb Implementation Audit

**Audit Date:** 2026-05-25
**Status:** COMPLETE — All public pages covered ✅

---

## Component Architecture

The platform uses one shared component with one legacy outlier:

| Component         | Path                                  | Usage                                                                |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `Breadcrumbs`     | `src/components/Breadcrumbs.tsx`      | All public + dashboard + admin pages                                 |
| `StoreBreadcrumb` | `src/pages/store/StoreBreadcrumb.tsx` | `/store` only — static custom markup, NOT using `Breadcrumbs.tsx` ⚠️ |

### `Breadcrumbs.tsx` Design

- Auto-generates crumb trail from `useLocation()` path segments — no manual prop drilling per route
- Only renders on routes matching `SUPPORTED_PREFIXES` (returns `null` silently on unmatched paths)
- Two variants: `"light"` (default — white/off-white backgrounds) and `"dark"` (hero overlays)
- Optional `currentLabel` prop overrides the last segment label (used for blog post titles, product names)
- Resolves human-readable labels via `LABEL_OVERRIDES` map; falls back to capitalised segment text

---

## SUPPORTED_PREFIXES

```ts
;('/dashboard',
  '/admin',
  '/blog',
  '/donate',
  '/impact',
  '/store',
  '/our-agenda',
  '/polls',
  '/chapters',
  '/contact',
  '/press',
  '/privacy',
  '/terms',
  '/officers')
```

## LABEL_OVERRIDES

```ts
blog → 'Updates'        dashboard → 'Dashboard'    admin → 'Admin'
authors → 'Authors'     broadcasts → 'Broadcasts'  members → 'Members'
store → 'Store'         chapters → 'Chapters'       settings → 'Settings'
trash → 'Trash Vault'   'media-library' → 'Media Library'
polls → 'Polls'         regions → 'Regions'         new → 'New'
edit → 'Edit'           officers → 'Leadership'     'our-agenda' → 'Our Agenda'
contact → 'Contact'     donate → 'Donate'           impact → 'Impact'
```

---

## Public Pages (PublicLayout)

| Route                  | File                                       | Variant | Notes                                                   |
| ---------------------- | ------------------------------------------ | ------- | ------------------------------------------------------- |
| `/blog`                | `src/pages/blog/PublicHero.tsx:39`         | `dark`  | In dark hero section                                    |
| `/blog/:id`            | `src/pages/blogpost/PostToolbar.tsx:11`    | `light` | `currentLabel={title}` — shows post title as last crumb |
| `/our-agenda`          | `src/pages/ouragenda/AgendaHeader.tsx:9`   | `dark`  | In dark hero section                                    |
| `/contact`             | `src/pages/Contact.tsx:59`                 | `dark`  | In dark hero section                                    |
| `/donate`              | `src/pages/Donate.tsx:164`                 | `light` | Above header content block                              |
| `/store`               | `src/pages/store/StoreBreadcrumb.tsx`      | n/a     | ⚠️ Uses bespoke static component — see note below       |
| `/store/product/:slug` | `src/pages/ProductDetails.tsx:173`         | `light` | `currentLabel={product.name}`                           |
| `/store/cart`          | `src/pages/Cart.tsx:25`                    | `light` |                                                         |
| `/store/wishlist`      | `src/pages/Wishlist.tsx:21`                | `light` |                                                         |
| `/store/checkout`      | `src/pages/Checkout.tsx:166`               | `light` |                                                         |
| `/store/summary`       | `src/pages/OrderSummary.tsx:87`            | `light` |                                                         |
| `/impact`              | `src/pages/impact/PublicImpactView.tsx:51` | `light` | In page header section                                  |
| `/polls`               | `src/pages/Polls.tsx:299`                  | `dark`  | In dark hero section                                    |
| `/chapters`            | `src/pages/chapters/PublicHeader.tsx:12`   | `light` | Via `PublicHeader` sub-component                        |
| `/privacy`             | `src/pages/Privacy.tsx:17`                 | `light` |                                                         |
| `/terms`               | `src/pages/Terms.tsx:17`                   | `light` |                                                         |
| `/press`               | `src/pages/Press.tsx:42`                   | `light` |                                                         |
| `/officers`            | `src/pages/Officers.tsx:83`                | `dark`  | In dark hero section                                    |

---

## Dashboard Pages (DashboardLayout)

DashboardLayout does **not** inject `Breadcrumbs` globally. Only one dashboard page has explicit breadcrumbs:

| Route                | File                                   | Variant | Notes |
| -------------------- | -------------------------------------- | ------- | ----- |
| `/dashboard/canvass` | `src/pages/CanvasserClipboard.tsx:132` | `light` |       |

All other dashboard routes (`/dashboard`, `/dashboard/blog`, `/dashboard/store`, etc.) have **no breadcrumbs**. These routes are in SUPPORTED_PREFIXES so the component would render correctly if added.

---

## Admin Pages (AdminLayout)

`AdminLayout` injects `<Breadcrumbs />` globally at `src/components/layouts/AdminLayout.tsx:1439`. All `/admin/*` routes inherit it automatically — no per-page implementation needed.

---

## Intentionally Excluded Routes

| Route               | Reason                                            |
| ------------------- | ------------------------------------------------- |
| `/`                 | Root page — breadcrumbs have no parent to link to |
| `/login`            | Auth flow                                         |
| `/register`         | Auth flow                                         |
| `/admin-login`      | Auth flow                                         |
| `/verify/:id`       | Verification flow                                 |
| `/preview-officer`  | Internal preview tool                             |
| `/register/preview` | Internal preview tool                             |

---

## Known Issues & Future Work

### ⚠️ `StoreBreadcrumb.tsx` — Legacy Static Component

`src/pages/Store.tsx` renders `<StoreBreadcrumb />` instead of `<Breadcrumbs />`. `StoreBreadcrumb` is a manually-coded static markup breadcrumb (`Home · Store · All products`) that does not use the shared component. It predates the `Breadcrumbs.tsx` component.

**Recommended fix:** Replace `<StoreBreadcrumb />` in `Store.tsx` with `<Breadcrumbs />` and delete `StoreBreadcrumb.tsx`.

### Dashboard Pages Missing Breadcrumbs

Most dashboard pages have no breadcrumbs. To add them globally, inject `<Breadcrumbs />` into `DashboardLayout` the same way `AdminLayout` does, or add them individually per page. Dashboard routes (`/dashboard/*`) are already in `SUPPORTED_PREFIXES` so no changes to `Breadcrumbs.tsx` are needed.
