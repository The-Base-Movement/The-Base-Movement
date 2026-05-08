import { useState, useEffect } from 'react'
import { 
  Zap, 
  Activity, 
  Database, 
  Globe, 
  ShieldCheck, 
  RefreshCw,
  Cpu,
  BarChart3
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

export function SystemHealthDashboard() {
  const [latencyData, setLatencyData] = useState<{ time: string, value: number }[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Generate mock real-time latency data
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const newValue = Math.floor(Math.random() * (120 - 40 + 1) + 40)
      
      setLatencyData(prev => {
        const newData = [...prev, { time: timeStr, value: newValue }]
        if (newData.length > 20) return newData.slice(1)
        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    setIsRefreshing(false)
  }

  const services = [
    { name: 'Neon PostgreSQL', status: 'Healthy', latency: '42ms', uptime: '99.99%', icon: Database, color: 'text-primary' },
    { name: 'Supabase Data API', status: 'Healthy', latency: '65ms', uptime: '99.98%', icon: Zap, color: 'text-accent' },
    { name: 'Neon Auth (Edge)', status: 'Healthy', latency: '28ms', uptime: '100%', icon: ShieldCheck, color: 'text-primary' },
    { name: 'Image Processing (CDN)', status: 'Optimized', latency: '120ms', uptime: '99.95%', icon: Globe, color: 'text-accent' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Real-time Latency Monitor */}
      <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold font-meta tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-destructive" />
              Real-time API latency
            </CardTitle>
            <CardDescription className="text-xs mt-1">Live operational metrics monitoring of global data engine response times.</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh}
            className="text-micro font-bold tracking-tight text-muted-foreground/40 hover:text-on-surface"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isRefreshing && "animate-spin")} />
            Recalibrate streams
          </Button>
        </CardHeader>
        <CardContent className="p-8 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.4)" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--on-surface)/0.4)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--on-surface)/0.4)' }}
                domain={[0, 200]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--on-surface))', 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'none',
                  letterSpacing: 'normal'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLatency)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Infrastructure Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <Card key={service.name} className="rounded-sm border-border/40 shadow-sm group hover:border-on-surface transition-all overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("w-10 h-10 flex items-center justify-center bg-muted/10 rounded-sm", service.color)}>
                  <service.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-micro font-bold tracking-tight text-primary flex items-center gap-1 justify-end">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    {service.status}
                  </p>
                  <p className="text-[8px] font-bold text-muted-foreground/40 mt-0.5">{service.uptime} Uptime</p>
                </div>
              </div>
              <h4 className="text-micro font-bold tracking-tight text-on-surface mb-1">{service.name}</h4>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold font-meta tracking-tight text-on-surface">{service.latency}</p>
                <div className="w-16 h-1 bg-muted/20 overflow-hidden rounded-full">
                  <div className="h-full bg-on-surface w-3/4 animate-shimmer" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Hardware & Compute operational metrics */}
        <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-border/10">
            <CardTitle className="text-xs font-bold tracking-tight text-muted-foreground/40 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Compute resource utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { label: 'Database Compute (CU)', value: 42, color: 'bg-accent' },
              { label: 'Edge Function Execution', value: 18, color: 'bg-primary' },
              { label: 'Memory Threshold (Cache)', value: 65, color: 'bg-destructive' },
              { label: 'Storage Bandwidth', value: 24, color: 'bg-on-surface' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between text-micro font-bold tracking-tight">
                  <span className="text-on-surface/60">{stat.label}</span>
                  <span className="text-on-surface">{stat.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/10 overflow-hidden rounded-full">
                  <div 
                    className={cn("h-full transition-all duration-1000", stat.color)}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Global Traffic Distribution */}
        <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-border/10">
            <CardTitle className="text-xs font-bold tracking-tight text-muted-foreground/40 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Global throughput analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-8 border-muted/10" />
                  <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-accent border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold font-meta tracking-tight">2.4k</p>
                  </div>
                </div>
                <div>
                  <p className="text-micro font-bold tracking-tight text-on-surface">Requests per minute</p>
                  <p className="text-[8px] font-bold text-muted-foreground/40 mt-1">Normal Operating Range</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
              <div className="text-center">
                <p className="text-lg font-bold font-meta tracking-tight">0.02%</p>
                <p className="text-[8px] font-bold tracking-tight text-muted-foreground/40">Error rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-meta tracking-tight">14.2 GB</p>
                <p className="text-[8px] font-bold tracking-tight text-muted-foreground/40">Daily egress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Incidents */}
      <Card className="rounded-sm border-border/40 shadow-sm bg-on-surface text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-destructive opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-sm rotate-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-meta tracking-tight leading-tight">Intelligence integrity verified</h3>
              <p className="text-white/40 text-xs mt-1">No infrastructure incidents detected in the last 72 hours. All systems optimal.</p>
            </div>
          </div>
          <Button variant="default" className="h-12 border-white/20 text-white hover:bg-white hover:text-on-surface transition-all rounded-sm text-micro font-bold tracking-tight px-8">
            Access security logs
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
