import { useState, useEffect } from 'react'
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: typeof Package }> = {
  Pending:    { label: 'Pending',    color: 'text-accent',      bg: 'bg-accent/10 border-accent/20',       icon: Clock },
  Processing: { label: 'Processing', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',          icon: Package },
  Dispatched: { label: 'Dispatched', color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',      icon: Truck },
  Delivered:  { label: 'Delivered',  color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',     icon: CheckCircle2 },
  Cancelled:  { label: 'Cancelled',  color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle },
}

const NEXT_STATUS: Partial<Record<Order['status'], Order['status']>> = {
  Pending:    'Processing',
  Processing: 'Dispatched',
  Dispatched: 'Delivered',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'ALL'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [regionFilter, setRegionFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL')

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [orderData, statsData] = await Promise.all([
        adminService.getOrders(),
        adminService.getOrderStats()
      ])
      setOrders(orderData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load orders:', err)
      toast.error('Failed to load order data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleStatusAdvance = async (order: Order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    const success = await adminService.updateOrderStatus(order.id, next)
    if (success) {
      toast.success(`Order #${order.id.slice(0, 8)} → ${next}`)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o))
      if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, status: next } : null)
    } else {
      toast.error('Failed to update order status.')
    }
    setUpdatingId(null)
  }

  const handleCancel = async (order: Order) => {
    if (!confirm(`Cancel order #${order.id.slice(0, 8)}? This cannot be undone.`)) return
    setUpdatingId(order.id)
    const success = await adminService.updateOrderStatus(order.id, 'Cancelled')
    if (success) {
      toast.success('Order cancelled.')
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o))
      if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, status: 'Cancelled' } : null)
    } else {
      toast.error('Failed to cancel order.')
    }
    setUpdatingId(null)
  }

  const filtered = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    const matchesRegion = regionFilter === 'ALL' || o.region_or_state === regionFilter
    
    // Date Filtering
    let matchesDate = true
    if (dateFilter !== 'ALL') {
      const orderDate = new Date(o.created_at)
      const now = new Date()
      if (dateFilter === 'TODAY') {
        matchesDate = orderDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = orderDate >= weekAgo
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        matchesDate = orderDate >= monthAgo
      }
    }

    const q = search.toLowerCase()
    const matchesSearch = !q || 
      o.full_name.toLowerCase().includes(q) || 
      o.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchesStatus && matchesSearch && matchesRegion && matchesDate
  })

  const regions = [...new Set(orders.map(o => o.region_or_state).filter(Boolean))] as string[]

  const handleExport = () => {
    try {
      const headers = ['Order ID', 'Customer', 'Email', 'Region', 'Amount', 'Status', 'Date']
      const csvData = filtered.map(o => [
        o.id,
        `"${o.full_name}"`,
        o.email,
        o.region_or_state || 'N/A',
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ])
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Exported ${filtered.length} order records.`)
    } catch {
      toast.error('Failed to export orders.')
    }
  }

  const statCards = stats ? [
    { 
      label: 'Total Orders',   
      value: stats.totalOrders,      
      color: 'text-on-surface', 
      sub: `GHS ${stats.totalRevenue.toFixed(2)} total revenue` 
    },
    { 
      label: 'Avg Delivery',   
      value: `${(stats.avgDeliveryDays || 0).toFixed(1)}d`, 
      color: (stats.avgDeliveryDays ?? 0) === 0 ? 'text-muted-foreground/40' : (stats.avgDeliveryDays ?? 0) <= 3 ? 'text-primary' : (stats.avgDeliveryDays ?? 0) <= 5 ? 'text-accent' : 'text-destructive', 
      sub: 'Dispatch to Delivery Latency' 
    },
    { 
      label: 'In Transit',     
      value: stats.dispatchedOrders, 
      color: stats.dispatchedOrders === 0 ? 'text-muted-foreground/40' : 'text-violet-600',  
      sub: 'Dispatched to customers' 
    },
    { 
      label: 'Delivered',      
      value: stats.deliveredOrders,  
      color: stats.deliveredOrders === 0 ? 'text-muted-foreground/40' : 'text-primary', 
      sub: `GHS ${stats.revenueToday.toFixed(2)} today` 
    },
  ] : []

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-on-surface" />
            Order management
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Live merchandise dispatch and fulfillment intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="rounded-sm border-border/40 text-on-surface/80 text-[10px] px-8 font-black uppercase tracking-[0.2em] hover:bg-stone-100 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export Manifest
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => loadData(true)}
            className="rounded-sm border-border/40 text-on-surface/80 text-[10px] px-8 font-black uppercase tracking-[0.2em] hover:bg-stone-100 shadow-sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Synchronize
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-sm border-border/40 animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        )) : statCards.map(s => (
          <Card key={s.label} className="rounded-sm border-border/40 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold normal-case text-muted-foreground/80 mb-2">{s.label}</p>
              <p className={cn('text-4xl font-black font-meta tracking-tighter', s.color)}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground/60 normal-case mt-2">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={cn('grid gap-8', selectedOrder ? 'xl:grid-cols-3' : 'xl:grid-cols-1')}>
        {/* Orders Table */}
        <div className={selectedOrder ? 'xl:col-span-2' : ''}>
          <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-xs font-bold normal-case text-muted-foreground/80 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order feed
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Search - Always Visible but scaled */}
                <div className="relative w-full md:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 h-9 md:h-8 text-[10px] bg-muted/5 border border-border/40 focus:outline-none focus:border-muted-foreground/40 w-full normal-case rounded-sm md:rounded-lg"
                  />
                </div>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                      className="pl-9 pr-4 h-8 text-[10px] bg-muted/5 border border-border/40 focus:outline-none focus:border-muted-foreground/40 appearance-none normal-case rounded-lg"
                    >
                      <option value="ALL">All Statuses</option>
                      {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <select
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH')}
                      className="pl-9 pr-4 h-8 text-[10px] bg-muted/5 border border-border/40 focus:outline-none focus:border-muted-foreground/40 appearance-none normal-case rounded-lg"
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today</option>
                      <option value="WEEK">Last 7 Days</option>
                      <option value="MONTH">This Month</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <select
                      value={regionFilter}
                      onChange={e => setRegionFilter(e.target.value)}
                      className="pl-9 pr-4 h-8 text-[10px] bg-muted/5 border border-border/40 focus:outline-none focus:border-muted-foreground/40 appearance-none normal-case rounded-lg"
                    >
                      <option value="ALL">All Regions</option>
                      {regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile Unified Filter Button (Compound) */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="h-9 px-3 border-border/40 rounded-sm bg-muted/5">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-sm p-2 shadow-xl border-border/40" align="end">
                      <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest px-2 py-1.5">
                        Refine Feed
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-muted/5" />
                      
                      {/* Status Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-on-surface/80 rounded-lg">
                          <Package className="w-3.5 h-3.5 mr-2 text-muted-foreground/80" />
                          Fulfillment status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-sm border-border/40 shadow-lg">
                          <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'ALL')}>
                            <DropdownMenuRadioItem value="ALL" className="text-[11px] font-bold">All Statuses</DropdownMenuRadioItem>
                            {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                              <DropdownMenuRadioItem key={s} value={s} className="text-[11px] font-bold">{s}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Date Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-on-surface/80 rounded-lg">
                          <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground/80" />
                          Temporal range
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-sm border-border/40 shadow-lg">
                          <DropdownMenuRadioGroup value={dateFilter} onValueChange={(v) => setDateFilter(v as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH')}>
                            <DropdownMenuRadioItem value="ALL" className="text-[11px] font-bold">All Time</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="TODAY" className="text-[11px] font-bold">Today</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="WEEK" className="text-[11px] font-bold">Last 7 Days</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="MONTH" className="text-[11px] font-bold">This Month</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Region Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-on-surface/80 rounded-lg">
                          <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground/80" />
                          Movement region
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-sm border-border/40 shadow-lg">
                          <DropdownMenuRadioGroup value={regionFilter} onValueChange={setRegionFilter}>
                            <DropdownMenuRadioItem value="ALL" className="text-[11px] font-bold">All Regions</DropdownMenuRadioItem>
                            {regions.map(r => (
                              <DropdownMenuRadioItem key={r} value={r} className="text-[11px] font-bold">{r}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Reset Action */}
                      {(statusFilter !== 'ALL' || dateFilter !== 'ALL' || regionFilter !== 'ALL') && (
                        <>
                          <DropdownMenuSeparator className="bg-muted/5" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setStatusFilter('ALL')
                              setDateFilter('ALL')
                              setRegionFilter('ALL')
                            }}
                            className="text-[11px] font-bold text-destructive focus:text-destructive focus:bg-destructive/5 rounded-lg"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-2" />
                            Reset filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-[10px] font-bold normal-case text-muted-foreground/80">Loading orders...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Package className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-[10px] font-bold normal-case text-muted-foreground/80">No orders found</p>
                  <p className="text-[9px] text-muted-foreground/40 normal-case mt-1">Orders will appear here once customers complete purchases</p>
                </div>
              ) : (
                <>
                {/* Desktop Table */}
                <table className="w-full text-xs hidden md:table">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/10">
                      {['Order ID', 'Customer', 'Region', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] font-bold normal-case text-muted-foreground/80">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => {
                      const cfg = STATUS_CONFIG[order.status]
                      const StatusIcon = cfg.icon
                      const nextStatus = NEXT_STATUS[order.status]
                      return (
                        <tr 
                          key={order.id} 
                          className={cn(
                            'border-b border-muted/5 hover:bg-muted/5 transition-colors cursor-pointer',
                            selectedOrder?.id === order.id && 'bg-muted/5 border-l-2 border-l-on-surface'
                          )}
                          onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                        >
                          <td className="px-5 py-4 font-mono text-[10px] text-muted-foreground/80">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-on-surface">{order.full_name}</p>
                            <p className="text-[9px] text-muted-foreground/60 normal-case">{order.email}</p>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-on-surface/80 normal-case">
                            {order.region_or_state || '-'}
                          </td>
                          <td className="px-5 py-4 font-black text-on-surface">
                            GHS {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 normal-case text-[10px] text-muted-foreground/80">
                            {order.payment_method === 'momo' ? 'MoMo' : 'Card'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-muted-foreground/60">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                                className="h-7 w-7 p-0"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {nextStatus && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleStatusAdvance(order)}
                                  disabled={updatingId === order.id}
                                  className="h-7 px-4 text-[9px] font-black uppercase tracking-widest rounded-sm"
                                >
                                  {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Mobile Order Cards */}
                <div className="md:hidden divide-y divide-border/40">
                  {filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status]
                    const StatusIcon = cfg.icon
                    const nextStatus = NEXT_STATUS[order.status]
                    return (
                      <div 
                        key={order.id} 
                        className={cn(
                          "p-6 space-y-6 transition-colors",
                          selectedOrder?.id === order.id ? "bg-muted/10" : "bg-white"
                        )}
                        onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono font-bold text-muted-foreground/60 tracking-widest uppercase">#{order.id.slice(0, 8)}</p>
                            <h4 className="text-sm font-black text-on-surface">{order.full_name}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground/60">{order.region_or_state || 'Unknown Region'}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-border/40 rounded-sm shadow-sm">
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Value</p>
                            <p className="text-sm font-black text-on-surface">GHS {Number(order.total_amount).toFixed(2)}</p>
                          </div>
                          <div className="p-4 bg-white border border-border/40 rounded-sm shadow-sm">
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Payment</p>
                            <p className="text-sm font-black text-on-surface capitalize">{order.payment_method}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="default"
                            className="flex-1 h-11 rounded-sm border-border/40 text-on-surface/80 text-[10px] font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-2" /> Details
                          </Button>
                          {nextStatus && (
                            <Button
                              className="flex-1 h-11 bg-on-surface text-white rounded-sm text-[10px] font-bold"
                              disabled={updatingId === order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusAdvance(order);
                              }}
                            >
                              {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (() => {
          const cfg = STATUS_CONFIG[selectedOrder.status]
          const StatusIcon = cfg.icon
          return (
            <Card className="rounded-sm border-border/40 shadow-sm xl:col-span-1 h-fit sticky top-6 bg-white overflow-hidden">
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case text-muted-foreground/60">
                  Order detail
                </CardTitle>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted-foreground/60 hover:text-on-surface text-lg leading-none font-bold"
                >×</button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* ID & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold normal-case text-muted-foreground/60 mb-1">Order ID</p>
                    <p className="font-mono text-xs font-bold text-on-surface/80">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Customer */}
                <div className="space-y-3 pt-4 border-t border-muted/5">
                  <p className="text-[9px] font-bold normal-case text-muted-foreground/60">Customer</p>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-on-surface">{selectedOrder.full_name}</p>
                    <p className="text-[10px] text-muted-foreground/80">{selectedOrder.email}</p>
                    <p className="text-[10px] text-muted-foreground/80">{selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-3 pt-4 border-t border-muted/5">
                  <p className="text-[9px] font-bold normal-case text-muted-foreground/60">Shipping address</p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface/80">{selectedOrder.shipping_address}</p>
                    <p className="text-[10px] text-on-surface/80">{selectedOrder.city}, {selectedOrder.region_or_state}</p>
                    <p className="text-[10px] font-bold text-on-surface">{selectedOrder.country}</p>
                  </div>
                </div>

                {/* Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-muted/5">
                    <p className="text-[9px] font-bold normal-case text-muted-foreground/60">Line items</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-muted/5">
                          <div>
                            <p className="text-[10px] font-bold text-on-surface/80">Qty: {item.quantity}</p>
                            <p className="text-[9px] text-muted-foreground/40 font-mono">{item.product_id.slice(0, 8)}</p>
                          </div>
                          <p className="text-[10px] font-black text-on-surface">
                            GHS {(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <div className="flex justify-between text-[10px] text-muted-foreground/60 normal-case">
                    <span>Subtotal</span>
                    <span>GHS {Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/60 normal-case">
                    <span>Shipping</span>
                    <span>GHS {Number(selectedOrder.shipping_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/60">
                    <span className="text-xs font-bold normal-case text-on-surface">Total</span>
                    <span className="text-sm font-black text-on-surface">GHS {Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  {NEXT_STATUS[selectedOrder.status] && (
                    <Button
                      variant="primary"
                      className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-sm"
                      onClick={() => handleStatusAdvance(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      {updatingId === selectedOrder.id ? 'Synchronizing...' : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
                    </Button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <Button
                      variant="outline"
                      className="w-full h-11 text-[10px] font-black uppercase tracking-widest text-destructive border-destructive/20 hover:bg-destructive/5 rounded-sm"
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      Terminate Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    </div>
  )
}
