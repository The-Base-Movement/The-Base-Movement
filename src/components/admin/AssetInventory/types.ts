export type AssetCondition = 'good' | 'fair' | 'damaged'
export type ViewMode = 'department' | 'master'

export interface AssetCategory {
  id: string
  name: string
  department_id: string | null
  created_at: string
  lifespan_years: number
}

export interface Asset {
  id: string
  name: string
  category_id: string
  department_id: string
  condition: AssetCondition
  serial_number: string | null
  description: string | null
  created_at: string
  // joined
  category_name: string
  assigned_to_id: string | null
  assigned_to_name: string | null
  assignment_id: string | null
  // Phase A extension
  purchase_price: number | null
  purchase_date: string | null
  asset_tag: string | null
  qr_code_url: string | null
}

export interface AssetAssignment {
  id: string
  asset_id: string
  assigned_to: string
  assigned_to_name: string
  checked_out_at: string
  checked_in_at: string | null
  expected_return_date: string | null
  notes: string | null
}

export interface MaintenanceLog {
  id: string
  asset_id: string
  logged_by: string
  logged_by_name: string
  note: string
  condition_after: AssetCondition
  created_at: string
}

export interface AssetDetail {
  asset: Asset
  assignments: AssetAssignment[]
  maintenanceLogs: MaintenanceLog[]
}

export interface AssetInventoryProps {
  departmentId: string
  viewMode: ViewMode
}

export interface AssetRequest {
  id: string
  asset_id: string
  asset_name: string
  requested_by: string
  requester_name: string
  department_id: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  reviewed_by: string | null
  review_note: string | null
  expected_return_date: string | null
  created_at: string
}

export interface AssetAlert {
  id: string
  asset_id: string
  assignment_id: string | null
  alert_type: 'overdue' | 'damaged' | 'missing'
  resolved: boolean
  created_at: string
}
