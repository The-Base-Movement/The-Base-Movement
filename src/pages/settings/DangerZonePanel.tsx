export function DangerZonePanel() {
  return (
    <div
      style={{
        marginTop: 8,
        padding: '20px 22px',
        border: '2px dashed hsl(var(--destructive) / 25%)',
        borderRadius: 6,
        background: 'hsl(var(--destructive) / 3%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'hsl(var(--destructive))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              warning
            </span>
            Danger zone
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              maxWidth: 420,
              lineHeight: 1.55,
            }}
          >
            Deactivating your account will permanently delete all your contribution history and
            movement records. This action cannot be undone.
          </p>
        </div>
        <button type="button" className="btn btn-dest btn-sm">
          Deactivate membership
        </button>
      </div>
    </div>
  )
}
