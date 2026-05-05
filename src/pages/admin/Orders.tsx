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
import { Button } from '@/components/ui/Button'
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
  Pending:    { label: 'Pending',    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',    icon: Clock },
  Processing: { label: 'Processing', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      icon: Package },
  Dispatched: { label: 'Dispatched', color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',  icon: Truck },
  Delivered:  { label: 'Delivered',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',icon: CheckCircle2 },
  Cancelled:  { label: 'Cancelled',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',        icon: XCircle },
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
      color: 'text-stone-900', 
      sub: `GHS ${stats.totalRevenue.toFixed(2)} total revenue` 
    },
    { 
      label: 'Avg Delivery',   
      value: `${(stats.avgDeliveryDays || 0).toFixed(1)}d`, 
      color: (stats.avgDeliveryDays ?? 0) === 0 ? 'text-stone-400' : (stats.avgDeliveryDays ?? 0) <= 3 ? 'text-emerald-600' : (stats.avgDeliveryDays ?? 0) <= 5 ? 'text-amber-500' : 'text-red-500', 
      sub: 'Dispatch to Delivery Latency' 
    },
    { 
      label: 'In Transit',     
      value: stats.dispatchedOrders, 
      color: stats.dispatchedOrders === 0 ? 'text-stone-400' : 'text-violet-600',  
      sub: 'Dispatched to customers' 
    },
    { 
      label: 'Delivered',      
      value: stats.deliveredOrders,  
      color: stats.deliveredOrders === 0 ? 'text-stone-400' : 'text-emerald-600', 
      sub: `GHS ${stats.revenueToday.toFixed(2)} today` 
    },
  ] : []

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-stone-900" />
            Order management
          </h1>
          <p className="text-stone-500 text-sm mt-1">Live merchandise dispatch and fulfillment intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Export orders
          </Button>
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all flex items-center gap-2"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-stone-200 animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        )) : statCards.map(s => (
          <Card key={s.label} className="rounded-xl border-stone-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold normal-case text-stone-400 mb-2">{s.label}</p>
              <p className={cn('text-4xl font-black font-meta tracking-tighter', s.color)}>{s.value}</p>
              <p className="text-[9px] text-stone-400 normal-case mt-2">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={cn('grid gap-8', selectedOrder ? 'xl:grid-cols-3' : 'xl:grid-cols-1')}>
        {/* Orders Table */}
        <div className={selectedOrder ? 'xl:col-span-2' : ''}>
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-xs font-bold normal-case text-stone-400 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order feed
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Search - Always Visible but scaled */}
                <div className="relative w-full md:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 h-9 md:h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 w-full normal-case rounded-xl md:rounded-lg"
                  />
                </div>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                      className="pl-9 pr-4 h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 appearance-none normal-case rounded-lg"
                    >
                      <option value="ALL">All Statuses</option>
                      {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <select
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH')}
                      className="pl-9 pr-4 h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 appearance-none normal-case rounded-lg"
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today</option>
                      <option value="WEEK">Last 7 Days</option>
                      <option value="MONTH">This Month</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <select
                      value={regionFilter}
                      onChange={e => setRegionFilter(e.target.value)}
                      className="pl-9 pr-4 h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 appearance-none normal-case rounded-lg"
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
                      <Button variant="outline" size="sm" className="h-9 px-3 border-stone-200 rounded-xl bg-stone-50">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-xl border-stone-100" align="end">
                      <DropdownMenuLabel className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1.5">
                        Refine Feed
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-stone-50" />
                      
                      {/* Status Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-stone-600 rounded-lg">
                          <Package className="w-3.5 h-3.5 mr-2 text-stone-400" />
                          Fulfillment status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-xl border-stone-100 shadow-lg">
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
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-stone-600 rounded-lg">
                          <Clock className="w-3.5 h-3.5 mr-2 text-stone-400" />
                          Temporal range
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-xl border-stone-100 shadow-lg">
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
                        <DropdownMenuSubTrigger className="text-[11px] font-bold text-stone-600 rounded-lg">
                          <Filter className="w-3.5 h-3.5 mr-2 text-stone-400" />
                          Movement region
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="rounded-xl border-stone-100 shadow-lg">
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
                          <DropdownMenuSeparator className="bg-stone-50" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setStatusFilter('ALL')
                              setDateFilter('ALL')
                              setRegionFilter('ALL')
                            }}
                            className="text-[11px] font-bold text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
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
                  <RefreshCw className="w-6 h-6 animate-spin text-stone-400 mx-auto mb-3" />
                  <p className="text-[10px] font-bold normal-case text-stone-400">Loading orders...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Package className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-[10px] font-bold normal-case text-stone-400">No orders found</p>
                  <p className="text-[9px] text-stone-300 normal-case mt-1">Orders will appear here once customers complete purchases</p>
                </div>
              ) : (
                <>
                {/* Desktop Table */}
                <table className="w-full text-xs hidden md:table">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      {['Order ID', 'Customer', 'Region', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] font-bold normal-case text-stone-400">{h}</th>
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
                            'border-b border-stone-50 hover:bg-stone-50/80 transition-colors cursor-pointer',
                            selectedOrder?.id === order.id && 'bg-stone-50 border-l-2 border-l-[var(--brand-black)]'
                          )}
                          onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                        >
                          <td className="px-5 py-4 font-mono text-[10px] text-stone-500">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-stone-900">{order.full_name}</p>
                            <p className="text-[9px] text-stone-400 normal-case">{order.email}</p>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-stone-600 normal-case">
                            {order.region_or_state || '—'}
                          </td>
                          <td className="px-5 py-4 font-black text-stone-900">
                            GHS {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 normal-case text-[10px] text-stone-500">
                            {order.payment_method === 'momo' ? 'MoMo' : 'Card'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-stone-400">
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
                                  size="sm"
                                  onClick={() => handleStatusAdvance(order)}
                                  disabled={updatingId === order.id}
                                  className="h-7 px-3 text-[9px] font-bold normal-case bg-stone-900 text-white hover:bg-stone-700 rounded-xl"
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
                <div className="md:hidden divide-y divide-stone-100">
                  {filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status]
                    const StatusIcon = cfg.icon
                    const nextStatus = NEXT_STATUS[order.status]
                    return (
                      <div 
                        key={order.id} 
                        className={cn(
                          "p-6 space-y-6 transition-colors",
                          selectedOrder?.id === order.id ? "bg-stone-50" : "bg-white"
                        )}
                        onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono font-bold text-stone-400 tracking-widest uppercase">#{order.id.slice(0, 8)}</p>
                            <h4 className="text-sm font-black text-stone-900">{order.full_name}</h4>
                            <p className="text-[10px] font-bold text-stone-400">{order.region_or_state || 'Unknown Region'}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Value</p>
                            <p className="text-sm font-black text-stone-900">GHS {Number(order.total_amount).toFixed(2)}</p>
                          </div>
                          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Payment</p>
                            <p className="text-sm font-black text-stone-900 capitalize">{order.payment_method}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl border-stone-200 text-stone-600 text-[10px] font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-2" /> Details
                          </Button>
                          {nextStatus && (
                            <Button
                              className="flex-1 h-11 bg-stone-900 text-white rounded-xl text-[10px] font-bold"
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
            <Card className="rounded-xl border-stone-200 shadow-sm xl:col-span-1 h-fit sticky top-6 bg-white overflow-hidden">
              <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case text-stone-400">
                  Order detail
                </CardTitle>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-stone-400 hover:text-stone-900 text-lg leading-none font-bold"
                >×</button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* ID & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold normal-case text-stone-400 mb-1">Order ID</p>
                    <p className="font-mono text-xs font-bold text-stone-700">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Customer */}
                <div className="space-y-3 pt-4 border-t border-stone-50">
                  <p className="text-[9px] font-bold normal-case text-stone-400">Customer</p>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-stone-900">{selectedOrder.full_name}</p>
                    <p className="text-[10px] text-stone-500">{selectedOrder.email}</p>
                    <p className="text-[10px] text-stone-500">{selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-3 pt-4 border-t border-stone-50">
                  <p className="text-[9px] font-bold normal-case text-stone-400">Shipping address</p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-600">{selectedOrder.shipping_address}</p>
                    <p className="text-[10px] text-stone-600">{selectedOrder.city}, {selectedOrder.region_or_state}</p>
                    <p className="text-[10px] font-bold text-stone-900">{selectedOrder.country}</p>
                  </div>
                </div>

                {/* Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-stone-50">
                    <p className="text-[9px] font-bold normal-case text-stone-400">Line items</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-stone-50">
                          <div>
                            <p className="text-[10px] font-bold text-stone-700">Qty: {item.quantity}</p>
                            <p className="text-[9px] text-stone-400 font-mono">{item.product_id.slice(0, 8)}</p>
                          </div>
                          <p className="text-[10px] font-black text-stone-900">
                            GHS {(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-stone-100">
                  <div className="flex justify-between text-[10px] text-stone-500 normal-case">
                    <span>Subtotal</span>
                    <span>GHS {Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500 normal-case">
                    <span>Shipping</span>
                    <span>GHS {Number(selectedOrder.shipping_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-200">
                    <span className="text-xs font-bold normal-case text-stone-900">Total</span>
                    <span className="text-sm font-black text-[var(--brand-black)]">GHS {Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  {NEXT_STATUS[selectedOrder.status] && (
                    <Button
                      className="w-full h-10 bg-stone-900 text-white hover:bg-stone-700 text-[10px] font-bold normal-case rounded-xl"
                      onClick={() => handleStatusAdvance(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      {updatingId === selectedOrder.id ? 'Updating...' : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
                    </Button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <Button
                      variant="outline"
                      className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold normal-case rounded-xl"
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      Cancel order
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
