interface MembersHeaderProps {
  isExporting: boolean
  membersCount: number
  onExport: () => void
  onAddMember: () => void
  onImportCSV: () => void
}

export function MembersHeader({
  isExporting,
  membersCount,
  onExport,
  onAddMember,
  onImportCSV,
}: MembersHeaderProps) {
  return (
    <div className="top">
      <div>
        <h2 style={{ margin: '4px 0 0' }}>Member directory</h2>
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 12.5,
            marginTop: 4,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
          }}
        >
          Movement registration database, identity verification, and regional deployment oversight.
        </p>
      </div>
      <div className="actions">
        <button
          className="btn btn-outline"
          onClick={onExport}
          disabled={isExporting || membersCount === 0}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            download
          </span>
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
        <button className="btn btn-outline" onClick={onImportCSV}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            publish
          </span>
          Import CSV
        </button>
        <button className="btn btn-primary" onClick={onAddMember}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            person_add
          </span>
          Add member
        </button>
      </div>
    </div>
  )
}
