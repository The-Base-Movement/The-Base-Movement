import { Button } from '@/components/ui/neon-button'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { toast as ToastFn } from 'sonner'

type InterfaceDensity = 'Comfortable' | 'Compact' | 'High Density';

interface SystemPreferencesTabProps {
  interfaceDensity: InterfaceDensity
  setInterfaceDensity: (mode: InterfaceDensity) => void
  toast: typeof ToastFn
}

export function SystemPreferencesTab({
  interfaceDensity,
  setInterfaceDensity,
  toast
}: SystemPreferencesTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
        <CardTitle className="text-sm font-bold text-stone-900">Preferences</CardTitle>
        <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Configure your personal interface and notification behavior.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-10">
        <div className="space-y-6">
          <p className="text-micro font-bold text-stone-400 normal-case">Interface density</p>
          <div className="grid grid-cols-3 gap-4">
            {(['Comfortable', 'Compact', 'High Density'] as InterfaceDensity[]).map((mode) => (
              <Button 
                key={mode} 
                variant={mode === interfaceDensity ? "primary" : "outline"}
                onClick={() => {
                  setInterfaceDensity(mode)
                  localStorage.setItem('admin_interface_density', mode)
                  toast.success(`Density set to ${mode}`)
                  // Trigger a global style update if needed
                  window.dispatchEvent(new Event('admin_density_changed'))
                }}
                className={cn(
                  "p-4 rounded-sm border text-micro font-bold tracking-tight transition-all text-center h-12 active:scale-95",
                  mode === interfaceDensity 
                    ? "shadow-lg shadow-brand-green/20" 
                    : "border-stone-200/20 text-stone-400 hover:border-white/20 hover:bg-white/5"
                )}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-px bg-stone-100" />

        <div className="space-y-6">
          <p className="text-micro font-bold text-stone-400 normal-case">Notifications</p>
          <div className="space-y-4">
            {[
              { id: 'reg', label: 'New Member Registrations', desc: 'Real-time alerts for regional growth' },
              { id: 'sec', label: 'Security Login Alerts', desc: 'Notify on new device recognition' },
              { id: 'audit', label: 'Critical Audit Events', desc: 'Alert on system modification' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50">
                <div>
                  <p className="text-xs font-bold text-stone-900">{item.label}</p>
                  <p className="text-micro text-stone-400 font-medium">{item.desc}</p>
                </div>
                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1 cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
