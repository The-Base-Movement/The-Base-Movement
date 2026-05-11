import { Shield, Globe, Users, History } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function RolesManagementTab() {
  const roles = [
    { role: 'Super Admin', desc: 'Full system sovereignty and configuration rights.', count: 2, icon: Shield, color: 'text-[var(--brand-red)]' },
    { role: 'Regional Admin', desc: 'Operational oversight within assigned regional boundaries.', count: 16, icon: Globe, color: 'text-stone-900' },
    { role: 'Chapter Lead', desc: 'Local verification and mobilization management.', count: 124, icon: Users, color: 'text-stone-900' },
    { role: 'Audit View', desc: 'Read-only access to financial and telemetry streams.', count: 4, icon: History, color: 'text-stone-500' },
  ]

  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
        <CardTitle className="text-sm font-bold text-stone-900">Administrative Roles</CardTitle>
        <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Summary of active permission tiers across the movement infrastructure.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-stone-50">
          {roles.map((item) => (
            <div key={item.role} className="p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-sm bg-stone-100 flex items-center justify-center", item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{item.role}</p>
                  <p className="text-micro text-stone-400 font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-stone-50 border border-stone-100 rounded-full text-micro font-bold text-stone-400 normal-case">
                {item.count} active
              </span>
            </div>
          ))}
        </div>
        <div className="p-8 bg-stone-50/50 border-t border-stone-100 text-center">
          <p className="text-micro text-stone-400 font-medium italic">Role assignments are managed by System Administrators only.</p>
        </div>
      </CardContent>
    </Card>
  )
}
