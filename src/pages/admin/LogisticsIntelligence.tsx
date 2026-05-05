import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Map,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header & Tactical Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-stone-900" />
            Logistics intelligence
          </h1>
          <p className="text-stone-500 text-sm mt-1">Automated supply chain monitoring and regional dispatch tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" /> Route optimization
          </Button>
          <Button className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Replenish all
          </Button>
        </div>
      </div>

      {/* 📊 High-Impact Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Supply Chain Health', value: '94%', sub: 'Global Logistics Efficiency', icon: CheckCircle2, color: 'text-[var(--brand-green)]' },
          { label: 'Urgent Stock Alerts', value: alerts.length, sub: 'Inventory Below Threshold', icon: AlertTriangle, color: alerts.length > 0 ? 'text-red-500' : 'text-stone-400' },
          { label: 'Avg Dispatch Time', value: '4.2h', sub: 'Last 30 Day Aggregate', icon: Clock, color: 'text-blue-500' },
          { label: 'Fulfillment Rate', value: '98.2%', sub: 'Verified Regional Delivery', icon: TrendingUp, color: 'text-orange-500' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-xl border-stone-200 shadow-sm bg-white p-6 hover:border-stone-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold normal-case text-stone-400">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-stone-900">{stat.value}</p>
              <p className="text-[9px] font-bold text-stone-400 normal-case mt-1">{stat.sub}</p>
            </div>
          </Card>
        ))}
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
            <div className="p-4 bg-stone-50 border-t border-stone-100">
              <Button className="w-full bg-red-600 text-white hover:bg-red-700 rounded-lg h-10 font-bold text-[9px] normal-case shadow-sm">
                Generate purchase order
              </Button>
            </div>
          )}
        </Card>

        {/* 🚛 Regional Dispatch Velocity */}
        <Card className="lg:col-span-2 rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold normal-case font-meta">Regional velocity telemetry</CardTitle>
              <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">Average processing and transit times by movement jurisdiction.</CardDescription>
            </div>
            <BarChart3 className="w-4 h-4 text-stone-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📍 Supply Chain Map (Placeholder for high-fidelity visualization) */}
      <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden p-0">
        <div className="bg-stone-900 p-8 flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl font-black normal-case font-meta">National supply chain map</h3>
            <p className="text-[10px] font-bold normal-case text-stone-400 mt-1">Real-time visualization of material flow across the 16 regions.</p>
          </div>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-lg h-12 px-6 font-bold text-[10px] normal-case shadow-sm">
            <Map className="w-4 h-4 mr-2" /> Enterprise view
          </Button>
        </div>
        <div className="h-[400px] bg-stone-100 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          <div className="relative text-center">
            <Package className="w-16 h-16 text-stone-200 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-bold normal-case text-stone-400">Interactive logistics visualization engine</p>
            <p className="text-[8px] text-stone-300 font-bold normal-case mt-2">Connecting chapter hubs to the national vault</p>
          </div>
          {/* Animated Flow Lines (CSS) */}
          <div className="absolute top-1/4 left-1/4 w-32 h-[2px] bg-gradient-to-r from-transparent via-stone-300 to-transparent animate-pulse" />
          <div className="absolute top-2/3 right-1/4 w-48 h-[2px] bg-gradient-to-r from-transparent via-stone-300 to-transparent animate-pulse delay-700" />
        </div>
      </Card>
    </div>
  )
}
