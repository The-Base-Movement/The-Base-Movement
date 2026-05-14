# Project Plan — The Base Movement UI Migration

## Goal
Migrate all dashboard and admin pages to the custom design system: eliminate shadcn components and lucide icons, adopt `.panel`/`.btn`/`.pill`/`.kpis`/`.sidebar-main` classes, CSS variable color tokens, Material Symbols icons, and native elements.

## Reference
Design handoff: `docs/design-system-handoff/the-base-movement-design-system/project/ui_kits/dashboard/index.html`

---

## Completed

### Infrastructure
- [x] `src/components/DashboardLayout.tsx` — topbar overhauled: removed lucide/shadcn DropdownMenu, added native search input + gold Donate shortcut + notification bell + custom user dropdown (backdrop + identity header + sign-out)
- [x] `src/components/MemberProfileCard.tsx` — fully migrated: native button, material symbols, `.pill` classes, CSS variable colors

### Admin Pages
- [x] `src/pages/admin/Blogs.tsx` — media library wired to blog-images folder only, TinyMCE full width, insert-from-library support

### Member Dashboard Pages
- [x] `src/pages/Members.tsx` — migrated: `.kpis` with brand-color left bars, `.sidebar-main` layout, redesigned filter sidebar with material-symbol headings, member profile modal

---

## In Progress / Pending

### Dashboard Pages (priority order)
- [ ] `src/pages/Dashboard.tsx` — main overview (stat cards, quick actions, activity feed)
- [ ] `src/pages/ProfileSettings.tsx` — member profile settings
- [ ] `src/pages/Polls.tsx` — feedback/polls page
- [ ] `src/pages/Blog.tsx` — member blog feed
- [ ] `src/pages/Impact.tsx` — impact page
- [ ] `src/pages/Chapters.tsx` + `src/pages/ChapterDetails.tsx` — chapters
- [ ] `src/pages/Donate.tsx` + donate sub-components — donation flow

### Admin Pages (second pass)
- [ ] `src/pages/admin/Members.tsx` — admin member management
- [ ] `src/pages/admin/Chapters.tsx`
- [ ] `src/pages/admin/Broadcasts.tsx` / `NewBroadcast.tsx`
- [ ] `src/pages/admin/FieldDirectives.tsx`
- [ ] `src/pages/admin/DeployMission.tsx`
- [ ] `src/pages/admin/Dashboard.tsx`
- [ ] `src/pages/admin/Settings.tsx` (settings tabs already partially done)

---

## Patterns to Reuse

### Filter sidebar
```tsx
const sectionSt = { paddingTop: 16, marginTop: 16, borderTop: '1px solid hsl(var(--border))' }
const sectionHeadSt = { display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginBottom: 10 }
```

### Style constants for forms
```tsx
const inputSt: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }
const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' }
const labelSt: React.CSSProperties = { fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6 }
```

### Removing shadcn — what to replace
| Old (remove) | New (use) |
|---|---|
| `Button` from neon-button or shadcn | `<button className="btn btn-primary">` |
| `Input` from shadcn | `<input style={inputSt}>` |
| `Select` from shadcn | `<select style={selectSt}>` |
| `Dialog` / `Sheet` | Custom fixed-backdrop modal |
| `DropdownMenu` | Custom openMenuId + backdrop pattern |
| lucide icons | Material Symbols |
| `BrandLine` | Remove unless explicitly needed |
| `cn()` | Remove, use inline styles |
