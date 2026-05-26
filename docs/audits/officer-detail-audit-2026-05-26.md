# Officer Detail Page — Build & Design Audit

**Date:** 2026-05-26
**Page:** `/officers/:slug` (`src/pages/OfficerDetail.tsx`)
**Status:** FIXED ✅

---

## Purpose

Documents the design and slug implementation decisions for the officer detail page,
including violations found on first build and how they were resolved.

---

## Slug Strategy

### Project convention (from existing pages)

| Page               | Slug source               | Lookup method                                  |
| ------------------ | ------------------------- | ---------------------------------------------- |
| Blog post          | `slug` DB column          | `.eq('slug', slug)`                            |
| Chapter details    | Generated from `name`     | Find in array where generated slug matches     |
| Store product      | `slug` DB column          | `.eq('slug', slug)`                            |
| **Officer detail** | **Generated from `name`** | **Fetch all for tier, find by generated slug** |

### Slug formula (same as chapters / DashboardLayout)

```ts
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
```

Examples:

- `"Kwame Mensah"` → `kwame-mensah`
- `"Dr. Akosua Asante-Bonsu"` → `dr-akosua-asante-bonsu`

### First build (wrong)

Used `officer.id` (UUID primary key):

```
/officers/132859fd-49ee-4af8-9e0f-2dd7497a89f4
```

### Fixed

Uses generated name slug:

```
/officers/kwame-mensah
```

Route param renamed from `:id` → `:slug`. Lookup: fetch all officers, find where
`toSlug(o.name) === slug`. Redirects to `/officers` if no match.

---

## Design System Violations Found & Fixed

| #   | Location                       | Violation                                                                                                      | Fix                                                   |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Profile card wrapper           | `background: '#fff'`                                                                                           | `hsl(var(--background))`                              |
| 2   | Related aside wrapper          | `background: '#fff'`                                                                                           | `hsl(var(--background))`                              |
| 3   | Avatar border in `RelatedCard` | `border: \`2px solid ${accentColor}20\``— appending`20`hex alpha to an`hsl()` string produces an invalid value | `color-mix(in srgb, ${accentColor} 12%, transparent)` |

---

## Typography Compliance

All text in `OfficerDetail.tsx` uses:

- Headings / labels: `fontWeight: 'var(--font-weight-medium, 500)'`
- Body / bio: `fontWeight: 'var(--font-weight-normal, 400)'`
- No raw `700 / 800 / 900` values

---

## Files Changed

| File                          | Change                                                |
| ----------------------------- | ----------------------------------------------------- |
| `src/pages/OfficerDetail.tsx` | Slug lookup, `#fff` → CSS variable, avatar border fix |
| `src/pages/Officers.tsx`      | `navigate` uses `toSlug(o.name)` instead of `o.id`    |
| `src/routes.tsx`              | `:id` → `:slug`                                       |
