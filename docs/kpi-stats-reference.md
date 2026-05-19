# KPI / Hero Stats Reference

## Central control

All KPI stat card number sizes are governed by one CSS variable:

```css
/* src/index.css — :root */
--kpi-num-size: 22px;
```

Change this single value to resize stat numbers across every admin and dashboard page simultaneously.

---

## Two rendering patterns

### Pattern A — `TacticalKPI` component (most pages)

Uses `.card .num` CSS class. The override rule `.kpis .card .num { font-size: var(--kpi-num-size) }` in `index.css` applies automatically when wrapped in `.kpis`.

```tsx
<div className="kpis">
  <TacticalKPI label="Label" value={n} description="Sub text" />
</div>
```

### Pattern B — Inline panel (Media Library, Polls, Authors)

These pages use custom inline panels that consume the variable directly:

```tsx
<p style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, ... }}>{value}</p>
```

---

## Admin page inventory

| Page                       | Route                           | Pattern          | Status        |
| -------------------------- | ------------------------------- | ---------------- | ------------- |
| Dashboard                  | `/admin/dashboard`              | A — TacticalKPI  | ✓ Centralized |
| Members                    | `/admin/members`                | A — TacticalKPI  | ✓ Centralized |
| Member Verification        | `/admin/verification`           | A — TacticalKPI  | ✓ Centralized |
| Chapters                   | `/admin/chapters`               | A — TacticalKPI  | ✓ Centralized |
| Blogs                      | `/admin/blogs`                  | A — TacticalKPI  | ✓ Centralized |
| Authors                    | `/admin/authors`                | B — Inline panel | ✓ Centralized |
| Media Library              | `/admin/media`                  | B — Inline panel | ✓ Centralized |
| Polls                      | `/admin/polls`                  | A — TacticalKPI  | ✓ Centralized |
| Orders                     | `/admin/orders`                 | A — TacticalKPI  | ✓ Centralized |
| Donations                  | `/admin/donations`              | A — TacticalKPI  | ✓ Centralized |
| Spending Ledger            | `/admin/spending-ledger`        | A — TacticalKPI  | ✓ Centralized |
| Broadcasts                 | `/admin/broadcasts`             | A — TacticalKPI  | ✓ Centralized |
| Administrators             | `/admin/administrators`         | A — TacticalKPI  | ✓ Centralized |
| Leadership Hub             | `/admin/leadership`             | A — TacticalKPI  | ✓ Centralized |
| Rally Command              | `/admin/rally-command`          | A — TacticalKPI  | ✓ Centralized |
| War Room                   | `/admin/war-room`               | A — TacticalKPI  | ✓ Centralized |
| Ground Game                | `/admin/ground-game`            | A — TacticalKPI  | ✓ Centralized |
| Mobilization Metrics       | `/admin/mobilization-metrics`   | A — TacticalKPI  | ✓ Centralized |
| Logistics Intelligence     | `/admin/logistics-intelligence` | A — TacticalKPI  | ✓ Centralized |
| Sentiment Intelligence     | `/admin/sentiment-intelligence` | A — TacticalKPI  | ✓ Centralized |
| Field Directives           | `/admin/directives`             | A — TacticalKPI  | ✓ Centralized |
| Strategic Priorities       | `/admin/priorities`             | A — TacticalKPI  | ✓ Centralized |
| Roadmap                    | `/admin/roadmap`                | A — TacticalKPI  | ✓ Centralized |
| Store (StoreStatsOverview) | `/admin/store`                  | A — TacticalKPI  | ✓ Centralized |

---

## Dashboard (member portal) page inventory

These pages render inside `DashboardLayout` and must use the design system (inline styles + CSS variables, no Tailwind utilities).

### Dashboard-only pages

| Page                | Route                       | KPI / Stats          | Tailwind remaining                                       | Priority                                     |
| ------------------- | --------------------------- | -------------------- | -------------------------------------------------------- | -------------------------------------------- |
| Dashboard home      | `/dashboard`                | None (no stat strip) | Loading state, responsive grids, feed header             | High — fix grids + loading state             |
| Members             | `/dashboard/members`        | ✓ `.kpis` wrapper    | None                                                     | ✓ Done                                       |
| Chapter Hub         | `/dashboard/chapter-hub`    | ✓ `.kpis` wrapper ×2 | 1 minor hit                                              | ✓ Essentially done                           |
| Chapter Details     | `/dashboard/chapters/:slug` | None                 | `grid grid-cols-1 sm:grid-cols-2` ×2, `w-full lg:w-auto` | Medium — responsive grids only               |
| Profile Settings    | `/dashboard/settings`       | None                 | `profile-form-grid` (custom class, OK)                   | ✓ Done                                       |
| Feedback Hub        | `/dashboard/feedback`       | None                 | None                                                     | ✓ Done                                       |
| Canvasser Clipboard | `/dashboard/canvass`        | None                 | ~62 hits — intentional mobile-first design               | Leave as-is (field app, own design language) |

### Dual-use pages (dashboard + public)

These pages are mounted under **both** `DashboardLayout` and `PublicLayout`. They cannot be fully migrated to the design system because they also render as standalone public pages. Keep `.kpis` wrappers intact; leave other Tailwind in place.

| Page     | Dashboard route       | Public route | KPI wrapper | Tailwind remaining              | Action                      |
| -------- | --------------------- | ------------ | ----------- | ------------------------------- | --------------------------- |
| Donate   | `/dashboard/donate`   | `/donate`    | ✓ `.kpis`   | 1 minor hit                     | ✓ Essentially done          |
| Impact   | `/dashboard/impact`   | `/impact`    | ✓ `.kpis`   | ~83 hits                        | Leave — public page styling |
| Polls    | `/dashboard/polls`    | `/polls`     | ✓ `.kpis`   | ~40 hits (public header/layout) | Leave — public page styling |
| Chapters | `/dashboard/chapters` | `/chapters`  | ✓ `.kpis`   | ~65 hits                        | Leave — public page styling |

---

## Dashboard fixes needed (priority order)

### 1. Dashboard home (`src/pages/Dashboard.tsx`) — HIGH

**Issues:**

- `animate-in fade-in duration-700` on `.main` wrapper → strip (`.main` already has `mainFadeIn` animation)
- Loading state: `w-full h-screen flex items-center justify-center bg-background` → inline styles
- `grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[20px] mb-[20px] items-start` → inline style
- `grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[20px]` → inline style
- Feed panel: `bg-white border border-border rounded-[4px] p-6 feed` → `panel`
- Feed h3: `font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[20px] flex items-center justify-between` → inline style
- Live badge: `live flex items-center gap-1.5 text-[10px] font-extrabold text-destructive uppercase tracking-[.06em] font-meta` → inline style

### 2. Chapter Details (`src/pages/ChapterDetails.tsx`) — MEDIUM

**Issues:**

- `grid grid-cols-1 sm:grid-cols-2` ×2 → inline `style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: ... }}`
- `w-full lg:w-auto` → inline style

### 3. Chapter Hub (`src/pages/ChapterHub.tsx`) — LOW

**Issues:**

- 1 minor Tailwind hit — check and inline

---

## Adding stats to a new page

Always use **Pattern A** for new pages unless the stat value is a long string (folder names, URLs, etc.) that would overflow — in that case use **Pattern B** with `fontSize: 'var(--kpi-num-size)'`.

```tsx
// Pattern A — standard
<div className="kpis">
  <TacticalKPI label="..." value={n} description="..." variant="green" />
</div>

// Pattern B — long string values
<div className="kpis">
  <div className="panel" style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'hsl(var(--primary))' }} />
    <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Label</p>
    <p style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 4px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
    <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>Sub text</p>
  </div>
</div>
```
