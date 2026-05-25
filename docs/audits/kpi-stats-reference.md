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

### Pattern A — `TacticalKPI` component

Uses `.card .num` CSS class. The override rule `.kpis .card .num { font-size: var(--kpi-num-size) }` in `index.css` applies automatically when wrapped in `.kpis`.

```tsx
<div className="kpis">
  <TacticalKPI label="Label" value={n} description="Sub text" />
</div>
```

### Pattern B — Inline panel

Used when the stat value is a long string, a currency amount, or the page predates `TacticalKPI`. Must consume the variable directly — never hardcode a `fontSize` number for the stat value:

```tsx
<div className="kpis">
  <div
    className="panel"
    style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
  >
    <div
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }}
    />
    <p
      style={{
        fontSize: 10,
        fontWeight: 'var(--font-weight-medium, 500)',
        color: 'hsl(var(--on-surface-muted))',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: '0 0 6px',
      }}
    >
      Label
    </p>
    <p
      style={{
        fontSize: 'var(--kpi-num-size)',
        fontWeight: 'var(--font-weight-medium, 500)',
        color: 'hsl(var(--on-surface))',
        margin: 0,
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: 11,
        fontWeight: 'var(--font-weight-medium, 500)',
        color: 'hsl(var(--on-surface-muted))',
        margin: 0,
      }}
    >
      Sub text
    </p>
  </div>
</div>
```

---

## Admin page inventory

| Page                       | Route                           | Pattern          | Status        |
| -------------------------- | ------------------------------- | ---------------- | ------------- |
| Dashboard                  | `/admin/dashboard`              | A — TacticalKPI  | ✓ Centralized |
| Members                    | `/admin/members`                | A — TacticalKPI  | ✓ Centralized |
| Member Verification        | `/admin/verification`           | A — TacticalKPI  | ✓ Centralized |
| Chapters                   | `/admin/chapters`               | A — TacticalKPI  | ✓ Centralized |
| Regions                    | `/admin/regions`                | B — Inline panel | ✓ Centralized |
| Blogs                      | `/admin/blogs`                  | A — TacticalKPI  | ✓ Centralized |
| Authors                    | `/admin/authors`                | B — Inline panel | ✓ Centralized |
| Media Library              | `/admin/media`                  | B — Inline panel | ✓ Centralized |
| Polls                      | `/admin/polls`                  | B — Inline panel | ✓ Centralized |
| Polling Stations           | `/admin/polling-stations`       | B — Inline panel | ✓ Centralized |
| Donation Verification      | `/admin/donations`              | B — Inline panel | ✓ Centralized |
| Orders                     | `/admin/orders`                 | A — TacticalKPI  | ✓ Centralized |
| Spending Ledger            | `/admin/spending-ledger`        | A — TacticalKPI  | ✓ Centralized |
| Broadcasts                 | `/admin/broadcasts`             | A — TacticalKPI  | ✓ Centralized |
| Administrators             | `/admin/administrators`         | A — TacticalKPI  | ✓ Centralized |
| Leadership Hub             | `/admin/leadership`             | A — TacticalKPI  | ✓ Centralized |
| Chapter Hub (admin)        | `/admin/chapter-hub`            | B — Inline panel | ✓ Centralized |
| Rally Command              | `/admin/rally-command`          | A — TacticalKPI  | ✓ Centralized |
| War Room                   | `/admin/war-room`               | A — TacticalKPI  | ✓ Centralized |
| Ground Game                | `/admin/ground-game`            | A — TacticalKPI  | ✓ Centralized |
| Mobilization Metrics       | `/admin/mobilization-metrics`   | A — TacticalKPI  | ✓ Centralized |
| Logistics Intelligence     | `/admin/logistics-intelligence` | A — TacticalKPI  | ✓ Centralized |
| Sentiment Intelligence     | `/admin/sentiment-intelligence` | A — TacticalKPI  | ✓ Centralized |
| Field Directives           | `/admin/directives`             | A — TacticalKPI  | ✓ Centralized |
| Strategic Priorities       | `/admin/priorities`             | A — TacticalKPI  | ✓ Centralized |
| Roadmap                    | `/admin/roadmap`                | A — TacticalKPI  | ✓ Centralized |
| Trash Vault                | `/admin/trash`                  | B — Inline panel | ✓ Centralized |
| Store (StoreStatsOverview) | `/admin/store`                  | A — TacticalKPI  | ✓ Centralized |
| Party Officials            | `/admin/party-officials`        | —                | No KPI tiles  |

---

## Dashboard (member portal) page inventory

These pages render inside `DashboardLayout` and must use the design system (inline styles + CSS variables, no Tailwind utilities).

### Dashboard-only pages

| Page                | Route                       | KPI / Stats          | Status                                                   |
| ------------------- | --------------------------- | -------------------- | -------------------------------------------------------- |
| Dashboard home      | `/dashboard`                | None (no stat strip) | ✓ Done                                                   |
| Members             | `/dashboard/members`        | ✓ `.kpis` wrapper    | ✓ Done                                                   |
| Chapter Hub         | `/dashboard/chapter-hub`    | ✓ `.kpis` wrapper ×2 | ✓ Done                                                   |
| Chapter Details     | `/dashboard/chapters/:slug` | None                 | ✓ Done                                                   |
| Profile Settings    | `/dashboard/settings`       | None                 | ✓ Done                                                   |
| Feedback Hub        | `/dashboard/feedback`       | None                 | ✓ Done                                                   |
| Canvasser Clipboard | `/dashboard/canvass`        | None                 | Leave as-is (field app, intentional mobile-first design) |

### Dual-use pages (dashboard + public)

These pages are mounted under **both** `DashboardLayout` and `PublicLayout`. They cannot be fully migrated to the design system because they also render as standalone public pages. Keep `.kpis` wrappers intact; leave other Tailwind in place.

| Page     | Dashboard route       | Public route | KPI wrapper | Action                      |
| -------- | --------------------- | ------------ | ----------- | --------------------------- |
| Donate   | `/dashboard/donate`   | `/donate`    | ✓ `.kpis`   | ✓ Done                      |
| Impact   | `/dashboard/impact`   | `/impact`    | ✓ `.kpis`   | Leave — public page styling |
| Polls    | `/dashboard/polls`    | `/polls`     | ✓ `.kpis`   | Leave — public page styling |
| Chapters | `/dashboard/chapters` | `/chapters`  | ✓ `.kpis`   | Leave — public page styling |

---

## Adding stats to a new page

Always use **Pattern A** for new pages unless the stat value is a long string (folder names, URLs, currency totals, etc.) that would overflow — in that case use **Pattern B** with `fontSize: 'var(--kpi-num-size)'`.

**Never hardcode a numeric `fontSize` for a KPI stat value.** Always use `fontSize: 'var(--kpi-num-size)'` so the central variable controls it.
