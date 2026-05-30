import MobilizationLeaderboardCard from '@/components/admin/MobilizationLeaderboardCard'
import { pillBase, rankStyle } from './utils'
import type { ChapterLeaderboard } from '@/types/admin'

interface LeaderboardTableProps {
  filteredLeaderboard: ChapterLeaderboard[]
}

export function LeaderboardTable({ filteredLeaderboard }: LeaderboardTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Regional power rankings
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            Aggregated mobilization points
          </div>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
        >
          trending_up
        </span>
      </div>
      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Chapter / Region</th>
              <th style={{ textAlign: 'center' }}>Members</th>
              <th style={{ textAlign: 'center' }}>Badges</th>
              <th style={{ textAlign: 'right' }}>Impact points</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  No regional mobilization data available.
                </td>
              </tr>
            ) : (
              filteredLeaderboard.map((entry, index) => (
                <tr key={`${entry.chapter}_${entry.region}`}>
                  <td>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                        ...rankStyle(index),
                      }}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        marginBottom: 2,
                      }}
                    >
                      {entry.chapter}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {entry.region}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        ...pillBase,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    >
                      {entry.total_patriots}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        ...pillBase,
                        background: 'rgba(245,158,11,0.1)',
                        color: 'hsl(var(--accent))',
                        border: '1px solid rgba(245,158,11,0.2)',
                      }}
                    >
                      {entry.achievements_unlocked}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {entry.total_mobilization_points.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile card list */}
      <div className="mobile-only" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {filteredLeaderboard.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No regional data found.
          </div>
        ) : (
          filteredLeaderboard.map((entry, index) => (
            <MobilizationLeaderboardCard
              key={`${entry.chapter}_${entry.region}`}
              entry={entry}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  )
}
