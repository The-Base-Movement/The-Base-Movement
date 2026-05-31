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

import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export function RallyHeader() {
  return (
    <AdminPageHeader
      title="Rally command"
      icon="groups"
      description="Real-time attendance operational metrics and geo-fenced verification for field actions."
      actions={
        <>
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              assignment
            </span>
            Global Manifest
          </button>
          <button className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add_circle
            </span>
            Schedule Action
          </button>
        </>
      }
    />
  )
}
