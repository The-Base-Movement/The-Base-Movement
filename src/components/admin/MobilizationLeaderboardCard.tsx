/**
 * MobilizationLeaderboardCard Component
 * -------------------------------------------------------------
 * Displays a chapter ranking card inside the Admin Command Leaderboard.
 * Details the chapter's name, region, cumulative mobilization points, active
 * patriot count, unlocked badges, and highlighted top-3 podium rankings.
 */

import type { ChapterLeaderboard } from '@/types/admin'
import { cn } from '@/lib/utils'

interface Props {
  entry: ChapterLeaderboard
  index: number
}

/**
 * MobilizationLeaderboardCard component rendering chapter ranking metrics.
 */
export default function MobilizationLeaderboardCard({ entry, index }: Props) {
  const rank = index + 1
  const rankStyle =
    rank === 1
      ? { bg: 'bg-accent', text: 'text-accent-foreground', shadow: 'shadow-lg shadow-accent/20' }
      : rank === 2
        ? { bg: 'bg-muted/60', text: 'text-on-surface/80', shadow: '' }
        : rank === 3
          ? { bg: 'bg-orange-300', text: 'text-orange-900', shadow: '' }
          : { bg: 'bg-muted/30', text: 'text-muted-foreground/80', shadow: '' }

  return (
    <div
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
      }}
    >
      {/* Row 1: Rank · Chapter Info · Points */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          className={cn(
            'w-10 h-10 flex items-center justify-center font-bold text-sm rounded-sm flex-shrink-0',
            rankStyle.bg,
            rankStyle.text,
            rankStyle.shadow
          )}
        >
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13.5,
              color: 'hsl(var(--on-surface))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.chapter}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              place
            </span>
            {entry.region}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 600,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Points
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: 'hsl(var(--primary))',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {entry.total_mobilization_points.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Row 2: Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'hsl(var(--container-low))',
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
          >
            group
          </span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 600,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Members
            </p>
            <p
              style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))' }}
            >
              {entry.total_patriots}
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'hsl(var(--container-low))',
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: 'hsl(var(--accent))' }}
          >
            bolt
          </span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 600,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Badges
            </p>
            <p
              style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))' }}
            >
              {entry.achievements_unlocked}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
