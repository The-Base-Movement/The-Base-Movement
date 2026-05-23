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

import { BrandLine } from '@/components/ui/BrandLine'

interface PollsHeaderProps {
  onCreateClick: () => void
}

export function PollsHeader({ onCreateClick }: PollsHeaderProps) {
  return (
    <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
      <div>
        {/* Page title with leading icon */}
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            bar_chart
          </span>
          Engagement Hub
        </h2>

        {/* Decorative triple-line accent */}
        <div style={{ marginTop: 10, marginBottom: 4 }}>
          <BrandLine />
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12.5,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Manage movement-wide opinion polls, surveys, and live member feedback intercepts.
        </p>
      </div>

      {/* Header CTA — wire to modal open handler */}
      <div className="actions">
        <button className="btn btn-primary" onClick={onCreateClick}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Create Campaign
        </button>
      </div>
    </div>
  )
}
