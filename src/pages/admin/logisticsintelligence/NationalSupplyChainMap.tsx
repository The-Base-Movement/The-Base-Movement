import { LogisticsMap } from '@/components/admin/LogisticsMap'

interface NationalSupplyChainMapProps {
  data: { region: string; fulfillment_rate: number }[]
  onEnterpriseView: () => void
}

export function NationalSupplyChainMap({ data, onEnterpriseView }: NationalSupplyChainMapProps) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  return (
    <div
      style={{
        marginTop: 24,
        background: 'hsl(var(--on-surface))',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
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
              color: '#fff',
              marginBottom: 6,
            }}
          >
            National supply chain map
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Real-time visualization of material flow across the 16 regions.
          </p>
        </div>
        <button
          className="btn btn-outline"
          style={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.2)',
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
      <div
        style={{
          height: 500,
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
        }}
      >
        <LogisticsMap data={data} token={mapboxToken} />
      </div>
    </div>
  )
}
