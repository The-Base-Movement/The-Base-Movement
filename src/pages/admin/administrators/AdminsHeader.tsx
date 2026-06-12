import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface AdminsHeaderProps {
  onProvision: () => void
}

export function AdminsHeader({ onProvision }: AdminsHeaderProps) {
  return (
    <AdminPageHeader
      title="Administrators"
      icon="shield"
      description="Authorized personnel with leadership credentials and platform oversight."
      actions={
        <button className="btn btn-primary btn-sm" onClick={onProvision}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            person_add
          </span>
          Provision Credentials
        </button>
      }
      style={{ marginBottom: 0 }}
    />
  )
}
