interface MembersBulkBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkVerify: () => void
  onBulkAssign: () => void
  onBulkDelete: () => void
}

export function MembersBulkBar({
  selectedCount,
  onClearSelection,
  onBulkVerify,
  onBulkAssign,
  onBulkDelete,
}: MembersBulkBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#0f1310,#1f2620)',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'rgba(255,255,255,.9)',
          }}
        >
          {selectedCount} member{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,.5)',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn-sm"
          onClick={onBulkVerify}
          style={{
            background: 'rgba(0,107,63,.25)',
            color: '#fff',
            border: '1px solid rgba(0,107,63,.4)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            verified_user
          </span>
          Verify
        </button>
        <button
          className="btn btn-sm"
          onClick={onBulkAssign}
          style={{
            background: 'rgba(255,255,255,.08)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.15)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            assignment_ind
          </span>
          Assign
        </button>
        <button
          className="btn btn-sm"
          onClick={onBulkDelete}
          style={{
            background: 'rgba(206,17,38,.2)',
            color: '#f87171',
            border: '1px solid rgba(206,17,38,.35)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            delete
          </span>
          Remove
        </button>
      </div>
    </div>
  )
}
