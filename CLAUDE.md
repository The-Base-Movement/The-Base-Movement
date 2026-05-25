# The Base Movement — Project Guide

## Project Overview

Political movement membership platform for Ghana. Members join as Ghana Network (by constituency/region) or Diaspora Network (by country). Two distinct surfaces:

- **Public site** — marketing, registration, blog, store, chapters (`PublicLayout`)
- **Member dashboard** — authenticated area for logged-in patriots (`DashboardLayout`)
- **Admin panel** — management interface for staff (`AdminLayout`)

## Tech Stack

- React 18 + TypeScript + Vite
- React Router v6 (lazy-loaded routes in `src/routes.tsx`)
- Supabase (auth + database + storage)
- TinyMCE (blog editor in `admin/Blogs.tsx`)
- TailwindCSS (utility classes only — do NOT use shadcn components in pages we're migrating)

## Response Style

- No preamble ("Let me...", "I will now...")
- No trailing summaries after edits
- No comments unless the WHY is non-obvious
- Short answers for short questions
- Read specific line ranges, not whole files, when you already know what you need

## Design System (Critical)

All dashboard and admin pages use a custom CSS design system. **Never use shadcn/lucide in migrated pages.**

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

### CSS Variables (always use hsl() wrapper)

```
hsl(var(--primary))          — brand green
hsl(var(--accent))           — brand gold
hsl(var(--destructive))      — red
hsl(var(--on-surface))       — charcoal text
hsl(var(--on-surface-muted)) — muted text
hsl(var(--border))           — border
hsl(var(--container-low))    — subtle background
hsl(var(--background))       — white
```

### Icons

Use **Material Symbols** exclusively: `<span className="material-symbols-outlined" style={{ fontSize: N }}>icon_name</span>`  
Never import from lucide-react in migrated pages.

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

Always use `fontSize: 'var(--kpi-num-size)'` for the stat number — never a hardcoded pixel value.

### Modal Pattern

```tsx
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
     onClick={() => setModal(null)}>
  <div style={{ ... }} onClick={e => e.stopPropagation()}>
    {/* content */}
  </div>
</div>
```

### Dropdown Pattern

```tsx
const [openMenuId, setOpenMenuId] = useState<string | null>(null)
// trigger:
onClick={() => setOpenMenuId(v => v === id ? null : id)}
// in JSX:
{openMenuId === id && (
  <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenMenuId(null)} />
    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50, ... }}>
      {/* items */}
    </div>
  </>
)}
```

## Services Layer (`src/services/`)

| Service           | Key Methods                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `adminService`    | `getMembers()`, `getMemberProfile(regNo)`, `getNotifications()`, `updateMemberProfile(regNo, profile)` |
| `memberService`   | member-facing reads                                                                                    |
| `contentService`  | `getMediaFiles(folder)`, `uploadImage(file, folder)`, `getPosts()`                                     |
| `authService`     | `getUser()`, `logout()`                                                                                |
| `chapterService`  | chapter CRUD                                                                                           |
| `pollService`     | poll data                                                                                              |
| `donationService` | donations                                                                                              |

## Key Files

- `src/routes.tsx` — all routes, lazy imports
- `src/components/DashboardLayout.tsx` — member dashboard shell (topbar + sidebar)
- `src/components/layouts/AdminLayout.tsx` — admin shell
- `src/components/admin/AdminPageHeader.tsx` — standard header used at top of every admin page
- `src/components/ui/BrandLine.tsx` — Triple-pillar brand line (Red → Gold → Green)
- `src/components/MemberProfileCard.tsx` — member directory card
- `src/pages/Members.tsx` — member directory (`/dashboard/members`)
- `src/pages/admin/Blogs.tsx` — blog editor with TinyMCE + media library
- `docs/design-system-handoff/the-base-movement-design-system/project/ui_kits/dashboard/index.html` — visual reference

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

## Conventions

- Inline styles preferred over Tailwind in migrated components (avoids purge/class conflicts)
- Typography: `fontFamily: "'Public Sans', sans-serif"`, `fontWeight: 'var(--font-weight-medium, 500)'` (no-bold directive — weights 700+ are for logos/decorative only)
- Always `boxSizing: 'border-box'` on inputs
- `isVerified(m)`: `m.status === 'Active' || m.status === 'Approved' || !m.status`
- Media library folder for blog editor: `'blog-images'` (hardcoded — never fetch all folders)
