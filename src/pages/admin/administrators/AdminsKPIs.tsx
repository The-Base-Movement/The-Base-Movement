import { TacticalKPI } from '@/components/admin/TacticalKPI'
import type { AdminUser } from '@/services/adminService'

const isHighPrivilege = (role: string) => role === 'SUPER_ADMIN' || role === 'FOUNDER'

interface AdminsKPIsProps {
  admins: AdminUser[]
}

export function AdminsKPIs({ admins }: AdminsKPIsProps) {
  return (
    <div className="kpis" style={{ marginBottom: 0 }}>
      <TacticalKPI
        label="Total Admins"
        value={admins.length}
        variant="red"
        description="Authorized platform overseers"
        delta="▲ Stable"
      />
      <TacticalKPI
        label="Super Admins"
        value={admins.filter((a) => isHighPrivilege(a.role)).length}
        variant="gold"
        description="Tier-1 security clearance"
        delta="High Risk"
      />
      <TacticalKPI
        label="Regional Leads"
        value={admins.filter((a) => a.role === 'REGIONAL_DIRECTOR').length}
        variant="black"
        description="Zonal operations command"
        delta="Coordinated"
      />
      <TacticalKPI
        label="Security Status"
        value="Online"
        variant="green"
        description="Encrypted administrative link"
        trend={{ direction: 'up', value: 'Active' }}
      />
    </div>
  )
}
