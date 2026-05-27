import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

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
    <AdminPageHeader
      title="Member directory"
      icon="groups"
      description="Movement registration database, identity verification, and regional deployment oversight."
      actions={
        <>
          <button
            className="btn btn-outline btn-sm"
            onClick={onExport}
            disabled={isExporting || membersCount === 0}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              download
            </span>
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onImportCSV}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              publish
            </span>
            Import CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAddMember}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              person_add
            </span>
            Add member
          </button>
        </>
      }
    />
  )
}
