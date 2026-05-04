import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  Activity, 
  Database, 
  Globe, 
  ShieldCheck, 
  AlertTriangle,
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
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  LineChart, 
  Line, 
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
  const [systemUptime, setSystemUptime] = useState('99.98%')

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
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const services = [
    { name: 'Neon PostgreSQL', status: 'Healthy', latency: '42ms', uptime: '99.99%', icon: Database, color: 'text-emerald-500' },
    { name: 'Supabase Data API', status: 'Healthy', latency: '65ms', uptime: '99.98%', icon: Zap, color: 'text-[var(--brand-gold)]' },
    { name: 'Neon Auth (Edge)', status: 'Healthy', latency: '28ms', uptime: '100%', icon: ShieldCheck, color: 'text-blue-500' },
    { name: 'Image Processing (CDN)', status: 'Optimized', latency: '120ms', uptime: '99.95%', icon: Globe, color: 'text-[var(--brand-red)]' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Real-time Latency Monitor */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--brand-red)]" />
              Real-time API Latency
            </CardTitle>
            <CardDescription className="text-xs mt-1">Live telemetry monitoring of global data engine response times.</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh}
            className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-black)]"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isRefreshing && "animate-spin")} />
            Recalibrate Streams
          </Button>
        </CardHeader>
        <CardContent className="p-8 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-red)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--brand-red)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#a8a29e' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#a8a29e' }}
                domain={[0, 200]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--brand-black)', 
                  border: 'none', 
                  borderRadius: '0', 
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--brand-red)" 
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
          <Card key={service.name} className="rounded-none border-stone-200 shadow-sm group hover:border-[var(--brand-black)] transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("w-10 h-10 flex items-center justify-center bg-stone-50", service.color)}>
                  <service.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 justify-end">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {service.status}
                  </p>
                  <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">{service.uptime} Uptime</p>
                </div>
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-tight text-stone-900 mb-1">{service.name}</h4>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black font-meta tracking-tighter text-stone-900">{service.latency}</p>
                <div className="w-16 h-1 bg-stone-100 overflow-hidden">
                  <div className="h-full bg-stone-900 w-3/4 animate-shimmer" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Hardware & Compute Telemetry */}
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-stone-100">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Compute Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { label: 'Database Compute (CU)', value: 42, color: 'bg-[var(--brand-gold)]' },
              { label: 'Edge Function Execution', value: 18, color: 'bg-blue-500' },
              { label: 'Memory Threshold (Cache)', value: 65, color: 'bg-[var(--brand-red)]' },
              { label: 'Storage Bandwidth', value: 24, color: 'bg-[var(--brand-black)]' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-stone-600">{stat.label}</span>
                  <span className="text-stone-900">{stat.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-stone-50 overflow-hidden">
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
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-stone-100">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Global Throughput Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-8 border-stone-100" />
                  <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-[var(--brand-gold)] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-black font-meta">2.4k</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">Requests Per Minute</p>
                  <p className="text-[8px] font-bold text-stone-400 uppercase mt-1">Normal Operating Range</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-stone-50">
              <div className="text-center">
                <p className="text-lg font-black font-meta">0.02%</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Error Rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black font-meta">14.2 GB</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Daily Egress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Incidents */}
      <Card className="rounded-none border-stone-200 shadow-sm bg-stone-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-red)] opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black font-meta uppercase tracking-tight">Intelligence Integrity Verified</h3>
              <p className="text-stone-400 text-xs mt-1">No infrastructure incidents detected in the last 72 hours. All systems optimal.</p>
            </div>
          </div>
          <Button variant="outline" className="h-12 border-white/20 text-white hover:bg-white hover:text-stone-950 transition-all rounded-none text-[10px] font-black uppercase tracking-widest px-8">
            Access Security Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
