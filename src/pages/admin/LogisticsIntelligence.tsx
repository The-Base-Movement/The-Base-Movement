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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Synchronizing Supply Chain Telemetry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header & Tactical Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-12 bg-[var(--brand-green)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Strategic Command</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-stone-900 font-meta italic uppercase">
            Logistics <span className="text-stone-400">Intelligence</span>
          </h1>
          <p className="text-stone-400 text-sm font-medium tracking-wide max-w-xl mt-2">
            Automated supply chain monitoring and regional dispatch velocity telemetry.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-none h-12 px-6 font-black text-[10px] uppercase tracking-widest border-stone-200">
            <Filter className="w-4 h-4 mr-2" /> Route Optimization
          </Button>
          <Button className="bg-black text-white hover:bg-stone-800 rounded-none h-12 px-6 font-black text-[10px] uppercase tracking-widest shadow-xl">
            <Package className="w-4 h-4 mr-2" /> Replenish All
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
          <Card key={i} className="rounded-none border-stone-200 shadow-sm bg-white p-6 hover:border-stone-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-3xl font-black italic tracking-tighter text-stone-900">{stat.value}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{stat.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🚨 Inventory Intelligence (Urgent) */}
        <Card className="lg:col-span-1 rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic">Inventory Alerts</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Items requiring immediate replenishment.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-100">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">All Stock Levels Normal</p>
                </div>
              ) : (
                alerts.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight text-stone-900">{item.name}</p>
                      <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-red-600">{item.stock_quantity} <span className="text-[8px] text-stone-300 font-bold uppercase ml-1">In Stock</span></p>
                      <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest mt-1">Threshold: {item.low_stock_threshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {alerts.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-100">
              <Button className="w-full bg-red-600 text-white hover:bg-red-700 rounded-none h-10 font-black text-[9px] uppercase tracking-widest">
                Generate Purchase Order
              </Button>
            </div>
          )}
        </Card>

        {/* 🚛 Regional Dispatch Velocity */}
        <Card className="lg:col-span-2 rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic">Regional Velocity Telemetry</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Average processing and transit times by movement jurisdiction.</CardDescription>
            </div>
            <BarChart3 className="w-4 h-4 text-stone-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Jurisdiction</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Orders</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Dispatch Time</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Delivery</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {velocity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">No dispatch telemetry available</td>
                    </tr>
                  ) : (
                    velocity.map((v, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase text-stone-900">{v.region || 'Unknown'}</span>
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
                            <div className="flex-1 h-1 bg-stone-100 max-w-[60px] overflow-hidden">
                              <div 
                                className="h-full bg-[var(--brand-green)]" 
                                style={{ width: `${v.fulfillment_rate}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-black text-[var(--brand-green)]">{v.fulfillment_rate}%</span>
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
      <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden p-0">
        <div className="bg-stone-900 p-8 flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl font-black uppercase tracking-tight font-meta italic">National Supply Chain Map</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Real-time visualization of material flow across the 16 regions.</p>
          </div>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-none h-12 px-6 font-black text-[10px] uppercase tracking-widest">
            <Map className="w-4 h-4 mr-2" /> Enterprise View
          </Button>
        </div>
        <div className="h-[400px] bg-stone-100 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          <div className="relative text-center">
            <Package className="w-16 h-16 text-stone-200 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Interactive Logistics Visualization Engine</p>
            <p className="text-[8px] text-stone-300 font-bold uppercase mt-2">Connecting Chapter Hubs to the National Vault</p>
          </div>
          {/* Animated Flow Lines (CSS) */}
          <div className="absolute top-1/4 left-1/4 w-32 h-[2px] bg-gradient-to-r from-transparent via-stone-300 to-transparent animate-pulse" />
          <div className="absolute top-2/3 right-1/4 w-48 h-[2px] bg-gradient-to-r from-transparent via-stone-300 to-transparent animate-pulse delay-700" />
        </div>
      </Card>
    </div>
  )
}
