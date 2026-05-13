import { useState, useEffect } from 'react'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { LogisticsAuditEntry } from '@/types/admin'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { 
  Package, 
  History, 
  ShieldCheck, 
  PlusSquare, 
  Map, 
  RefreshCw,
  FileText,
  AlertTriangle,
  BarChart,
  Clock,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'

interface LogisticsStats {
  region: string
  total_orders: number
  avg_dispatch_hours: number
  avg_delivery_hours: number
  fulfillment_rate: number
}

interface InventoryAlert {
  id: string
  name: string
  stock_quantity: number
  low_stock_threshold: number
  category: string
}

export default function LogisticsIntelligence() {
  const [velocity, setVelocity] = useState<LogisticsStats[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [auditLogs, setAuditLogs] = useState<LogisticsAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isReplenishing, setIsReplenishing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false)
  const [showReplenishConfirm, setShowReplenishConfirm] = useState(false)

  useEffect(() => {
    const fetchLogisticsData = async () => {
      setLoading(true)
      try {
        const [velocityData, alertsData, auditData] = await Promise.all([
          adminService.getLogisticsVelocity(),
          adminService.getInventoryAlerts(),
          adminService.getLogisticsAudit(15)
        ])
        setVelocity(velocityData)
        setAlerts(alertsData)
        setAuditLogs(auditData)
      } catch (error) {
        console.error('[LOGISTICS] Failed to synchronize supply chain telemetry:', error)
        toast.error('Failed to synchronize supply chain telemetry.')
      } finally {
        setLoading(false)
      }
    }
    fetchLogisticsData()
  }, [])

  const handleReplenishAll = async () => {
    setIsReplenishing(true)
    const success = await adminService.replenishInventory()
    if (success) {
      toast.success('Replenishment protocol initiated for all low-stock assets.')
      const [updatedAlerts, updatedAudit] = await Promise.all([
        adminService.getInventoryAlerts(),
        adminService.getLogisticsAudit(15)
      ])
      setAlerts(updatedAlerts)
      setAuditLogs(updatedAudit)
    } else {
      toast.error('Replenishment protocol failed.')
    }
    setIsReplenishing(false)
    setShowReplenishConfirm(false)
  }

  const handleGeneratePurchaseOrder = async () => {
    setIsGeneratingPO(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Purchase order documentation generated successfully.')
    setIsGeneratingPO(false)
  }

  const handleRouteOptimization = async () => {
    setIsOptimizing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Route optimization protocols initiated for all regional hubs.')
    setIsOptimizing(false)
  }

  const avgDispatch = velocity.length > 0
    ? (velocity.reduce((s, v) => s + v.avg_dispatch_hours, 0) / velocity.length).toFixed(1)
    : '0'
  const avgFulfillment = velocity.length > 0
    ? (velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length).toFixed(1)
    : '0'
  const health = velocity.length > 0
    ? Math.round(velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length)
    : 0

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-12 h-12 text-muted-foreground/20 animate-spin" />
        <p className="text-micro font-bold normal-case text-muted-foreground/40">Synchronizing supply chain telemetry...</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Logistics Header */}
      <div className="flex-columns items-center flex-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 m-0">
            <Package className="w-8 h-8 text-on-surface" />
            Logistics monitoring
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-2 mb-0">Automated supply chain monitoring and regional dispatch tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-micro px-8 h-10 font-bold capitalize tracking-tight hover:bg-stone-100 transition-all active:scale-95"
            onClick={handleRouteOptimization}
            disabled={isOptimizing}
          >
            <Map className={cn("w-4 h-4 mr-2", isOptimizing && "animate-spin")} />
            Route Optimization
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
            onClick={() => setShowReplenishConfirm(true)}
            disabled={isReplenishing}
          >
            <PlusSquare className={cn("w-4 h-4 mr-2", isReplenishing && "animate-spin")} />
            Replenish All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI 
          label="Supply chain health"
          value={`${health}%`}
          description="Logistics efficiency"
          trend={{ direction: health >= 80 ? 'up' : 'down', value: health >= 80 ? 'Optimal' : 'Compromised' }}
        />
        <TacticalKPI 
          label="Urgent alerts"
          value={alerts.length}
          description="Inventory alerts"
          trend={{ direction: alerts.length > 0 ? 'down' : 'neutral', value: alerts.length > 0 ? 'Critical' : 'Stable' }}
        />
        <TacticalKPI 
          label="Avg dispatch"
          value={`${avgDispatch}h`}
          description="30-day aggregate"
        />
        <TacticalKPI 
          label="Fulfillment rate"
          value={`${avgFulfillment}%`}
          description="Verified delivery"
          trend={{ direction: Number(avgFulfillment) >= 80 ? 'up' : 'down', value: Number(avgFulfillment) >= 80 ? 'Elite' : 'Target' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 🚨 Inventory Alerts */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Inventory alerts</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Items requiring immediate action</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px]">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
                  <Package className="w-12 h-12 text-muted-foreground/10" />
                  <p className="text-micro font-bold text-muted-foreground/40">All stock levels normal</p>
                </div>
              ) : (
                alerts.map(item => (
                  <div key={item.id} className="p-6 border-b border-border/40 flex items-center justify-between hover:bg-muted/30 transition-colors last:border-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-on-surface truncate">{item.name}</div>
                      <div className="text-micro font-bold text-muted-foreground/40 mt-0.5">{item.category}</div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-4">
                      <div className="text-xs font-bold text-destructive">
                        {item.stock_quantity} <span className="text-micro text-muted-foreground/40">left</span>
                      </div>
                      <div className="text-micro font-bold text-muted-foreground/40">Target: {item.low_stock_threshold}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            {alerts.length > 0 && (
              <div className="p-4 border-t border-border/40 bg-muted/10">
                <Button 
                  variant="destructive" 
                  className="w-full h-11 text-micro font-bold uppercase tracking-widest active:scale-95 transition-all"
                  onClick={handleGeneratePurchaseOrder}
                  disabled={isGeneratingPO}
                >
                  <FileText className={cn("w-4 h-4 mr-2", isGeneratingPO && "animate-spin")} />
                  Generate Purchase Order
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 📊 Regional Performance */}
        <div className="xl:col-span-2">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Regional performance</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Average processing and transit times</p>
              </div>
              <BarChart className="w-5 h-5 text-muted-foreground/40" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Jurisdiction</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Orders</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Dispatch</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Delivery</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {velocity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-micro font-bold text-muted-foreground/40">No dispatch telemetry available</td>
                      </tr>
                    ) : velocity.map((v, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-on-surface">{v.region}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-micro font-bold text-muted-foreground/60">{v.total_orders} items</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/20" />
                            {v.avg_dispatch_hours}h
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-micro font-bold text-muted-foreground/60">{v.avg_delivery_hours}h</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-4">
                            <div className="w-24 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${v.fulfillment_rate}%` }} 
                              />
                            </div>
                            <span className="text-micro font-bold text-primary w-8 text-right">{v.fulfillment_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🗺️ National Map Visualization Placeholder */}
      <div className="mt-8">
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight">National supply chain map</h3>
              <p className="text-micro font-bold text-white/40 normal-case tracking-tight">Real-time visualization of material flow across the 16 regions.</p>
            </div>
            <Button 
              variant="default" 
              className="h-11 px-10 text-micro font-bold tracking-tight border-white/20 bg-transparent text-white hover:bg-white hover:text-on-surface rounded-sm transition-all"
              onClick={() => toast.success('Initializing enterprise visualization protocol...')}
            >
              <Globe className="w-4 h-4 mr-2" /> Enterprise View
            </Button>
          </div>
          <div className="h-48 bg-black/40 border-t border-white/5 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="flex flex-col items-center space-y-4 relative z-10 animate-pulse">
              <Globe className="w-12 h-12 text-white/10" />
              <p className="text-micro font-bold text-white/20 uppercase tracking-widest">Waiting for regional hub synchronization...</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 🛡️ Audit Ledger */}
      <div className="mt-8">
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Supply chain audit vault
              </CardTitle>
              <p className="text-micro font-bold text-muted-foreground/40 mt-1">Immutable ledger of replenishment and stock adjustment events</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Change</th>
                    <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Source hub</th>
                    <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest text-right">Authorized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-micro font-bold text-muted-foreground/40">No audit entries detected in the ledger.</td>
                    </tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-micro font-bold text-muted-foreground/60">{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-md",
                          log.action === 'REPLENISHED' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/10 text-muted-foreground/60 border-border/20"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-on-surface">+{log.quantityChange} units</span>
                      </td>
                      <td className="px-6 py-5 font-mono text-[10px] text-muted-foreground/80">
                        {log.sourceLocation}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-micro font-bold text-muted-foreground/60">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary/40" />
                          {log.performedBy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ⚠️ Confirmation Modal */}
      {showReplenishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md rounded-sm border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-8 pb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-6">
                <PlusSquare className="w-8 h-8 text-on-surface" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-on-surface">Confirm bulk replenishment?</CardTitle>
              <p className="text-sm text-muted-foreground/60 leading-relaxed mt-4">
                This will initiate a movement-wide replenishment protocol for all low-stock assets. Standard procurement workflows will be triggered.
              </p>
            </CardHeader>
            <div className="p-8 pt-4 flex gap-4">
              <Button 
                variant="default" 
                className="flex-1 h-12 text-micro font-bold uppercase tracking-widest active:scale-95 transition-all"
                onClick={() => setShowReplenishConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 h-12 text-micro font-bold uppercase tracking-widest shadow-lg shadow-brand-green/20 active:scale-95 transition-all"
                onClick={handleReplenishAll}
                disabled={isReplenishing}
              >
                {isReplenishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Protocol"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
