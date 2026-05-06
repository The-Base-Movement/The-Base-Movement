import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Map,
  Filter,
  FileText,
  PackagePlus,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { adminService } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const [loading, setLoading] = useState(true)
  const [isReplenishing, setIsReplenishing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false)
  const [showReplenishConfirm, setShowReplenishConfirm] = useState(false)

  useEffect(() => {
    const fetchLogisticsData = async () => {
      setLoading(true)
      try {
        const [velocityData, alertsData] = await Promise.all([
          adminService.getLogisticsVelocity(),
          adminService.getInventoryAlerts()
        ])
        setVelocity(velocityData)
        setAlerts(alertsData)
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success('Replenishment protocol initiated for all low-stock assets.')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border/40 border-t-primary animate-spin" />
          <p className="text-[10px] font-bold normal-case text-primary">Synchronizing supply chain telemetry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header & Tactical Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-on-surface" />
            Logistics monitoring
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Automated supply chain monitoring and regional dispatch tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleRouteOptimization}
            disabled={isOptimizing}
            className="rounded-sm border-border/40 text-on-surface/80 text-[10px] px-10 font-black uppercase tracking-[0.2em] hover:bg-stone-50 h-12 transition-all active:scale-95"
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />} 
            Route Optimization
          </Button>
          <Button 
            variant="primary"
            size="lg"
            onClick={() => setShowReplenishConfirm(true)}
            disabled={isReplenishing}
            className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02]"
          >
            {isReplenishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackagePlus className="w-4 h-4 mr-2" />} 
            Replenish All
          </Button>
        </div>
      </div>

      {/* 📊 High-Impact Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {(() => {
          const avgDispatch = velocity.length > 0 
            ? (velocity.reduce((sum, v) => sum + v.avg_dispatch_hours, 0) / velocity.length).toFixed(1) 
            : '0'
          const avgFulfillment = velocity.length > 0 
            ? (velocity.reduce((sum, v) => sum + v.fulfillment_rate, 0) / velocity.length).toFixed(1) 
            : '0'
          const health = velocity.length > 0
            ? Math.round(velocity.reduce((sum, v) => sum + v.fulfillment_rate, 0) / velocity.length)
            : 0

          return [
            { 
              label: 'Supply Chain Health', 
              value: `${health}%`, 
              sub: 'Logistics Efficiency', 
              icon: health >= 80 ? CheckCircle2 : AlertTriangle, 
              color: health >= 80 ? 'text-primary' : health >= 51 ? 'text-accent' : 'text-destructive',
              className: 'col-span-2 md:col-span-1'
            },
            { label: 'Urgent Alerts', value: alerts.length, sub: 'Inventory Alerts', icon: AlertTriangle, color: alerts.length > 0 ? 'text-destructive' : 'text-muted-foreground/80' },
            { label: 'Avg Dispatch', value: `${avgDispatch}h`, sub: '30 Day Aggregate', icon: Clock, color: 'text-blue-500' },
            { 
              label: 'Fulfillment Rate', 
              value: `${avgFulfillment}%`, 
              sub: 'Verified Delivery', 
              icon: Number(avgFulfillment) >= 80 ? TrendingUp : AlertTriangle, 
              color: Number(avgFulfillment) >= 80 ? 'text-orange-500' : Number(avgFulfillment) >= 51 ? 'text-accent' : 'text-destructive',
              className: 'col-span-2 md:col-span-1'
            },
          ].map((stat, i) => (
            <Card key={i} className={cn("rounded-sm border-border/60 shadow-sm bg-white p-6 hover:border-on-surface/40 transition-colors", stat.className)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold normal-case text-muted-foreground/80">{stat.label}</span>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-black tracking-tighter text-on-surface">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground/80 normal-case mt-1">{stat.sub}</p>
              </div>
            </Card>
          ))
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🚨 Inventory Intelligence (Urgent) */}
        <Card className="lg:col-span-1 rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold normal-case font-meta">Inventory alerts</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/80 mt-1">Items requiring immediate replenishment.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-8 h-8 text-border/60 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-muted-foreground/80 normal-case">All stock levels normal</p>
                </div>
              ) : (
                alerts.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-bold normal-case tracking-tight text-on-surface">{item.name}</p>
                      <p className="text-[8px] text-muted-foreground/80 font-bold normal-case mt-1">{item.category.toLowerCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-destructive">{item.stock_quantity} <span className="text-[8px] text-muted-foreground/40 font-bold normal-case ml-1">in stock</span></p>
                      <p className="text-[8px] text-muted-foreground/80 font-bold normal-case mt-1">Threshold: {item.low_stock_threshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {alerts.length > 0 && (
            <div className="p-4 bg-muted/30 border-t border-border/40 flex justify-end">
              <Button 
                variant="primary"
                onClick={handleGeneratePurchaseOrder}
                disabled={isGeneratingPO}
                className="bg-destructive text-white hover:bg-destructive/90 rounded-sm h-11 px-10 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-destructive/20 border-0 transition-all hover:scale-[1.02]"
              >
                {isGeneratingPO ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Purchase Order
              </Button>
            </div>
          )}
        </Card>

        {/* 🚛 Regional Dispatch Velocity */}
        <Card className="lg:col-span-2 rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold normal-case font-meta">Regional dispatch performance</CardTitle>
              <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/80 mt-1">Average processing and transit times by movement jurisdiction.</CardDescription>
            </div>
            <BarChart3 className="w-4 h-4 text-muted-foreground/80" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full text-left hidden md:table">
                <thead className="bg-muted/30 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-muted-foreground/80">Jurisdiction</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-muted-foreground/80">Orders</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-muted-foreground/80">Dispatch time</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-muted-foreground/80">Delivery</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-muted-foreground/80">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {velocity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[10px] font-bold text-muted-foreground/80 normal-case">No dispatch telemetry available</td>
                    </tr>
                  ) : (
                    velocity.map((v, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold normal-case text-on-surface">{v.region || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-on-surface/80">{v.total_orders}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-border/60" />
                            <span className="text-xs font-black text-on-surface">{v.avg_dispatch_hours}h</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-on-surface/80">{v.avg_delivery_hours}h</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted/10 max-w-[60px] overflow-hidden rounded-full">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${v.fulfillment_rate}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-bold text-primary">{v.fulfillment_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Jurisdictional Cards */}
              <div className="md:hidden divide-y divide-border/40">
                {velocity.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/80 normal-case">No dispatch telemetry available</p>
                  </div>
                ) : (
                  velocity.map((v, idx) => (
                    <div key={idx} className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-on-surface">{v.region || 'Unknown'}</h4>
                        <div className="px-3 py-1 bg-muted/10 rounded-full">
                          <p className="text-[9px] font-bold text-on-surface/80 uppercase tracking-tight">{v.total_orders} Orders</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground/80 uppercase tracking-widest">Dispatch Time</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground/80" />
                            <p className="text-xs font-black text-on-surface">{v.avg_dispatch_hours}h</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] font-bold text-muted-foreground/80 uppercase tracking-widest">Delivery</p>
                          <p className="text-xs font-black text-on-surface">{v.avg_delivery_hours}h</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[8px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                          <span>Fulfillment Rate</span>
                          <span className="text-primary">{v.fulfillment_rate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${v.fulfillment_rate}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📍 Supply Chain Map (Placeholder for high-fidelity visualization) */}
      <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden p-0">
        <div className="bg-on-surface p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-white text-xl font-black normal-case font-meta leading-tight">National supply chain map</h3>
            <p className="text-[10px] font-bold normal-case text-muted-foreground/80 mt-2">Real-time visualization of material flow across the 16 regions.</p>
          </div>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => toast.success('Initializing high-fidelity enterprise visualization protocol...')}
            className="w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-sm h-12 px-10 font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-black/20 transition-all active:scale-95"
          >
            <Map className="w-4 h-4 mr-2" /> Enterprise View
          </Button>
        </div>
        <div className="h-[320px] bg-muted/30 flex items-center justify-center relative overflow-hidden group">
          {/* Geographic Radar Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[200px] h-[200px] rounded-full border border-border/40 animate-ping opacity-20" />
            <div className="absolute w-[350px] h-[350px] rounded-full border border-border/20 animate-pulse" />
          </div>

          <div className="relative text-center z-10 px-8">
            <div className="w-16 h-16 bg-white rounded-sm shadow-sm border border-border/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <Map className="w-8 h-8 text-border/60" />
            </div>
            <h4 className="text-on-surface text-[11px] font-black mb-2">Syncing regional data</h4>
            <p className="text-[10px] font-bold normal-case text-muted-foreground/80">No regional data available yet. Waiting for hub connection.</p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce delay-300" />
            </div>
          </div>

          {/* Tactical Overlay Lines */}
          <div className="absolute top-0 left-0 w-full h-full border-[20px] border-transparent border-t-muted/5 border-l-muted/5 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-full h-full border-[20px] border-transparent border-b-muted/5 border-r-muted/5 pointer-events-none" />
        </div>
      </Card>

      {/* 🔐 Replenish All Confirmation */}
      <AlertDialog open={showReplenishConfirm} onOpenChange={setShowReplenishConfirm}>
        <AlertDialogContent className="rounded-sm border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-on-surface">
                <PackagePlus className="w-5 h-5" />
              </div>
              Confirm bulk replenishment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-bold text-muted-foreground/80 leading-relaxed">
              This action will initiate a movement-wide replenishment protocol for all <span className="text-text-on-surface">low-stock assets</span>. Standard procurement workflows will be triggered for each identified item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowReplenishConfirm(false)}
              className="rounded-sm text-[10px] font-black uppercase tracking-[0.2em] h-12 px-8 border-border/40 hover:bg-stone-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleReplenishAll}
              disabled={isReplenishing}
              className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] h-12 px-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02]"
            >
              {isReplenishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Protocol'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
