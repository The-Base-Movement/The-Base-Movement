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
  globalStats: { totalRaised: number; totalMembers: number }
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
  onDownload: () => void
  onOpenAudit: () => void
}

export function OperationalTransparency({
  globalStats,
  historyTab,
  setHistoryTab,
  searchQuery,
  setSearchQuery,
  contributionFilter,
  setContributionFilter,
  loading,
  publicHistory,
  personalHistory,
  spendingHistory,
  onDownload,
  onOpenAudit
}: OperationalTransparencyProps) {
  return (
    <section style={{ marginTop: 128 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 48 }} className="md:flex-row md:items-end md:justify-between">
        <div>
          <h2 style={{ 
            fontSize: 'clamp(26px, 5vw, 44px)', 
            fontWeight: 900, 
            color: 'hsl(var(--on-surface))', 
            fontFamily: "'Public Sans', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: 'hsl(var(--primary))' }}>vital_signs</span>
            Capital deployment history
          </h2>
          <p style={{ 
            fontSize: 10.5, 
            fontWeight: 800, 
            color: 'hsl(var(--on-surface-muted))', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            marginTop: 8,
            fontFamily: "'Public Sans', sans-serif"
          }}>Live immutable record of member mobilization.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            padding: '16px 32px', 
            background: '#fff', 
            border: '1px solid hsl(var(--border))', 
            textAlign: 'center', 
            borderRadius: 4,
            minWidth: 160
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: "'Public Sans', sans-serif" }}>Movement reserves</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>₵ {globalStats.totalRaised.toLocaleString()}</p>
          </div>
          <div style={{ 
            padding: '16px 32px', 
            background: 'hsla(var(--primary), 0.08)', 
            border: '1px solid hsla(var(--primary), 0.18)', 
            textAlign: 'center', 
            borderRadius: 4,
            minWidth: 160
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: "'Public Sans', sans-serif" }}>Active patriots</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'hsl(var(--primary))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>{globalStats.totalMembers.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* controls & filters */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 32, 
        padding: 12, 
        background: 'hsl(var(--container-low))', 
        border: '1px solid hsl(var(--border))', 
        marginBottom: 32,
        borderRadius: 4
      }} className="md:flex-row md:items-center md:justify-between">
        <div style={{ 
          display: 'flex', 
          background: 'hsl(var(--container-hi))', 
          padding: 4, 
          borderRadius: 4, 
          border: '1px solid hsl(var(--border))' 
        }}>
          <button 
            onClick={() => setHistoryTab('contributions')}
            style={{
              padding: '0 24px',
              height: 48,
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "'Public Sans', sans-serif",
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: historyTab === 'contributions' ? 'hsl(var(--primary))' : 'transparent',
              color: historyTab === 'contributions' ? '#fff' : 'hsl(var(--on-surface-muted))',
              minWidth: 180
            }}
          >
            Mobilization history
            {historyTab === 'contributions' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
          </button>
          <button 
            onClick={() => setHistoryTab('spending')}
            style={{
              padding: '0 24px',
              height: 48,
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "'Public Sans', sans-serif",
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: historyTab === 'spending' ? 'hsl(var(--primary))' : 'transparent',
              color: historyTab === 'spending' ? '#fff' : 'hsl(var(--on-surface-muted))',
              minWidth: 180
            }}
          >
            Spending & allocation
            {historyTab === 'spending' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, justifyContent: 'flex-end' }} className="sm:flex-row sm:items-center">
          <div style={{ position: 'relative', width: '100%', maxWidth: 448 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>search</span>
            <input aria-label="Search mobilization ledger" name="searchQuery" id="input-a34c64" 
              type="text"
              placeholder="Search mobilization ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                height: 48, 
                paddingLeft: 48, 
                paddingRight: 16, 
                background: '#fff', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: 4, 
                fontSize: 13, 
                fontWeight: 700, 
                fontFamily: "'Public Sans', sans-serif",
                outline: 'none'
              }}
            />
          </div>
          {historyTab === 'contributions' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                onClick={() => setContributionFilter('all')}
                style={{
                  height: 48,
                  padding: '0 20px',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'Public Sans', sans-serif",
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: contributionFilter === 'all' ? 'none' : '1px solid hsl(var(--border))',
                  background: contributionFilter === 'all' ? 'hsl(var(--primary))' : '#fff',
                  color: contributionFilter === 'all' ? '#fff' : 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                All records
                {contributionFilter === 'all' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
              </button>
              <button 
                onClick={() => setContributionFilter('me')}
                style={{
                  height: 48,
                  padding: '0 20px',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'Public Sans', sans-serif",
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: contributionFilter === 'me' ? 'none' : '1px solid hsl(var(--border))',
                  background: contributionFilter === 'me' ? 'hsl(var(--primary))' : '#fff',
                  color: contributionFilter === 'me' ? '#fff' : 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                My records
                {contributionFilter === 'me' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ width: '100%' }}>
          <div style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: 32 }}>
              <LiveContributionFeed />
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%' }}>
          <div style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 32, borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.01em', fontSize: 18, margin: 0, flex: 1 }}>Tactical deployment ledger</h3>
              <button onClick={onDownload} className="btn btn-primary btn-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span> Export CSV
              </button>
            </div>

            {/* desktop table */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} className="table">
                <thead>
                  <tr>
                    <th style={{ padding: 24 }}>deployment details</th>
                    <th style={{ padding: 24 }}>capital</th>
                    <th style={{ padding: 24 }}>channel</th>
                    <th style={{ padding: 24 }}>verification</th>
                    <th style={{ padding: 24, textAlign: 'right' }}>audit</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 64, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12, fontWeight: 700, fontStyle: 'italic' }}>
                        synchronizing tactical ledger...
                      </td>
                    </tr>
                  ) : historyTab === 'contributions' ? (
                    (() => {
                      const data = contributionFilter === 'all' ? publicHistory : personalHistory
                      const filtered = data.filter(item => 
                        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.amount.includes(searchQuery)
                      )
                      return filtered.length > 0 ? (
                        filtered.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: 24 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{item.fullName}</p>
                            <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', margin: 0 }}>{item.campaignTitle || 'Strategic Fund'}</p>
                            <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 700, margin: '4px 0 0' }}>{item.date}</p>
                          </div>
                        </td>
                        <td style={{ padding: 24 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>
                            {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                          </span>
                        </td>
                        <td style={{ padding: 24 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>{item.method}</span>
                        </td>
                        <td style={{ padding: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ 
                              width: 8, height: 8, borderRadius: '50%', 
                              background: item.status === 'Verified' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                              boxShadow: item.status === 'Verified' ? '0 0 8px hsl(var(--primary))' : '0 0 8px hsl(var(--accent))'
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))' }}>{item.status}</span>
                          </div>
                        </td>
                        <td style={{ padding: 24, textAlign: 'right' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--border))', fontFamily: 'monospace' }}>{item.reference}</span>
                        </td>
                      </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ padding: 64, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12, fontWeight: 700, fontStyle: 'italic' }}>
                            no records found matching search.
                          </td>
                        </tr>
                      )
                    })()
                  ) : (
                    spendingHistory.length > 0 ? (
                      spendingHistory.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: 24 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <p style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{item.description}</p>
                              <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--destructive))', textTransform: 'uppercase', margin: 0 }}>{item.chapter} Hub • {item.category}</p>
                              <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 700, margin: '4px 0 0' }}>{item.date}</p>
                            </div>
                          </td>
                          <td style={{ padding: 24 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>
                              {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                            </span>
                          </td>
                          <td style={{ padding: 24 }}>
                            <span style={{ 
                              fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 2, textTransform: 'uppercase',
                              background: item.type === 'Expenditure' ? 'hsla(var(--destructive), 0.1)' : 'hsla(var(--primary), 0.1)',
                              color: item.type === 'Expenditure' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
                            }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>verified</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface))' }}>Audited</span>
                            </div>
                          </td>
                          <td style={{ padding: 24, textAlign: 'right' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--border))', fontFamily: 'monospace' }}>{item.id}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 64, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12, fontWeight: 700, fontStyle: 'italic' }}>
                          no allocation records found.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* mobile card view */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const data = contributionFilter === 'all' ? publicHistory : personalHistory
                const filtered = data.filter(item => 
                  item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  item.amount.includes(searchQuery)
                )
                return filtered.length > 0 ? (
                  filtered.map((item, idx) => (
                    <div key={idx} style={{ padding: 32, borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--on-surface))', margin: 0, textTransform: 'lowercase' }}>{item.fullName}</p>
                          <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>{item.date}</p>
                        </div>
                        <span style={{ 
                          padding: '4px 10px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 4,
                          background: 'hsla(var(--primary), 0.08)', color: 'hsl(var(--primary))'
                        }}>
                          Verified
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', marginBottom: 4 }}>capital deployment</p>
                          <p style={{ fontSize: 20, fontWeight: 900, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>
                            {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', marginBottom: 4 }}>channel</p>
                          <p style={{ fontSize: 10.5, fontWeight: 900, color: 'hsl(var(--on-surface))', margin: 0 }}>{item.method}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 64, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12, fontWeight: 700, fontStyle: 'italic' }}>
                    no records matching search.
                  </div>
                )
              })()}
            </div>

            <div style={{ padding: 32, background: 'hsl(var(--container-low))', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>live mobilization ledger</p>
              <button onClick={onOpenAudit} className="btn btn-primary btn-sm">
                Full operational audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
