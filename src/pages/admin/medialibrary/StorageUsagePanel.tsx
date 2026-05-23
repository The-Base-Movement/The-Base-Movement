export function StorageUsagePanel() {
  return (
    <div
      style={{
        background: 'hsl(var(--on-surface))',
        borderRadius: 6,
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            background: 'rgba(0,107,63,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 24, color: 'hsl(var(--primary))' }}
          >
            storage
          </span>
        </div>
        <div>
          <h4
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              color: '#fff',
              marginBottom: 2,
            }}
          >
            Cloud storage intelligence
          </h4>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Real-time usage monitoring for Supabase storage buckets.
          </p>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Capacity utilization
          </span>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 11,
              color: 'hsl(var(--primary))',
            }}
          >
            12%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '12%',
              background: 'hsl(var(--primary))',
              borderRadius: 99,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            0.6 GB consumed
          </span>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            5.0 GB limit
          </span>
        </div>
      </div>
    </div>
  )
}
