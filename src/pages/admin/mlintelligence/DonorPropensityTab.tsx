import ScoreBar from '@/pages/admin/mlintelligence/ScoreBar'
import KpiStrip from '@/pages/admin/mlintelligence/KpiStrip'
import DonorCharts from '@/pages/admin/mlintelligence/DonorCharts'
import type { DonorScore, PropensityResponse } from '@/services/mlService'

export type DonorTierFilter = 'All' | 'High' | 'Medium' | 'Low'

interface Props {
  propensity: PropensityResponse
  donorSearch: string
  donorTierFilter: DonorTierFilter
  donorPage: number
  totalDonorPages: number
  filteredDonorsCount: number
  pagedDonors: DonorScore[]
  onSearch: (value: string) => void
  onTierFilterChange: (value: DonorTierFilter) => void
  onPageChange: (page: number) => void
}

export default function DonorPropensityTab({
  propensity,
  donorSearch,
  donorTierFilter,
  donorPage,
  totalDonorPages,
  filteredDonorsCount,
  pagedDonors,
  onSearch,
  onTierFilterChange,
  onPageChange,
}: Props) {
  return (
    <>
      <KpiStrip
        items={[
          {
            label: 'Total Scored',
            value: propensity.total_scored.toLocaleString(),
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'High Propensity',
            value: propensity.high_propensity.toLocaleString(),
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Medium Propensity',
            value: propensity.medium_propensity.toLocaleString(),
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Low Propensity',
            value: propensity.low_propensity.toLocaleString(),
            bar: 'hsl(var(--on-surface-muted))',
          },
        ]}
      />

      <DonorCharts propensity={propensity} />

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          placeholder="Search by name, ID, region…"
          value={donorSearch}
          onChange={(event) => onSearch(event.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            height: 36,
            padding: '0 12px',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {(['All', 'High', 'Medium', 'Low'] as DonorTierFilter[]).map((tier) => (
          <button
            key={tier}
            className={
              donorTierFilter === tier ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
            }
            onClick={() => onTierFilterChange(tier)}
          >
            {tier}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Region</th>
                <th style={{ textAlign: 'center' }}>Tier</th>
                <th>Score</th>
                <th style={{ textAlign: 'center' }}>Donations</th>
                <th style={{ textAlign: 'center' }}>Activity (30d)</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedDonors.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: '48px 24px',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                    }}
                  >
                    No members match filter.
                  </td>
                </tr>
              ) : (
                pagedDonors.map((member) => {
                  const tierColor = {
                    High: {
                      bg: 'rgba(34,197,94,0.1)',
                      color: 'hsl(var(--primary))',
                      border: 'rgba(34,197,94,0.25)',
                    },
                    Medium: {
                      bg: 'rgba(245,158,11,0.1)',
                      color: 'hsl(var(--accent))',
                      border: 'rgba(245,158,11,0.25)',
                    },
                    Low: {
                      bg: 'rgba(148,163,184,0.1)',
                      color: 'hsl(var(--on-surface-muted))',
                      border: 'hsl(var(--border))',
                    },
                  }[member.tier]

                  return (
                    <tr key={member.member_id}>
                      <td>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {member.full_name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {member.reg_no}
                        </div>
                      </td>
                      <td
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {member.region ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-pill)',
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            background: tierColor.bg,
                            color: tierColor.color,
                            border: `1px solid ${tierColor.border}`,
                          }}
                        >
                          {member.tier}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <ScoreBar score={member.score} />
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {member.donation_count}
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {member.activity_events_30d}
                      </td>
                      <td
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          maxWidth: 200,
                        }}
                      >
                        {member.recommended_action}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-only">
          {pagedDonors.length === 0 ? (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              No members match filter.
            </div>
          ) : (
            pagedDonors.map((member) => {
              const tierColor = {
                High: {
                  bg: 'rgba(34,197,94,0.1)',
                  color: 'hsl(var(--primary))',
                  border: 'rgba(34,197,94,0.25)',
                },
                Medium: {
                  bg: 'rgba(245,158,11,0.1)',
                  color: 'hsl(var(--accent))',
                  border: 'rgba(245,158,11,0.25)',
                },
                Low: {
                  bg: 'rgba(148,163,184,0.1)',
                  color: 'hsl(var(--on-surface-muted))',
                  border: 'hsl(var(--border))',
                },
              }[member.tier]

              return (
                <div
                  key={member.member_id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {member.full_name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {member.reg_no} · {member.region ?? '—'}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        background: tierColor.bg,
                        color: tierColor.color,
                        border: `1px solid ${tierColor.border}`,
                      }}
                    >
                      {member.tier}
                    </span>
                  </div>
                  <ScoreBar score={member.score} />
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {member.recommended_action}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {totalDonorPages > 1 && (
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {(donorPage - 1) * 15 + 1}–{Math.min(donorPage * 15, filteredDonorsCount)} of{' '}
              {filteredDonorsCount}
            </span>
            <button
              className="btn btn-outline btn-sm"
              style={{ height: 28, padding: '0 8px' }}
              disabled={donorPage === 1}
              onClick={() => onPageChange(donorPage - 1)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_left
              </span>
            </button>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {donorPage} / {totalDonorPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              style={{ height: 28, padding: '0 8px' }}
              disabled={donorPage === totalDonorPages}
              onClick={() => onPageChange(donorPage + 1)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_right
              </span>
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Generated {new Date(propensity.generated_at).toLocaleString()} · Scores refresh on page load
      </div>
    </>
  )
}
