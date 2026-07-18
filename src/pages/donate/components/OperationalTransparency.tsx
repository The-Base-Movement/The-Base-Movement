import { LiveContributionFeed } from '@/components/LiveContributionFeed'
import type { DonationDetail } from '@/types/admin'

interface SpendingRecord {
  id: string
  chapter: string
  type: string
  amount: string
  description: string
  category: string
  date: string
}

interface OperationalTransparencyProps {
  globalStats: { totalRaised: number; totalMembers: number; totalDonors: number }
  historyTab: 'contributions' | 'spending'
  setHistoryTab: (tab: 'contributions' | 'spending') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  contributionFilter: 'all' | 'me'
  setContributionFilter: (filter: 'all' | 'me') => void
  loading: boolean
  publicHistory: DonationDetail[]
  personalHistory: DonationDetail[]
  spendingHistory: SpendingRecord[]
  onOpenAudit: () => void
}

const formatSpendingAmount = (amount: string) => {
  const value = String(amount).trim()
  if (!value) return '₵0'
  if (value.includes('₵')) return value
  const numeric = Number(
    value
      .replace(/GHS/gi, '')
      .replace(/,/g, '')
      .replace(/[^0-9.-]+/g, '')
  )
  if (!Number.isFinite(numeric)) return '₵0'
  return `₵${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric)}`
}

const matchesSpendingSearch = (item: SpendingRecord, query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    item.description.toLowerCase().includes(normalized) ||
    item.chapter.toLowerCase().includes(normalized) ||
    item.category.toLowerCase().includes(normalized)
  )
}

export function OperationalTransparency({
  globalStats,
  historyTab,
  setHistoryTab,
  searchQuery,
  setSearchQuery,
  loading,
  spendingHistory,
  onOpenAudit,
}: OperationalTransparencyProps) {
  const filteredSpendingHistory = spendingHistory.filter((item) =>
    matchesSpendingSearch(item, searchQuery)
  )

  return (
    <section
      style={{
        marginTop: 96,
        paddingTop: 64,
        paddingBottom: 64,
        borderTop: '1px solid hsl(var(--border))',
      }}
    >
      {/* Section header — flex col on mobile, row on md+ (no inline flexDirection to avoid overriding Tailwind) */}
      <div
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        style={{ marginBottom: 32 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
            >
              volunteer_activism
            </span>
            <h2
              style={{
                fontSize: 'clamp(22px, 4vw, 36px)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Donation history
            </h2>
          </div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            A live record of contributions from members across Ghana and the diaspora
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '12px 24px',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              textAlign: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Total raised
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              ₵ {globalStats.totalRaised.toLocaleString()}
            </p>
          </div>
          <div
            style={{
              padding: '12px 24px',
              background: 'hsla(var(--primary), 0.07)',
              border: '1px solid hsla(var(--primary), 0.18)',
              textAlign: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--primary))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Donors
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--primary))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {globalStats.totalDonors.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* controls & filters */}
      <div style={{ marginBottom: 32 }}>
        {/* Row 1: tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'hsl(var(--container-low))',
            padding: 4,
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            border: '1px solid hsl(var(--border))',
            borderBottom: 'none',
            overflowX: 'auto',
          }}
        >
          {(['contributions', 'spending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setHistoryTab(tab)}
              style={{
                flex: 1,
                padding: '0 20px',
                height: 42,
                fontSize: 12,
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontFamily: "'Public Sans', sans-serif",
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                background: historyTab === tab ? 'hsl(var(--primary))' : 'transparent',
                color: historyTab === tab ? '#fff' : 'hsl(var(--on-surface-muted))',
              }}
            >
              {tab === 'contributions' ? 'Recent donations' : 'How funds are used'}
            </button>
          ))}
        </div>

        {/* Row 2: search (spending tab only) */}
        {historyTab === 'spending' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                search
              </span>
              <input
                aria-label="Search spending ledger"
                name="searchQuery"
                id="input-a34c64"
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  paddingLeft: 36,
                  paddingRight: 12,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        {historyTab === 'contributions' ? (
          /* ── Mobilization history: live real-time feed ── */
          <>
            <div style={{ padding: '20px 20px 16px' }}>
              <LiveContributionFeed />
            </div>
            <div
              style={{
                padding: '12px 20px',
                background: 'hsl(var(--container-low))',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Live donations · updates in real time
              </p>
              <button onClick={onOpenAudit} className="btn btn-outline btn-sm">
                View all
              </button>
            </div>
          </>
        ) : (
          /* ── Spending & allocation: tactical ledger ── */
          <>
            {/* desktop table */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--container-low))',
                    }}
                  >
                    {['Description', 'Category', 'Diaspora', 'Amount', 'Date'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textAlign: i === 3 ? 'right' : 'left',
                          whiteSpace: 'nowrap',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '48px 16px',
                          textAlign: 'center',
                          color: 'hsl(var(--on-surface-muted))',
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      >
                        Synchronising ledger…
                      </td>
                    </tr>
                  ) : filteredSpendingHistory.length > 0 ? (
                    filteredSpendingHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-xs)',
                              background: 'hsl(var(--container-low))',
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              margin: 0,
                            }}
                          >
                            {item.chapter}
                          </p>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-semibold, 600)',
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {formatSpendingAmount(item.amount)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: 'hsl(var(--on-surface-muted))',
                              margin: 0,
                            }}
                          >
                            {item.date}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '48px 16px',
                          textAlign: 'center',
                          color: 'hsl(var(--on-surface-muted))',
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      >
                        No spending records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* mobile card view */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredSpendingHistory.length > 0 ? (
                filteredSpendingHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid hsl(var(--border))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.description}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 500,
                          margin: '2px 0 0',
                        }}
                      >
                        {item.chapter} · {item.category}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 500,
                          margin: '2px 0 0',
                        }}
                      >
                        {item.date}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {formatSpendingAmount(item.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}
                >
                  No spending records yet.
                </div>
              )}
            </div>

            <div
              style={{
                padding: '12px 20px',
                background: 'hsl(var(--container-low))',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                How your donations are being used
              </p>
              <button onClick={onOpenAudit} className="btn btn-primary btn-sm">
                See all
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
