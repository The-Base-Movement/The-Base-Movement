import type { DonationCampaign } from '@/types/admin'

interface StrategicPrioritiesSidebarProps {
  campaigns: DonationCampaign[]
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export function StrategicPrioritiesSidebar({
  campaigns,
  searchQuery,
  setSearchQuery,
}: StrategicPrioritiesSidebarProps) {
  return (
    <aside
      className="desktop-only"
      style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}
    >
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ph" style={{ padding: '12px 18px' }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Tactical filters
          </span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              htmlFor="input-09c328"
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Search priorities
            </label>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface-muted))',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                aria-label="Keywords"
                name="searchQuery"
                id="input-09c328"
                placeholder="Keywords..."
                style={{
                  width: '100%',
                  height: 38,
                  paddingLeft: 34,
                  paddingRight: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  outline: 'none',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 12,
                  boxSizing: 'border-box',
                  color: 'hsl(var(--on-surface))',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Intelligence summary
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Total Active
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                  }}
                >
                  {campaigns.filter((c) => c.status === 'Active').length}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Success Rate
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--accent))',
                  }}
                >
                  {campaigns.length > 0
                    ? (
                        (campaigns.filter((c) => c.raisedAmount / c.targetAmount >= 1).length /
                          campaigns.length) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="panel"
        style={{ background: 'hsl(var(--on-surface))', color: '#fff', padding: 24 }}
      >
        <h4
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            margin: '0 0 12px',
          }}
        >
          Tactical awareness
        </h4>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Setting strategic priorities allows the movement to synchronize resource allocation across
          multiple regional cells.
        </p>
      </div>
    </aside>
  )
}
