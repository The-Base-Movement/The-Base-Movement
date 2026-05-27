# Border Radius Token Audit — 2026-05-26

## Problem

The codebase had three poorly-named radius CSS variables (`--radius`, `--radius-lg`, `--radius-xl`) that didn't match the design handoff naming or cover the full token set. 409 hardcoded pixel values across 156 `.tsx` files and 12 in `index.css` made brand-wide radius changes impractical.

## Token Set Established

Defined in `src/index.css` under `:root`:

| Variable        | Value   | Use case                          |
| --------------- | ------- | --------------------------------- |
| `--radius-xs`   | `2px`   | Inline code chips, checkboxes     |
| `--radius-sm`   | `4px`   | Buttons, small controls, inputs   |
| `--radius-md`   | `8px`   | Compact panels, asides, dropdowns |
| `--radius-lg`   | `12px`  | Main cards, modals, CTA strips    |
| `--radius-pill` | `999px` | Status badges, pills, tags        |

Old variables (`--radius: 0.125rem`, `--radius-lg: 0.25rem`, `--radius-xl: 0.5rem`) removed and their 2 CSS usages updated to `--radius-md`.

## Completed Migrations

### `src/index.css`

All hardcoded radius values replaced with variables:

- `999px` / `99px` → `var(--radius-pill)`
- `4px` → `var(--radius-sm)`
- `2px` → `var(--radius-xs)`
- `var(--radius-xl)` (2 usages in `.auth-frame`, `.verify-checks`) → `var(--radius-md)`

### `src/pages/OfficerDetail.tsx`

Fully migrated: profile card (`--radius-lg`), aside (`--radius-md`), CTA strip (`--radius-lg`), tier badge (`--radius-pill`), region/Ghana First pills (`--radius-pill`), share button (`--radius-sm`), related card hover area (`--radius-md`).

## Off-Spec Values in `index.css`

Three `6px` and one `10px` value remain in `index.css` — these don't map to any design token and need a conscious decision before changing (visual impact):

| Line  | Class/context    | Current | Nearest token                           |
| ----- | ---------------- | ------- | --------------------------------------- |
| ~633  | `.panel` variant | `6px`   | `--radius-sm` (4) or `--radius-md` (8)  |
| ~978  | form group       | `6px`   | `--radius-sm` or `--radius-md`          |
| ~1161 | table wrapper    | `6px`   | `--radius-sm` or `--radius-md`          |
| ~523  | BrandLine strip  | `10px`  | `--radius-md` (8) or `--radius-lg` (12) |

## Remaining Work

**409 hardcoded occurrences across 156 `.tsx` files** have not been migrated. Strategy: **migrate on touch** — whenever a component is edited for any reason, swap its hardcoded `borderRadius` values to the appropriate variable at the same time. Do not mass-replace blindly as visual regressions are hard to catch at scale.

Priority files to migrate next (most-used components):

- `src/components/DashboardLayout.tsx`
- `src/components/layouts/AdminLayout.tsx`
- `src/components/MemberProfileCard.tsx`
- `src/components/ChapterCard.tsx`
- `src/components/Navbar.tsx`
