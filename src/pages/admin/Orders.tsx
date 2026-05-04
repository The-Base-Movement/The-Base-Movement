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
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'

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
    const q = search.toLowerCase()
    const matchesSearch = !q || 
      o.full_name.toLowerCase().includes(q) || 
      o.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const statCards = stats ? [
    { label: 'Total Orders',   value: stats.totalOrders,      color: 'text-stone-900', sub: `GHS ${stats.totalRevenue.toFixed(2)} total revenue` },
    { label: 'Pending',        value: stats.pendingOrders,    color: 'text-amber-600',   sub: 'Awaiting processing' },
    { label: 'In Transit',     value: stats.dispatchedOrders, color: 'text-violet-600',  sub: 'Dispatched to customers' },
    { label: 'Delivered',      value: stats.deliveredOrders,  color: 'text-emerald-600', sub: `GHS ${stats.revenueToday.toFixed(2)} today` },
  ] : []

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-meta uppercase tracking-tight">Order Command Center</h1>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">
            Live merchandise dispatch & fulfillment intelligence
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadData(true)}
          className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 mr-2', refreshing && 'animate-spin')} />
          Sync
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-none border-stone-200 animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        )) : statCards.map(s => (
          <Card key={s.label} className="rounded-none border-stone-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">{s.label}</p>
              <p className={cn('text-4xl font-black font-meta tracking-tighter', s.color)}>{s.value}</p>
              <p className="text-[9px] text-stone-400 uppercase tracking-wider mt-2">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={cn('grid gap-8', selectedOrder ? 'xl:grid-cols-3' : 'xl:grid-cols-1')}>
        {/* Orders Table */}
        <div className={selectedOrder ? 'xl:col-span-2' : ''}>
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Package className="w-4 h-4" /> Live Order Feed
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 w-48 uppercase tracking-wider"
                  />
                </div>
                {/* Status filter */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                    className="pl-9 pr-4 h-8 text-[10px] bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 appearance-none uppercase tracking-wider"
                  >
                    <option value="ALL">All Statuses</option>
                    {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-stone-400 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Loading orders...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Package className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">No orders found</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      {['Order ID', 'Customer', 'Region', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-stone-400">{h}</th>
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
                            <p className="text-[9px] text-stone-400 uppercase">{order.email}</p>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-stone-600 uppercase tracking-wider">
                            {order.region_or_state || '—'}
                          </td>
                          <td className="px-5 py-4 font-black text-stone-900">
                            GHS {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 uppercase text-[10px] tracking-wider text-stone-500">
                            {order.payment_method === 'momo' ? 'MoMo' : 'Card'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border', cfg.bg, cfg.color)}>
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
                                  className="h-7 px-3 text-[9px] font-black uppercase tracking-widest bg-stone-900 text-white hover:bg-stone-700 rounded-none"
                                >
                                  {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                                </Button>
                              )}
                              {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancel(order)}
                                  disabled={updatingId === order.id}
                                  className="h-7 px-2 text-[9px] font-black uppercase text-red-500 hover:text-red-700 hover:bg-red-50 rounded-none"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (() => {
          const cfg = STATUS_CONFIG[selectedOrder.status]
          const StatusIcon = cfg.icon
          return (
            <Card className="rounded-none border-stone-200 shadow-sm xl:col-span-1 h-fit sticky top-6">
              <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-stone-400">
                  Order Detail
                </CardTitle>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-stone-400 hover:text-stone-900 text-lg leading-none font-black"
                >×</button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* ID & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Order ID</p>
                    <p className="font-mono text-xs font-bold text-stone-700">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border', cfg.bg, cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Customer */}
                <div className="space-y-3 pt-4 border-t border-stone-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Customer</p>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-stone-900">{selectedOrder.full_name}</p>
                    <p className="text-[10px] text-stone-500">{selectedOrder.email}</p>
                    <p className="text-[10px] text-stone-500">{selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-3 pt-4 border-t border-stone-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Shipping Address</p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-600">{selectedOrder.shipping_address}</p>
                    <p className="text-[10px] text-stone-600">{selectedOrder.city}, {selectedOrder.region_or_state}</p>
                    <p className="text-[10px] font-bold text-stone-900">{selectedOrder.country}</p>
                  </div>
                </div>

                {/* Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-stone-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Line Items</p>
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
                  <div className="flex justify-between text-[10px] text-stone-500 uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span>GHS {Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500 uppercase tracking-wider">
                    <span>Shipping</span>
                    <span>GHS {Number(selectedOrder.shipping_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-200">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-900">Total</span>
                    <span className="text-sm font-black text-[var(--brand-black)]">GHS {Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  {NEXT_STATUS[selectedOrder.status] && (
                    <Button
                      className="w-full h-10 bg-stone-900 text-white hover:bg-stone-700 text-[10px] font-black uppercase tracking-widest rounded-none"
                      onClick={() => handleStatusAdvance(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      {updatingId === selectedOrder.id ? 'Updating...' : `Advance → ${NEXT_STATUS[selectedOrder.status]}`}
                    </Button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <Button
                      variant="outline"
                      className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest rounded-none"
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      Cancel Order
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
