import type { DonationCampaign } from '@/types/admin'

interface DashboardCampaignsListProps {
  campaigns: DonationCampaign[]
  loading: boolean
  selectedCampaignId: string
  onSelectCampaign: (id: string) => void
}

export function DashboardCampaignsList({
  campaigns,
  loading,
  selectedCampaignId,
  onSelectCampaign,
}: DashboardCampaignsListProps) {
  return (
    <div className="panel">
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Active Campaigns
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontWeight: 500,
            }}
          >
            Click a campaign to select it for your contribution
          </p>
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 110,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                }}
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 13,
            }}
          >
            No active campaigns at this time.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {campaigns.map((c) => {
              const pct = Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
              const isSelected = selectedCampaignId === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c.id)}
                  style={{
                    border: isSelected
                      ? '2px solid hsl(var(--primary))'
                      : '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: 14,
                    cursor: 'pointer',
                    background: isSelected ? 'hsla(var(--primary), 0.04)' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 4px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {c.title}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 600,
                      margin: '0 0 10px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </p>
                  <div
                    style={{
                      height: 4,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 99,
                      overflow: 'hidden',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'hsl(var(--primary))',
                        transition: 'width 1s ease-out',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                      }}
                    >
                      {pct}% funded
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      ₵ {c.raisedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
