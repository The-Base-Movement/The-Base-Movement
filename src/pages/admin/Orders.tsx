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
  Download,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import { BrandLine } from '@/components/ui/BrandLine'

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: typeof Package }> = {
  Pending:    { label: 'Pending',    color: 'text-[var(--brand-gold)]',      bg: 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/20',       icon: Clock },
  Processing: { label: 'Processing', color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20',          icon: Package },
  Dispatched: { label: 'Dispatched', color: 'text-stone-500',  bg: 'bg-stone-500/10 border-stone-500/20',      icon: Truck },
  Delivered:  { label: 'Delivered',  color: 'text-[var(--brand-green)]',     bg: 'bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20',     icon: CheckCircle2 },
  Cancelled:  { label: 'Cancelled',  color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
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
      loadData(true) // Refresh stats
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
      loadData(true) // Refresh stats
    } else {
      toast.error('Failed to cancel order.')
    }
    setUpdatingId(null)
  }

  const filtered = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    
    const q = search.toLowerCase()
    const matchesSearch = !q || 
      o.full_name.toLowerCase().includes(q) || 
      o.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

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
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Package className="w-10 h-10 text-on-surface" />
            Order Management
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Live merchandise dispatch and fulfillment intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="rounded-sm border-border/40 text-on-surface/80 text-micro px-8 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm h-12 active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" /> Export Manifest
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => loadData(true)}
            className="rounded-sm text-micro px-10 h-12 font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Synchronize
          </Button>
        </div>
      </div>

      {/* Stats - Balanced Grid */}
      <div className="grid-stats mb-12" style={{ '--grid-min-width': '220px' } as React.CSSProperties}>
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-sm border-border/40 animate-pulse bg-white shadow-sm">
            <CardContent className="p-8 h-32" />
          </Card>
        )) : statCards.map(s => (
          <Card key={s.label} className="rounded-sm border-border/40 shadow-sm bg-white group hover:shadow-md transition-all duration-300">
            <CardContent className="p-8">
              <p className="text-micro font-bold text-muted-foreground/40 mb-2 tracking-tight">{s.label}</p>
              <p className={cn('text-4xl font-bold font-meta tracking-tighter mb-1', s.color)}>{s.value}</p>
              <p className="text-micro text-muted-foreground/40 font-bold tracking-tight">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-columns items-start" style={{ '--column-gap': '2rem' } as React.CSSProperties}>
        {/* Orders Table */}
        <div className={cn("min-w-0", selectedOrder ? 'flex-[2]' : 'flex-1')}>
          <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between gap-4 bg-muted/5">
              <CardTitle className="text-micro font-bold text-muted-foreground/40 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-green" /> Order Feed
              </CardTitle>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 w-full rounded-sm placeholder:text-muted-foreground/20"
                  />
                </div>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                      className="pl-9 pr-8 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 appearance-none rounded-sm cursor-pointer text-muted-foreground/60"
                    >
                      <option value="ALL">All Statuses</option>
                      {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-brand-green/20 mx-auto mb-4" />
                  <p className="text-micro font-bold normal-case tracking-tight text-slate-300">Synchronizing order flow...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-20 text-center">
                  <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-micro font-bold normal-case tracking-tight text-slate-400">No orders found</p>
                  <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">The merchandise feed is currently idle. Activity will appear as members complete movement-wide purchases.</p>
                </div>
              ) : (
                <>
                {/* Desktop Table */}
                <table className="w-full text-xs hidden md:table">
                  <thead>
                    <tr className="border-b border-border/10 bg-muted/5">
                      {['Order ID', 'Member', 'Region', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-micro font-bold text-muted-foreground/40">{h}</th>
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
                            'border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group',
                            selectedOrder?.id === order.id && 'bg-slate-50/50 border-l-2 border-l-brand-green'
                          )}
                          onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                        >
                          <td className="px-6 py-5 font-mono text-tiny text-slate-400">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-charcoal-dark text-sm">{order.full_name}</p>
                            <p className="text-micro font-medium text-slate-400">{order.email}</p>
                          </td>
                          <td className="px-6 py-5 text-tiny font-bold text-slate-500">
                            {order.region_or_state || '-'}
                          </td>
                          <td className="px-6 py-5 font-bold text-charcoal-dark text-sm">
                            GHS {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-micro font-bold text-slate-400 normal-case tracking-tight">
                            {order.payment_method === 'momo' ? 'MoMo' : 'Card'}
                          </td>
                          <td className="px-6 py-5">
                            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 text-micro font-bold border rounded-full', cfg.bg, cfg.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-micro font-bold text-slate-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                              {nextStatus && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleStatusAdvance(order)}
                                  disabled={updatingId === order.id}
                                  className="h-9 px-6 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20"
                                >
                                  {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-none text-slate-300 hover:text-brand-green transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
                            <p className="text-micro font-mono font-bold text-muted-foreground/60 tracking-tight normal-case">#{order.id.slice(0, 8)}</p>
                            <h4 className="text-sm font-bold text-on-surface">{order.full_name}</h4>
                            <p className="text-micro font-bold text-muted-foreground/60">{order.region_or_state || 'Unknown Region'}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-micro font-bold normal-case border rounded-full', cfg.bg, cfg.color)}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-border/40 rounded-sm shadow-sm">
                            <p className="text-micro font-bold text-muted-foreground/60 normal-case tracking-tight mb-1">Value</p>
                            <p className="text-sm font-bold text-on-surface">GHS {Number(order.total_amount).toFixed(2)}</p>
                          </div>
                          <div className="p-4 bg-white border border-border/40 rounded-sm shadow-sm">
                            <p className="text-micro font-bold text-muted-foreground/60 normal-case tracking-tight mb-1">Payment</p>
                            <p className="text-sm font-bold text-on-surface capitalize">{order.payment_method}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-sm border-border/40 text-on-surface/80 text-micro font-bold capitalize tracking-tight shadow-sm hover:bg-stone-50 transition-all active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" /> Details
                          </Button>
                          {nextStatus && (
                            <Button
                              variant="primary"
                              className="flex-1 h-12 rounded-sm text-micro font-bold capitalize tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                              disabled={updatingId === order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusAdvance(order);
                              }}
                            >
                              {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                            </Button>
                          )}                        </div>
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
            <Card className="rounded-sm border-border/40 shadow-xl flex-1 h-fit sticky top-6 bg-white overflow-hidden animate-in slide-in-from-right-4 duration-500">
              <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between bg-muted/5">
                <CardTitle className="text-micro font-bold text-muted-foreground/40">
                  Order Manifest
                </CardTitle>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-border/40 text-muted-foreground/40 hover:text-brand-green transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="p-8 flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
                {/* ID & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-micro font-bold text-muted-foreground/40 mb-1">Manifest ID</p>
                    <p className="font-mono text-xs font-bold text-on-surface">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 text-micro font-bold border rounded-full', cfg.bg, cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Patriot */}
                <div className="flow pt-6 border-t border-border/10" style={{ '--flow-space': '1rem' } as React.CSSProperties}>
                  <p className="text-micro font-bold text-muted-foreground/40">Recipient Details</p>
                  <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                    <p className="font-bold text-base text-on-surface">{selectedOrder.full_name}</p>
                    <p className="text-xs font-medium text-muted-foreground/60">{selectedOrder.email}</p>
                    <p className="text-xs font-medium text-muted-foreground/60">{selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="flow pt-6 border-t border-border/10" style={{ '--flow-space': '1rem' } as React.CSSProperties}>
                  <p className="text-micro font-bold text-muted-foreground/40">Logistics Destination</p>
                  <div className="flow text-xs font-medium text-muted-foreground/60 leading-relaxed" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                    <p>{selectedOrder.shipping_address}</p>
                    <p>{selectedOrder.city}, {selectedOrder.region_or_state}</p>
                    <p className="font-bold text-on-surface pt-1">{selectedOrder.country}</p>
                  </div>
                </div>
                
                {/* Manifest Items */}
                <div className="flow pt-6 border-t border-slate-50" style={{ '--flow-space': '1rem' } as React.CSSProperties}>
                  <div className="flex items-center justify-between">
                    <p className="text-micro font-bold normal-case tracking-tight text-slate-400">Manifest items</p>
                    <span className="text-micro font-bold text-slate-400">{selectedOrder.items.length} Units</span>
                  </div>
                  <div className="flow" style={{ '--flow-space': '0.75rem' } as React.CSSProperties}>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 flex items-center justify-between group">
                        <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                          <p className="text-xs font-bold text-charcoal-dark group-hover:text-brand-green transition-colors">
                            {item.product_name || 'Legacy Movement Asset'}
                          </p>
                          <p className="text-micro font-medium text-slate-400">Unit Price: GHS {Number(item.price_at_purchase).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-charcoal-dark">x{item.quantity}</p>
                          <p className="text-micro font-bold text-slate-400 normal-case tracking-tight">
                            GHS {(item.quantity * item.price_at_purchase).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="flow pt-6 border-t border-border/10" style={{ '--flow-space': '0.75rem' } as React.CSSProperties}>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground/60">
                    <span>Subtotal</span>
                    <span className="font-bold text-on-surface">GHS {Number(selectedOrder.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground/60">
                    <span>Shipping Logistics</span>
                    <span className="font-bold text-on-surface">GHS {Number(selectedOrder.shipping_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-border/10">
                    <span className="text-micro font-bold text-on-surface">Total Manifest Value</span>
                    <span className="text-lg font-bold text-brand-green">GHS {Number(selectedOrder.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 flow" style={{ '--flow-space': '0.75rem' } as React.CSSProperties}>
                  {NEXT_STATUS[selectedOrder.status] && (
                    <Button
                      variant="primary"
                      className="w-full h-14 text-tiny font-bold tracking-tight rounded-sm shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                      onClick={() => handleStatusAdvance(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      {updatingId === selectedOrder.id ? 'Synchronizing...' : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
                    </Button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <Button
                      variant="outline"
                      className="w-full h-14 text-micro font-bold tracking-tight text-brand-red border-border/40 hover:bg-brand-red/10 rounded-sm transition-all active:scale-95"
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
