import { useState } from 'react'
import MobilizationLeaderboardCard from '@/components/admin/MobilizationLeaderboardCard'
import { pillBase, rankStyle } from './utils'
import type { ChapterLeaderboard } from '@/types/admin'

interface LeaderboardTableProps {
  filteredLeaderboard: ChapterLeaderboard[]
}

export function LeaderboardTable({ filteredLeaderboard }: LeaderboardTableProps) {
  const [prevLeaderboard, setPrevLeaderboard] = useState(filteredLeaderboard)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page to 1 synchronously during rendering if filtered leaderboard changes
  if (filteredLeaderboard !== prevLeaderboard) {
    setPrevLeaderboard(filteredLeaderboard)
    setCurrentPage(1)
  }

  const totalItems = filteredLeaderboard.length
  const totalPages = Math.ceil(totalItems / 10)
  const startIndex = (currentPage - 1) * 10
  const endIndex = startIndex + 10
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, endIndex)

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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
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
        <img
          src="/brand/icons/upward-arrow.png"
          alt=""
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '140%',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Region</th>
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
              paginatedLeaderboard.map((entry, index) => (
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
                        ...rankStyle(startIndex + index),
                      }}
                    >
                      {startIndex + index + 1}
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
          paginatedLeaderboard.map((entry, index) => (
            <MobilizationLeaderboardCard
              key={`${entry.chapter}_${entry.region}`}
              entry={entry}
              index={startIndex + index}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          {/* Count label — always on its own line */}
          <span
            style={{
              display: 'block',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 8,
            }}
          >
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} regions
          </span>

          {/* Desktop: numbered page buttons */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-outline btn-sm"
              style={{
                height: 28,
                padding: '0 8px',
                minWidth: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_left
              </span>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1
              const isActive = pageNum === currentPage
              return (
                <button
                  key={pageNum}
                  className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  style={{
                    height: 28,
                    width: 28,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: isActive ? '600' : '400',
                    fontSize: 11,
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="btn btn-outline btn-sm"
              style={{
                height: 28,
                padding: '0 8px',
                minWidth: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_right
              </span>
            </button>
          </div>

          {/* Mobile: Prev · X / Y · Next */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              style={{
                height: 32,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_left
              </span>
              Prev
            </button>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              style={{
                height: 32,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
