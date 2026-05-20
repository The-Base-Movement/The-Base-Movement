/**
 * RallyHeader.tsx
 * ─────────────────────────────────────────────────────────────────
 * Page header for the Rally Command page.
 *
 * Renders:
 *  - Page title with icon ("Rally command")
 *  - Decorative accent line (.bl)
 *  - Short description text
 *  - Two header action buttons: "Global Manifest" and "Schedule Action"
 *
 * Note: The action buttons are currently placeholders (no onClick logic).
 * Wire them up to modals or navigation routes when implementing those features.
 */

export function RallyHeader() {
  return (
    <div className="top">
      <div>
        {/* Page title with leading icon */}
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>groups</span>
          Rally command
        </h2>

        {/* Decorative triple-line accent (shared design system element) */}
        <div style={{ marginTop: 12 }}>
          <div className="bl"><div /><div /><div /></div>
        </div>

        {/* Page subtitle */}
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
          Real-time attendance operational metrics and geo-fenced verification for field actions.
        </p>
      </div>

      {/* Header CTAs — wire these up to modals/routes as needed */}
      <div className="actions">
        <button className="btn btn-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
          Global Manifest
        </button>
        <button className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          Schedule Action
        </button>
      </div>
    </div>
  )
}
