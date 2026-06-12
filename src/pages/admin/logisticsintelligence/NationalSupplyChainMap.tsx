import { LogisticsMap } from '@/components/admin/LogisticsMap'

interface NationalSupplyChainMapProps {
  data: { region: string; fulfillment_rate: number }[]
  routes: { region: string; count: number }[]
  inventory: { region: string; total_stock: number }[]
  onEnterpriseView: () => void
}

export function NationalSupplyChainMap({
  data,
  routes,
  inventory,
  onEnterpriseView,
}: NationalSupplyChainMapProps) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  return (
    <div
      style={{
        marginTop: 24,
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        className="logistics-map-header"
        style={{
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 17,
              color: 'hsl(var(--on-surface))',
              marginBottom: 6,
            }}
          >
            National supply chain map
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            Live dispatch routes and regional inventory across all 16 regions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {routes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  animation: 'pulse 1.4s infinite',
                }}
              />
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {routes.length} active route{routes.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <button
            className="btn btn-outline"
            style={{
              color: 'hsl(var(--on-surface))',
              borderColor: 'hsl(var(--border))',
              background: 'transparent',
            }}
            onClick={onEnterpriseView}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              public
            </span>
            Enterprise view
          </button>
        </div>
      </div>
      <div
        style={{
          height: 500,
          background: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
          position: 'relative',
        }}
      >
        <LogisticsMap data={data} token={mapboxToken} routes={routes} inventory={inventory} />
      </div>
    </div>
  )
}
