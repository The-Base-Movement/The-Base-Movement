import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { OrderListCard } from '@/components/admin/OrderListCard'
import { TacticalKPI } from '@/components/admin/TacticalKPI'


const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: string; kpiClass: string }> = {
  Pending:    { label: 'Pending',    color: 'text-[var(--brand-gold)]',      bg: 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/20',       icon: 'schedule', kpiClass: 'g' },
  Processing: { label: 'Processing', color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20',          icon: 'inventory_2', kpiClass: 'k' },
  Dispatched: { label: 'Dispatched', color: 'text-stone-500',  bg: 'bg-stone-500/10 border-stone-500/20',      icon: 'local_shipping', kpiClass: 'k' },
  Delivered:  { label: 'Delivered',  color: 'text-[var(--brand-green)]',     bg: 'bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20',     icon: 'check_circle', kpiClass: 'gr' },
  Cancelled:  { label: 'Cancelled',  color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: 'cancel', kpiClass: 'r' },
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

  const filtered = useMemo(() => orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    
    const q = search.toLowerCase()
    const matchesSearch = !q || 
      o.full_name.toLowerCase().includes(q) || 
      o.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  }), [orders, statusFilter, search])

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

  const statCards = useMemo(() => stats ? [
    { 
      label: 'Cancelled',      
      value: stats.cancelledOrders,  
      variant: 'red' as const, 
      sub: 'Terminated manifest flow' 
    },
    { 
      label: 'Revenue Today',   
      value: `₵${stats.revenueToday.toFixed(2)}`, 
      variant: 'gold' as const, 
      sub: 'Tactical daily inflow' 
    },
    { 
      label: 'Total Orders',     
      value: stats.totalOrders, 
      variant: 'black' as const,  
      sub: `₵${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} total` 
    },
    { 
      label: 'Delivered',      
      value: stats.deliveredOrders,  
      variant: 'green' as const, 
      sub: 'Successful fulfillment completion' 
    },
  ] : [], [stats])

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Page Header - Industrial Standard */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            Store Management
            {' · '}
            Orders
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>inventory_2</span>
            Orders Manifest
          </h2>
          <div className="bl"><div /><div /><div /></div>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
            Export CSV
          </button>
          <button className="btn btn-dest btn-sm" onClick={() => loadData(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, animation: refreshing ? 'spin 2s linear infinite' : 'none' }}>sync</span>
            Synchronize
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[18px]">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card black animate-pulse h-48 bg-white" />
        )) : statCards.map(s => (
          <TacticalKPI 
            key={s.label}
            label={s.label}
            value={s.value}
            variant={s.variant}
            delta={s.sub}
          />
        ))}
      </div>

      <div className="twocol">
        {/* Orders Feed */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Fulfillment feed</h3>
              <div className="meta">Real-time merchandise dispatch telemetry</div>
            </div>
            <div className="desktop-only flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                <input aria-label="Search manifest" name="search" id="input-3a7bb6"
                  type="text"
                  placeholder="Search manifest..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 rounded-sm placeholder:text-muted-foreground/20 w-64"
                />
              </div>

              <select name="statusFilter" id="select-736283"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                className="pl-3 pr-8 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 appearance-none rounded-sm cursor-pointer text-muted-foreground/60"
              >
                <option value="ALL">All Statuses</option>
                {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filter & Search Bar — Step 5 Compliance */}
          <div className="mobile-only" style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 8, background: 'hsl(var(--container-low))' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}>search</span>
              <input aria-label="Search manifest" name="search" id="input-b2d7a3" 
                type="text"
                placeholder="Search manifest..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', height: 34, paddingLeft: 30, boxSizing: 'border-box', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
              <button 
                className={cn("pill flex-shrink-0", statusFilter === 'ALL' ? "pill-ok" : "pill-mute")}
                onClick={() => setStatusFilter('ALL')}
              >
                All Statuses
              </button>
              {(Object.keys(STATUS_CONFIG) as Order['status'][]).map(s => (
                <button 
                  key={s}
                  className={cn("pill flex-shrink-0", statusFilter === s ? "pill-ok" : "pill-mute")}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center">
                  <span className="material-symbols-outlined animate-spin text-brand-green/20" style={{ fontSize: 32 }}>sync</span>
                  <p className="text-micro font-bold mt-4 text-slate-300">Synchronizing order flow...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-20 text-center">
                  <span className="material-symbols-outlined text-slate-100" style={{ fontSize: 48 }}>inventory_2</span>
                  <p className="text-micro font-bold mt-4 text-slate-400">No orders found</p>
                </div>
              ) : (
                <>
                <div className="desktop-only">
                <table className="table">
                  <thead>
                    <tr>
                      {['Order ID', 'Patriot', 'Hub', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => {
                      const cfg = STATUS_CONFIG[order.status]
                      const nextStatus = NEXT_STATUS[order.status]
                      return (
                        <tr 
                          key={order.id} 
                          className={cn(
                            'cursor-pointer',
                            selectedOrder?.id === order.id && 'bg-muted/5'
                          )}
                          onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                        >
                          <td className="reg">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="who">
                            <div>
                              <b>{order.full_name}</b>
                              <span>{order.email}</span>
                            </div>
                          </td>
                          <td>
                            <b className="text-tiny font-bold text-slate-500">
                              {order.region_or_state || '-'}
                            </b>
                          </td>
                          <td>
                            <b className="font-bold text-on-surface">
                              ₵{Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </b>
                          </td>
                          <td>
                            <span className={cn('pill', order.status === 'Delivered' ? 'pill-ok' : order.status === 'Cancelled' ? 'pill-err' : 'pill-warn')}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{cfg.icon}</span>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="text-micro font-bold text-slate-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="row-actions" onClick={e => e.stopPropagation()}>
                              {nextStatus && (
                                <button
                                  className="btn btn-primary btn-sm h-8"
                                  onClick={() => handleStatusAdvance(order)}
                                  disabled={updatingId === order.id}
                                >
                                  {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                                </button>
                              )}
                              <button
                                className="ico h-8 w-8"
                                onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>

                <div className="mobile-only divide-y divide-border/10">
                  {filtered.map(order => (
                    <OrderListCard 
                      key={order.id}
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                      onAdvance={() => handleStatusAdvance(order)}
                      updatingId={updatingId}
                      statusConfig={STATUS_CONFIG}
                      nextStatus={NEXT_STATUS[order.status]}
                    />
                  ))}
                </div>
                </>
              )}
            </div>
          </div>

        {/* Order Detail Panel - Industrial Standard */}
        {selectedOrder && (() => {
          const cfg = STATUS_CONFIG[selectedOrder.status]
          return (
            <div className="panel animate-in slide-in-from-right-4 duration-500 h-fit sticky top-6">
              <div className="ph" style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', borderTop: '3px solid hsl(var(--primary))', borderRadius: '6px 6px 0 0', padding: '16px 18px' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>inventory_2</span>
                    Order Manifest
                  </h3>
                  <div className="meta" style={{ color: 'rgba(255,255,255,.45)', fontSize: 10 }}>Logistics ID: #{selectedOrder.id.toUpperCase()}</div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="ico"
                  style={{ background: 'transparent', borderColor: 'rgba(255,255,255,.1)', color: '#fff' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>

              <div style={{ padding: '24px 20px' }} className="space-y-8">
                {/* ID & Status */}
                <div className="flex items-start justify-between gap-4">
                  <span className={cn('pill', selectedOrder.status === 'Delivered' ? 'pill-ok' : selectedOrder.status === 'Cancelled' ? 'pill-err' : 'pill-warn')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                  <div className="text-right">
                    <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-tight mb-1">Manifest Date</p>
                    <p className="text-tiny font-bold text-on-surface">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Patriot */}
                <div className="pt-6 border-t border-border/10 space-y-3">
                  <label className="field-label">Recipient details</label>
                  <div className="space-y-1">
                    <p className="font-bold text-base text-on-surface">{selectedOrder.full_name}</p>
                    <p className="text-xs font-medium text-muted-foreground/60">{selectedOrder.email}</p>
                    <p className="text-xs font-medium text-muted-foreground/60">{selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="pt-6 border-t border-border/10 space-y-3">
                  <label className="field-label">Logistics destination</label>
                  <div className="text-xs font-medium text-muted-foreground/60 leading-relaxed">
                    <p>{selectedOrder.shipping_address}</p>
                    <p>{selectedOrder.city}, {selectedOrder.region_or_state}</p>
                    <p className="font-bold text-on-surface pt-1">{selectedOrder.country}</p>
                  </div>
                </div>
                
                {/* Manifest Items */}
                <div className="pt-6 border-t border-border/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="field-label mb-0">Manifest items</label>
                    <span className="text-micro font-bold text-slate-400">{selectedOrder.items.length} Units</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted/5 border border-border/10 flex items-center justify-between group rounded-sm">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-on-surface">
                            {item.product_name || 'Movement Asset'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">₵{Number(item.price_at_purchase).toFixed(2)} unit</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-on-surface">x{item.quantity}</p>
                          <p className="text-[10px] font-bold text-brand-green uppercase tracking-tight">
                            ₵{(item.quantity * item.price_at_purchase).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-6 border-t border-border/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground/40">
                    <span>Subtotal</span>
                    <span className="text-on-surface">₵{Number(selectedOrder.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground/40">
                    <span>Logistics Fee</span>
                    <span className="text-on-surface">₵{Number(selectedOrder.shipping_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-border/10">
                    <span className="text-micro font-bold text-on-surface uppercase tracking-tight">Total Value</span>
                    <span className="text-lg font-bold text-brand-green">₵{Number(selectedOrder.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 space-y-3">
                  {NEXT_STATUS[selectedOrder.status] && (
                    <button
                      className="btn btn-primary w-full h-12 rounded-sm"
                      onClick={() => handleStatusAdvance(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      {updatingId === selectedOrder.id ? 'Synchronizing...' : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
                    </button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <button
                      className="btn btn-outline w-full h-12 rounded-sm text-destructive hover:border-destructive hover:text-destructive"
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      Terminate Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
