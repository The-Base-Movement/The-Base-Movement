/**
 * blogs/BlogsKPIs.tsx
 * ─────────────────────────────────────────────────────────────────
 * Four KPI tiles for the Blogs list view:
 *  Total articles | Authorized (Published) | Pending review | Drafts
 *
 * Props:
 *  posts — full unfiltered post list used to compute counts
 */

import { TacticalKPI } from '@/components/admin/TacticalKPI'
import type { BlogPost } from '@/types/admin'

interface BlogsKPIsProps {
  posts: BlogPost[]
}

export function BlogsKPIs({ posts }: BlogsKPIsProps) {
  return (
    <div className="kpis">
      {/* Total */}
      <TacticalKPI
        label="Total articles"
        value={posts.length}
        description="Across all categories"
        variant="red"
      />

      {/* Published */}
      <TacticalKPI
        label="Authorized"
        value={posts.filter((p) => p.status === 'Published').length}
        description="Live in public feed"
        trend={{ direction: 'up', value: 'Live' }}
        variant="gold"
      />

      {/* Pending */}
      <TacticalKPI
        label="Pending review"
        value={posts.filter((p) => p.status === 'Pending Verification').length}
        description="Awaiting editorial clearance"
        trend={{ direction: 'neutral', value: 'Pending' }}
        variant="black"
      />

      {/* Drafts */}
      <TacticalKPI
        label="Drafts"
        value={posts.filter((p) => p.status === 'Draft').length}
        description="Work in progress"
        variant="green"
      />
    </div>
  )
}
