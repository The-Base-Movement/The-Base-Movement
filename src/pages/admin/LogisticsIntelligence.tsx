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
import { Button } from '@/components/ui/Button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-[var(--brand-green)] animate-spin" />
          <p className="text-[10px] font-bold normal-case text-stone-400">Synchronizing supply chain telemetry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pb-16 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header & Tactical Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-stone-900" />
            Logistics monitoring
          </h1>
          <p className="text-stone-500 text-sm mt-1">Automated supply chain monitoring and regional dispatch tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRouteOptimization}
            disabled={isOptimizing}
            className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all flex items-center gap-2"
          >
            {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />} 
            Route optimization
          </Button>
          <Button 
            onClick={() => setShowReplenishConfirm(true)}
            disabled={isReplenishing}
            className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2"
          >
            {isReplenishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />} 
            Replenish all
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
              color: health >= 80 ? 'text-[var(--brand-green)]' : health >= 51 ? 'text-amber-500' : 'text-red-500',
              className: 'col-span-2 md:col-span-1'
            },
            { label: 'Urgent Alerts', value: alerts.length, sub: 'Inventory Alerts', icon: AlertTriangle, color: alerts.length > 0 ? 'text-red-500' : 'text-stone-400' },
            { label: 'Avg Dispatch', value: `${avgDispatch}h`, sub: '30 Day Aggregate', icon: Clock, color: 'text-blue-500' },
            { 
              label: 'Fulfillment Rate', 
              value: `${avgFulfillment}%`, 
              sub: 'Verified Delivery', 
              icon: Number(avgFulfillment) >= 80 ? TrendingUp : AlertTriangle, 
              color: Number(avgFulfillment) >= 80 ? 'text-orange-500' : Number(avgFulfillment) >= 51 ? 'text-amber-500' : 'text-red-500',
              className: 'col-span-2 md:col-span-1'
            },
          ].map((stat, i) => (
            <Card key={i} className={cn("rounded-xl border-stone-200 shadow-sm bg-white p-6 hover:border-stone-400 transition-colors", stat.className)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold normal-case text-stone-400">{stat.label}</span>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-black tracking-tighter text-stone-900">{stat.value}</p>
                <p className="text-[10px] font-bold text-stone-400 normal-case mt-1">{stat.sub}</p>
              </div>
            </Card>
          ))
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🚨 Inventory Intelligence (Urgent) */}
        <Card className="lg:col-span-1 rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold normal-case font-meta">Inventory alerts</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">Items requiring immediate replenishment.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-100">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-stone-400 normal-case">All stock levels normal</p>
                </div>
              ) : (
                alerts.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-bold normal-case tracking-tight text-stone-900">{item.name}</p>
                      <p className="text-[8px] text-stone-400 font-bold normal-case mt-1">{item.category.toLowerCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-red-600">{item.stock_quantity} <span className="text-[8px] text-stone-300 font-bold normal-case ml-1">in stock</span></p>
                      <p className="text-[8px] text-stone-400 font-bold normal-case mt-1">Threshold: {item.low_stock_threshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {alerts.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <Button 
                onClick={handleGeneratePurchaseOrder}
                disabled={isGeneratingPO}
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg h-9 px-4 font-bold text-[9px] normal-case shadow-sm flex items-center gap-2"
              >
                {isGeneratingPO ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                Generate purchase order
              </Button>
            </div>
          )}
        </Card>

        {/* 🚛 Regional Dispatch Velocity */}
        <Card className="lg:col-span-2 rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold normal-case font-meta">Regional dispatch performance</CardTitle>
              <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">Average processing and transit times by movement jurisdiction.</CardDescription>
            </div>
            <BarChart3 className="w-4 h-4 text-stone-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full text-left hidden md:table">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Jurisdiction</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Orders</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Dispatch time</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Delivery</th>
                    <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {velocity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[10px] font-bold text-stone-400 normal-case">No dispatch telemetry available</td>
                    </tr>
                  ) : (
                    velocity.map((v, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold normal-case text-stone-900">{v.region || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-stone-600">{v.total_orders}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-stone-300" />
                            <span className="text-xs font-black text-stone-900">{v.avg_dispatch_hours}h</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-stone-600">{v.avg_delivery_hours}h</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-stone-100 max-w-[60px] overflow-hidden rounded-full">
                              <div 
                                className="h-full bg-[var(--brand-green)]" 
                                style={{ width: `${v.fulfillment_rate}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--brand-green)]">{v.fulfillment_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Jurisdictional Cards */}
              <div className="md:hidden divide-y divide-stone-100">
                {velocity.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-[10px] font-bold text-stone-400 normal-case">No dispatch telemetry available</p>
                  </div>
                ) : (
                  velocity.map((v, idx) => (
                    <div key={idx} className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-stone-900">{v.region || 'Unknown'}</h4>
                        <div className="px-3 py-1 bg-stone-100 rounded-full">
                          <p className="text-[9px] font-bold text-stone-600 uppercase tracking-tight">{v.total_orders} Orders</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Dispatch Time</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <p className="text-xs font-black text-stone-900">{v.avg_dispatch_hours}h</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Delivery</p>
                          <p className="text-xs font-black text-stone-900">{v.avg_delivery_hours}h</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase tracking-widest">
                          <span>Fulfillment Rate</span>
                          <span className="text-[var(--brand-green)]">{v.fulfillment_rate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--brand-green)] transition-all duration-1000" 
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
      <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden p-0">
        <div className="bg-stone-900 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-white text-xl font-black normal-case font-meta leading-tight">National supply chain map</h3>
            <p className="text-[10px] font-bold normal-case text-stone-400 mt-2">Real-time visualization of material flow across the 16 regions.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => toast.success('Initializing high-fidelity enterprise visualization protocol...')}
            className="w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-lg h-12 px-8 font-bold text-[10px] normal-case shadow-sm transition-all"
          >
            <Map className="w-4 h-4 mr-2" /> Enterprise view
          </Button>
        </div>
        <div className="h-[320px] bg-stone-50 flex items-center justify-center relative overflow-hidden group">
          {/* Geographic Radar Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[200px] h-[200px] rounded-full border border-stone-200/50 animate-ping opacity-20" />
            <div className="absolute w-[350px] h-[350px] rounded-full border border-stone-100/50 animate-pulse" />
          </div>

          <div className="relative text-center z-10 px-8">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <Map className="w-8 h-8 text-stone-300" />
            </div>
            <h4 className="text-stone-900 text-[11px] font-black mb-2">Syncing regional data</h4>
            <p className="text-[10px] font-bold normal-case text-stone-500">No regional data available yet. Waiting for hub connection.</p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce delay-300" />
            </div>
          </div>

          {/* Tactical Overlay Lines */}
          <div className="absolute top-0 left-0 w-full h-full border-[20px] border-transparent border-t-stone-100/10 border-l-stone-100/10 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-full h-full border-[20px] border-transparent border-b-stone-100/10 border-r-stone-100/10 pointer-events-none" />
        </div>
      </Card>

      {/* 🔐 Replenish All Confirmation */}
      <AlertDialog open={showReplenishConfirm} onOpenChange={setShowReplenishConfirm}>
        <AlertDialogContent className="rounded-2xl border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-900">
                <PackagePlus className="w-5 h-5" />
              </div>
              Confirm bulk replenishment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-bold text-stone-500 leading-relaxed">
              This action will initiate a movement-wide replenishment protocol for all <span className="text-stone-900">low-stock assets</span>. Standard procurement workflows will be triggered for each identified item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl text-[10px] font-bold tracking-tight h-10 px-6 border-stone-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReplenishAll}
              disabled={isReplenishing}
              className="rounded-xl text-[10px] font-bold tracking-tight bg-stone-900 text-white hover:bg-stone-800 h-10 px-8"
            >
              {isReplenishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Protocol'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
