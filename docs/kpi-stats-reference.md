# KPI / Hero Stats Reference

## Central control

All KPI stat card number sizes are governed by one CSS variable:

```css
/* src/index.css — :root */
--kpi-num-size: 22px;
```

Change this single value to resize stat numbers across every admin page simultaneously.

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

## Page inventory

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
