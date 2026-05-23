/**
 * polls/PollsHeader.tsx
 * ─────────────────────────────────────────────────────────────────
 * Page header for the Polls (Engagement Hub) admin page.
 * Renders the breadcrumb, page title, accent line, description,
 * and the "Create Campaign" primary action button.
 *
 * Props:
 *  onCreateClick — opens the Create Campaign modal
 */

import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface PollsHeaderProps {
  onCreateClick: () => void
}

export function PollsHeader({ onCreateClick }: PollsHeaderProps) {
  return (
    <AdminPageHeader
      title="Engagement Hub"
      icon="bar_chart"
      description="Direct interaction with citizens through polling, feedback loops, and mobilization pulse checks."
      actions={
        <button className="btn btn-primary" onClick={onCreateClick}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Create Campaign
        </button>
      }
    />
  )
}
