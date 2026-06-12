import { useNavigate } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export function BroadcastHeader() {
  const navigate = useNavigate()
  return (
    <AdminPageHeader
      title="Communication hub"
      icon="campaign"
      description="Platform-wide transmission and regional mobilization protocols."
      actions={
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/admin/broadcasts/new')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            add
          </span>
          New broadcast
        </button>
      }
    />
  )
}
