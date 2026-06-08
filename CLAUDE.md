# The Base Movement — Project Guide

## Project Overview

Political movement membership platform for Ghana. Members join as Ghana Network (by constituency/region) or Diaspora Network (by country). Two distinct surfaces:

- **Public site** — marketing, registration, blog, store, chapters (`PublicLayout`)
- **Member dashboard** — authenticated area for logged-in patriots (`DashboardLayout`)
- **Admin panel** — management interface for staff (`AdminLayout`)

Live domain: `thebasemovement.creativeutil.com` → migrating to `thebasemovement.com`

---

## Stack

- React 19 + TypeScript 5.9 + Vite 7
- React Router v7 (lazy-loaded routes in `src/routes.tsx`)
- Supabase (auth + database + storage + edge functions)
- TinyMCE (blog editor in `admin/Blogs.tsx`)
- Custom CSS design system (`src/index.css`, 52 KB) — no Tailwind in migrated components
- TailwindCSS 3 present in config but **do not add new Tailwind classes to migrated pages**
- Recharts (charts/data viz)
- GSAP + Framer Motion (animations)
- Tesseract.js (in-browser OCR for form scanning)
- Sentry (error monitoring)
- Mapbox GL (GIS map visualization)
- Sonner (toast notifications)
- React Hook Form + Zod (form validation)

---

## Important Folders

| Folder                    | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `src/pages/`              | All page views (48+ member/public pages)                           |
| `src/pages/admin/`        | 46+ admin-only pages                                               |
| `src/components/`         | Reusable UI components                                             |
| `src/components/layouts/` | AdminLayout, admin sidebar/topbar                                  |
| `src/components/admin/`   | Admin-only components (cards, forms, maps)                         |
| `src/components/buttons/` | Custom button variants                                             |
| `src/services/`           | Supabase integration layer (23 services, 384 KB)                   |
| `src/context/`            | React context providers (Auth, Branding, Chapters, Performance)    |
| `src/hooks/`              | Custom hooks (theme, mobile, toast, push notifications)            |
| `src/lib/`                | Utilities — supabase client, currency, analytics, scanForm         |
| `src/types/`              | TypeScript definitions (admin.ts is 922 lines)                     |
| `src/utils/`              | mapUtils (45 KB GeoJSON), offlineDb (IndexedDB)                    |
| `supabase/functions/`     | 22 Edge Functions (payments, OTP, email, push, OCR)                |
| `supabase/migrations/`    | 40+ SQL migration files                                            |
| `docs/`                   | Architecture docs, database docs, design system handoff, audits    |
| `public/`                 | Static assets, fonts, flags, GeoJSON, PWA manifest, service worker |
| `.claude/workflows/`      | Agent workflow files for common tasks                              |
| `.claude/prompts/`        | Reusable token-saving prompt templates                             |

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server (port 3000)
npm run build        # Full pipeline: typecheck → client → SSR → prerender
npm run build:client # Client-only Vite bundle
npm run build:server # SSR build to dist/server/
npm run typecheck    # TypeScript strict check (run before every commit)
npm run lint         # ESLint validation
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
npm run preview      # Preview production build
```

**Deployment pipeline (in order):**

1. `npm run typecheck`
2. `npm run build`
3. `git push` (Vercel auto-deploys on push to main)
4. `supabase functions deploy <name>` (edge functions deployed separately)

**Database:**

- `supabase migration new <name>` — create a new migration
- `supabase db push` — apply migrations to remote
- `supabase functions deploy <function-name>` — deploy edge function

---

## Styling Rules

- **Preserve all existing custom inline styles and style objects.** Do not convert them.
- **Reuse existing CSS variables and layout classes** from `src/index.css`.
- **Do not convert styles to Tailwind utility classes** in migrated components.
- **Do not introduce Tailwind** in dashboard or admin pages.
- **Do not introduce shadcn/ui** — `components.json` is legacy config only.
- **Do not introduce Lucide icons** — use Material Symbols exclusively.
- **Do not add new UI or icon libraries** unless explicitly requested.
- Use `hsl(var(--token))` format for all colors, never raw hex.
- Use `var(--radius-xs/sm/md/lg/pill)` for border radius — never hardcode px.
- Use `fontFamily: "'Public Sans', sans-serif"` for body text.
- Use `fontWeight: 'var(--font-weight-medium, 500)'` — no bold (700+) except logos.
- Always `boxSizing: 'border-box'` on inputs.

### CSS Variables (always wrap in hsl())

```
hsl(var(--primary))          — brand green #006B3F
hsl(var(--accent))           — brand gold #DAA520
hsl(var(--destructive))      — brand red #CE1126
hsl(var(--on-surface))       — charcoal text #181d19
hsl(var(--on-surface-muted)) — muted text #6f7a71
hsl(var(--border))           — light border #dfe4dd
hsl(var(--container-low))    — subtle background #f1f5ee
hsl(var(--background))       — green-tinted off-white #f6fbf4
hsl(var(--card))             — pure white
```

### Layout Classes

```
.main            — full-width content wrapper
.kpis            — 4-column KPI tile grid
.panel           — card container (white bg, border, border-radius)
.ph              — panel header (flex row, title + subtitle)
.sidebar-main    — 2-column layout (sidebar | main content)
.main-sidebar    — reverse (main | sidebar)
.desktop-only / .mobile-only
```

### Interactive Classes

```
.btn             — base button
.btn-primary     — green filled
.btn-outline     — bordered
.btn-dest        — destructive (red filled)
.btn-outline-dest — transparent, red border
.btn-accent      — gold filled
.btn-ghost       — transparent, no border
.btn-active-tab  — active tab style
.btn-inactive-tab — inactive tab style
.btn-sm          — small size (30px)
.pill            — status badge
.pill-ok         — green (Verified/Active)
.pill-warn       — yellow (Pending)
.pill-err        — red (error/flagged)
.pill-mute       — grey (Inactive)
```

### Icons

Use **Material Symbols** exclusively:

```tsx
<span className="material-symbols-outlined" style={{ fontSize: N }}>
  icon_name
</span>
```

Never import from `lucide-react` in migrated pages.

---

## KPI/Dashboard Rules

### KPI Tile Pattern (brand-color left bar)

```tsx
<div
  className="panel"
  style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
>
  <div
    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }}
  />
  {/* bar colors: charcoal=on-surface, green=primary, gold=accent, red=destructive */}
  <p
    style={{
      fontSize: 10,
      fontWeight: 'var(--font-weight-medium, 500)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'hsl(var(--on-surface-muted))',
      margin: '0 0 6px',
    }}
  >
    {kpi.label}
  </p>
  <p
    style={{
      fontSize: 'var(--kpi-num-size)',
      fontWeight: 'var(--font-weight-medium, 500)',
      color: 'hsl(var(--on-surface))',
      margin: 0,
    }}
  >
    {kpi.value}
  </p>
</div>
```

Always use `fontSize: 'var(--kpi-num-size)'` for stat numbers — never a hardcoded pixel value.

### Status Badges

```tsx
<span
  className={`pill ${isVerified(m) ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
>
  {m.status}
</span>
```

### Member Status Helper

```ts
isVerified(m): m.status === 'Active' || m.status === 'Approved' || !m.status
```

### Modal Pattern

```tsx
<div
  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
           display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  onClick={() => setModal(null)}
>
  <div style={{ ... }} onClick={e => e.stopPropagation()}>
    {/* content */}
  </div>
</div>
```

### Dropdown Pattern

```tsx
const [openMenuId, setOpenMenuId] = useState<string | null>(null)
// trigger: onClick={() => setOpenMenuId(v => v === id ? null : id)}
{
  openMenuId === id && (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={() => setOpenMenuId(null)}
      />
      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50 }}>
        {/* items */}
      </div>
    </>
  )
}
```

### Number Formatting

Use `src/lib/currency.ts` for GHS/USD formatting. Never format money inline.

---

## Coding Rules

- Inline styles preferred over Tailwind in migrated components (avoids purge/class conflicts).
- All routes lazy-loaded via `React.lazy()` + `Suspense` in `src/routes.tsx`.
- Services in `src/services/` are the only layer that calls Supabase — never call `supabase` directly from pages.
- `adminService.ts` is 92 KB — read only the relevant function, not the whole file.
- `src/types/admin.ts` is 922 lines — use targeted search for specific types.
- All new columns in `public.users` must have `GRANT SELECT` added (see Database Security Notes).
- Media library folder for blog editor: `'blog-images'` (hardcoded — never fetch all folders).

---

## Database — Security Notes

### `users` table column-level SELECT grant (maintenance required on schema changes)

`authenticated` and `anon` do **not** have table-level SELECT on `public.users`. They have column-level grants on every column **except `national_id`** (pgcrypto ciphertext). Set in migration `20260530000203`.

**Rule:** Every new column added to `public.users` must also be granted:

```sql
GRANT SELECT (new_column) ON TABLE public.users TO authenticated;
GRANT SELECT (new_column) ON TABLE public.users TO anon;
```

`national_id` is decrypted only via the `admin_get_national_id(reg_no)` RPC (admin-gated SECURITY DEFINER). Never read it directly from `users` in application code.

See `docs/database/users-column-security.md` for full details.

---

## File Editing Rules

- Inspect only relevant files — do not scan the full repo for normal tasks.
- Prefer small patches over whole-file rewrites.
- Do not touch auth/database/routing/deployment unless explicitly required by the task.
- Reuse existing components before creating new ones. Check `src/components/` first.
- Avoid large refactors during bug fixes.
- `adminService.ts` is large (92 KB) — read only the section you need.
- When editing a page in `src/pages/admin/`, check if there is a matching subdirectory for subcomponents.

---

## Docs Usage Rules

- Check `docs/` first when the task involves architecture, business rules, database schema, deployment, or feature behavior.
- Key docs:
  - `docs/database/` — schema documentation
  - `docs/audits/` — design system audit reports
  - `docs/design-system-handoff/` — visual reference
  - `docs/session_handover.md` — project handover notes
  - `docs/homepage.md` — homepage documentation
  - `docs/jobs.md` — jobs feature docs
- Do not paste long docs into responses — summarize only the relevant section.

---

## Validation Rules

Run in this order before committing:

1. `npm run typecheck` — always run after any TypeScript change
2. `npm run lint` — run after significant edits
3. `npm run build` — run before any deployment

---

## Token-Saving Rules

- Read CLAUDE.md before scanning broadly.
- Do not scan the full repo during normal tasks.
- Start with the most likely file/folder based on CLAUDE.md.
- Use targeted Grep/Glob searches — never read entire service files.
- Do not print full files in responses — summarize diffs.
- `adminService.ts`, `index.css`, and `admin.ts` are large — search within them, don't read whole files.
- Stop after the requested task is complete.

---

## Border Radius Tokens

```
var(--radius-xs)    — 2px   inputs, checkboxes
var(--radius-sm)    — 4px   buttons, small controls
var(--radius-md)    — 8px   compact panels, asides, dropdowns
var(--radius-lg)    — 12px  main cards, modals, CTA strips
var(--radius-pill)  — 999px status badges, pills, tags
```

Legacy files may still use hardcoded values — migrate on touch per `docs/audits/border-radius-token-audit-2026-05-26.md`.

---

## Member Data Shape

```ts
interface Member {
  id: string
  name: string
  profession: string
  platform: 'GHANA' | 'DIASPORA'
  region?: string
  constituency?: string
  country?: string
  status: 'Active' | 'Approved' | 'Pending' | string
  avatarUrl?: string
}
```

---

## Services Layer (`src/services/`)

| Service                   | Key Methods                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `adminService`            | `getMembers()`, `getMemberProfile(regNo)`, `getNotifications()`, `updateMemberProfile(regNo, profile)` |
| `memberService`           | member-facing reads                                                                                    |
| `contentService`          | `getMediaFiles(folder)`, `uploadImage(file, folder)`, `getPosts()`                                     |
| `authService`             | `getUser()`, `logout()`                                                                                |
| `chapterService`          | chapter CRUD                                                                                           |
| `pollService`             | poll data                                                                                              |
| `donationService`         | donations                                                                                              |
| `logisticsService`        | supply chain, GOTV                                                                                     |
| `intelligenceService`     | ML sentiment                                                                                           |
| `userActivityService`     | activity logging                                                                                       |
| `gamificationService`     | achievements/badges                                                                                    |
| `financeService`          | finance ops                                                                                            |
| `financeAnalyticsService` | finance metrics                                                                                        |
| `registrationService`     | member registration                                                                                    |
| `roleService`             | role-based access                                                                                      |
