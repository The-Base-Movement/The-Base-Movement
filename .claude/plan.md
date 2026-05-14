# Project Plan — The Base Movement UI Migration

## Goal
Migrate all dashboard and admin pages to the custom design system: eliminate shadcn components and lucide icons, adopt `.panel`/`.btn`/`.pill`/`.kpis`/`.sidebar-main` classes, CSS variable color tokens, Material Symbols icons, and native elements.

## Reference
Design handoff: `docs/design-system-handoff/the-base-movement-design-system/project/ui_kits/dashboard/index.html`

> **Current migration status is tracked in `.claude/skills/migration-status.md`** — always read that file at session start for the live pending list.

---

## Workflow (every session)
1. Read `.claude/skills/migration-status.md` for pending list
2. Pick next page, migrate it
3. `npx tsc --noEmit` — fix errors
4. `git add ... && git commit -m "feat: ..." && git push origin main`
5. Mark done in `migration-status.md`

---

## Patterns to Reuse

### isDashboard dual-route pages
```tsx
const location = useLocation()
const isDashboard = location.pathname.startsWith('/dashboard')
if (isDashboard) { return <div className="main">...</div> }
```

### Form style constants
```tsx
const inputSt: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }
const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' }
const labelSt: React.CSSProperties = { fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6 }
```

### Shadcn → Native Replacement Map
| Remove | Replace with |
|---|---|
| `Button` from neon-button or shadcn | `<button className="btn btn-primary">` |
| `Input` from shadcn | `<input style={inputSt} />` |
| `Select` from shadcn | `<select style={selectSt}>` |
| `Dialog` / `Sheet` | Custom fixed-backdrop modal |
| `DropdownMenu` | Custom openMenuId + backdrop pattern |
| lucide icons | `<span className="material-symbols-outlined">icon_name</span>` |
| `BrandLine` (admin) | Delete — not part of design system |
| `useToast` | `import { toast } from 'sonner'` |
| `cn()` | Remove; use inline styles or template literals |
| `Card` / `CardContent` | `<div className="panel">` |
| `TacticalKPI` | Keep — admin-specific component, not shadcn |
