# Custom UI Workflow

## Purpose

Building or modifying UI components, layouts, cards, modals, dropdowns, status badges, and any visual elements inside the dashboard, admin, or public surfaces of The Base Movement.

## When to use

Use this workflow when the task involves:

- Adding a new UI component or section to a page
- Modifying the layout or appearance of an existing panel, card, or modal
- Adding/editing icons, status badges, or pills
- Adding a dropdown, tab set, or toggle
- Making a dark mode adjustment
- Adjusting spacing, padding, color, or typography

## Project context

- Custom CSS design system in `src/index.css` (52 KB) — CSS variables + utility classes
- No shadcn in migrated pages; `components.json` is legacy only
- Material Symbols for icons — never Lucide
- Three layout shells: `PublicLayout`, `DashboardLayout`, `AdminLayout`
- Brand colors: green (primary), gold (accent), red (destructive), charcoal (on-surface)
- Typography: Public Sans, medium weight (500), no bold in body text
- Border radius always via `var(--radius-xs/sm/md/lg/pill)` tokens

## Inspect first

- `src/index.css` — grep for the class/variable you need (do NOT read the whole file)
- `src/components/` — check for reusable components before creating a new one
- The specific page file being modified (e.g., `src/pages/admin/Members.tsx`)
- `src/components/layouts/AdminLayout.tsx` if layout-level change
- `src/components/DashboardLayout.tsx` if dashboard-level change

## Docs to check

- `docs/design-system-handoff/the-base-movement-design-system/project/ui_kits/dashboard/index.html` — visual reference
- `docs/audits/border-radius-token-audit-2026-05-26.md` — if touching border-radius

## Avoid touching

- `src/routes.tsx` — unless adding a new route is required
- `src/context/` — unless theme or auth behavior changes
- `supabase/` — UI changes do not touch the database
- `src/services/` — unless the UI change requires new data fetching

## Workflow

1. Read CLAUDE.md for design system rules.
2. Grep `src/index.css` for the CSS class or variable you need.
3. Check `src/components/` for an existing reusable component.
4. Inspect the specific page file to understand current structure.
5. Apply the smallest patch using existing CSS classes and inline styles.
6. Use `hsl(var(--token))` for colors; `var(--radius-*)` for border radius.
7. Use Material Symbols for any new icons.
8. Run `npm run typecheck`.
9. Summarize changed files and what changed.

## Project rules

- Never hardcode hex colors — use `hsl(var(--token))`.
- Never hardcode border-radius px values — use `var(--radius-*)` tokens.
- Never import from `lucide-react`.
- Never use shadcn component imports.
- Inline styles are preferred over new Tailwind classes in migrated pages.
- KPI tiles always use `fontSize: 'var(--kpi-num-size)'` for the number.
- Status badges always use `.pill` + `.pill-ok/warn/err/mute`.
- Modals always use the standard backdrop pattern (`position: fixed, inset: 0, rgba(0,0,0,0.45)`).
- Dropdowns always use the fixed-inset backdrop to close on outside click.

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Do not read `src/index.css` in full — grep for the specific class name or variable.
- Do not read entire page files — jump to the relevant section.
- Do not scan all of `src/components/` — glob or grep for what you need.
- Prefer small diffs.
- Stop after the UI task is complete.
