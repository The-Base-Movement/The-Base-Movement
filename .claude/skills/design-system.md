---
name: design-system
description: Quick reference for The Base Movement custom design system — classes, CSS variables, icon usage, and component patterns for dashboard/admin UI work
---

# Design System Quick Reference

## Layout Classes
| Class | Use |
|---|---|
| `.main` | Full-width content wrapper |
| `.kpis` | 4-column KPI tile grid |
| `.panel` | Card (white bg, border, border-radius) |
| `.ph` | Panel header (title + subtitle row) |
| `.sidebar-main` | 2-col layout: narrow filter sidebar + wide main |
| `.main-sidebar` | 2-col: wide main + narrow sidebar |
| `.desktop-only` | Hidden on mobile |
| `.mobile-only` | Hidden on desktop |

## Button Classes
```
.btn                — base (always pair with variant)
.btn-primary        — green filled
.btn-outline        — bordered
.btn-dest           — destructive red
.btn-sm             — small height
```

## Badge Classes
```
.pill .pill-ok      — green (Verified / Active)
.pill .pill-warn    — yellow (Pending)
.pill .pill-mute    — grey (Inactive / Muted)
```

## CSS Variable Reference
```
--primary           green brand
--accent            gold brand
--destructive       red
--on-surface        charcoal (main text)
--on-surface-muted  muted grey text
--border            border lines
--container-low     subtle bg (inputs, sidebar, chips)
--background        white
```
Always wrap: `hsl(var(--primary))` not `var(--primary)`.

## Icon Usage
Material Symbols only:
```tsx
<span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>
  icon_name
</span>
```
Common icons: `search`, `filter_list`, `groups`, `flag`, `public`, `location_on`, `person`, `verified`, `arrow_forward`, `close`, `more_vert`, `edit`, `delete`, `add`, `notifications`, `settings`, `logout`, `volunteer_activism`

## KPI Tile with Brand Bar
```tsx
<div className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'hsl(var(--primary))' }} />
  <div style={{ fontSize: 28, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>
    {value}
  </div>
  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
    {label}
  </div>
</div>
```
Bar colors by tile position: charcoal (Total) → green (Ghana) → gold (Diaspora) → red (Verified)

## Form Style Constants
```tsx
const inputSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))', outline: 'none',
  fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12,
  borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}
const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' }
const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6,
}
```

## Modal (Custom)
```tsx
{modal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
       onClick={() => setModal(null)}>
    <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}
         onClick={e => e.stopPropagation()}>
      {/* content */}
    </div>
  </div>
)}
```

## Dropdown (Custom)
```tsx
const [openId, setOpenId] = useState<string | null>(null)

// Trigger:
<div style={{ position: 'relative' }}>
  <button onClick={() => setOpenId(v => v === id ? null : id)}>...</button>
  {openId === id && (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenId(null)} />
      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50,
                    background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6,
                    minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* items */}
      </div>
    </>
  )}
</div>
```

## Shadcn → Native Replacement Map
| Remove | Replace with |
|---|---|
| `Button` | `<button className="btn btn-primary">` |
| `Input` | `<input style={inputSt} />` |
| `Select` | `<select style={selectSt}>` |
| `Dialog` / `Sheet` | Custom fixed-backdrop modal |
| `DropdownMenu` | Custom openId + fixed backdrop pattern |
| lucide icon | `<span className="material-symbols-outlined">` |
| `BrandLine` | Delete (not part of design system) |
| `cn()` | Remove; use inline styles or className strings |
| `Tabs` | Native button row with active state |
