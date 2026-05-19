import type { InventoryItem, ResourceRequest } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface StoreStatsOverviewProps {
  products: InventoryItem[]
  requests: ResourceRequest[]
  lowStockItems: InventoryItem[]
}

export function StoreStatsOverview({ products, requests, lowStockItems }: StoreStatsOverviewProps) {
  const stockValue = products.reduce(
    (acc, p) => acc + parseFloat(p.price.replace(/[^0-9.-]+/g, '')) * p.stock,
    0
  )
  const pendingRequests = requests.filter((r) => r.status === 'Pending').length
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0)

  const total = requests.length
  const delivered = requests.filter((r) => r.status === 'Delivered').length
  const processing = requests.filter(
    (r) => r.status === 'Approved' || r.status === 'Dispatched'
  ).length
  const rejected = requests.filter((r) => r.status === 'Rejected').length

  const deliveredPct = total > 0 ? Math.round((delivered / total) * 100) : 0
  const processingPct = total > 0 ? Math.round((processing / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0

  return (
    <>
      <div className="kpis">
        <TacticalKPI
          label="Inventory alerts"
          value={lowStockItems.length}
          description={lowStockItems.length > 0 ? 'Replenishment required' : 'Supply chain stable'}
          trend={
            lowStockItems.length > 0
              ? { direction: 'down', value: 'Alert' }
              : { direction: 'neutral', value: 'Optimal' }
          }
        />
        <TacticalKPI
          label="Active requests"
          value={pendingRequests}
          description={pendingRequests > 0 ? 'Pending HQ approval' : 'All processed'}
          trend={
            pendingRequests > 0
              ? { direction: 'up', value: 'Action' }
              : { direction: 'neutral', value: 'Live' }
          }
        />
        <TacticalKPI
          label="Stock units"
          value={totalStockUnits.toLocaleString()}
          description={`Across ${products.length} catalog items`}
        />
        <TacticalKPI
          label="Stock value"
          value={`₵${stockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Movement asset valuation"
          trend={{ direction: 'up', value: 'Elite' }}
        />
      </div>

      {/* Fulfillment intelligence */}
      {requests.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="ph">
            <h3>Fulfillment intelligence</h3>
            <span className="meta">Live metrics</span>
          </div>
          <div
            style={{
              padding: '18px 22px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0 32px',
            }}
          >
            {[
              { label: 'Delivered', pct: deliveredPct, color: 'hsl(var(--primary))' },
              { label: 'In progress', pct: processingPct, color: 'hsl(var(--accent))' },
              { label: 'Rejected', pct: rejectedPct, color: 'hsl(var(--destructive))' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'hsl(var(--border))',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: color,
                      borderRadius: 99,
                      width: `${pct}%`,
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
