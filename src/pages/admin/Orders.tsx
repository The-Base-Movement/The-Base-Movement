import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import { OrderListCard } from '@/components/admin/OrderListCard'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; color: string; bg: string; icon: string; kpiClass: string }
> = {
  Pending: {
    label: 'Pending',
    color: 'text-[var(--brand-gold)]',
    bg: 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/20',
    icon: 'schedule',
    kpiClass: 'g',
  },
  Processing: {
    label: 'Processing',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'inventory_2',
    kpiClass: 'k',
  },
  Dispatched: {
    label: 'Dispatched',
    color: 'text-stone-500',
    bg: 'bg-stone-500/10 border-stone-500/20',
    icon: 'local_shipping',
    kpiClass: 'k',
  },
  Delivered: {
    label: 'Delivered',
    color: 'text-[var(--brand-green)]',
    bg: 'bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20',
    icon: 'check_circle',
    kpiClass: 'gr',
  },
  Cancelled: {
    label: 'Cancelled',
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: 'cancel',
    kpiClass: 'r',
  },
}

const NEXT_STATUS: Partial<Record<Order['status'], Order['status']>> = {
  Pending: 'Processing',
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
        adminService.getOrderStats(),
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

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusAdvance = async (order: Order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    const success = await adminService.updateOrderStatus(order.id, next)
    if (success) {
      toast.success(`Order #${order.id.slice(0, 8)} → ${next}`)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)))
      if (selectedOrder?.id === order.id)
        setSelectedOrder((prev) => (prev ? { ...prev, status: next } : null))
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
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'Cancelled' } : o)))
      if (selectedOrder?.id === order.id)
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'Cancelled' } : null))
      loadData(true) // Refresh stats
    } else {
      toast.error('Failed to cancel order.')
    }
    setUpdatingId(null)
  }

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter

        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          o.full_name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)

        return matchesStatus && matchesSearch
      }),
    [orders, statusFilter, search]
  )

  const handleExport = () => {
    try {
      const headers = ['Order ID', 'Customer', 'Email', 'Region', 'Amount', 'Status', 'Date']
      const csvData = filtered.map((o) => [
        o.id,
        `"${o.full_name}"`,
        o.email,
        o.region_or_state || 'N/A',
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleDateString(),
      ])
      const csvContent = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n')
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

  const statCards = useMemo(
    () =>
      stats
        ? [
            {
              label: 'Cancelled',
              value: stats.cancelledOrders,
              variant: 'red' as const,
              sub: 'Terminated manifest flow',
            },
            {
              label: 'Revenue Today',
              value: `₵${stats.revenueToday.toFixed(2)}`,
              variant: 'gold' as const,
              sub: 'Tactical daily inflow',
            },
            {
              label: 'Total Orders',
              value: stats.totalOrders,
              variant: 'black' as const,
              sub: `₵${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} total`,
            },
            {
              label: 'Delivered',
              value: stats.deliveredOrders,
              variant: 'green' as const,
              sub: 'Successful fulfillment completion',
            },
          ]
        : [],
    [stats]
  )

  return (
    <div className="main">
      {/* Page Header - Industrial Standard */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
              Admin
            </Link>
            {' · '}
            Store Management
            {' · '}
            Orders
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
            >
              inventory_2
            </span>
            Orders Manifest
          </h2>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              download
            </span>
            Export CSV
          </button>
          <button className="btn btn-dest btn-sm" onClick={() => loadData(true)}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, animation: refreshing ? 'spin 2s linear infinite' : 'none' }}
            >
              sync
            </span>
            Synchronize
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpis">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card black animate-pulse h-48 bg-white" />
            ))
          : statCards.map((s) => (
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
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  aria-label="Search manifest"
                  name="search"
                  id="input-3a7bb6"
                  type="text"
                  placeholder="Search manifest..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    paddingLeft: 36,
                    paddingRight: 16,
                    height: 36,
                    width: 256,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    outline: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    color: 'hsl(var(--on-surface))',
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <select
                  name="statusFilter"
                  id="select-736283"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
                  style={{
                    height: 36,
                    padding: '0 32px 0 12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    outline: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: 'hsl(var(--on-surface-muted))',
                    appearance: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  {(Object.keys(STATUS_CONFIG) as Order['status'][]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Filter & Search Bar — Step 5 Compliance */}
          <div
            className="mobile-only"
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'hsl(var(--container-low))',
            }}
          >
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 15,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                search
              </span>
              <input
                aria-label="Search manifest"
                name="search"
                id="input-b2d7a3"
                type="text"
                placeholder="Search manifest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: 34,
                  paddingLeft: 30,
                  boxSizing: 'border-box',
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                className={`pill ${statusFilter === 'ALL' ? 'pill-ok' : 'pill-mute'}`}
                style={{ flexShrink: 0 }}
                onClick={() => setStatusFilter('ALL')}
              >
                All Statuses
              </button>
              {(Object.keys(STATUS_CONFIG) as Order['status'][]).map((s) => (
                <button
                  key={s}
                  className={`pill ${statusFilter === s ? 'pill-ok' : 'pill-mute'}`}
                  style={{ flexShrink: 0 }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <span
                  className="material-symbols-outlined animate-spin"
                  style={{ fontSize: 32, color: 'hsl(var(--primary) / 0.2)' }}
                >
                  sync
                </span>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    marginTop: 16,
                    color: 'hsl(var(--border))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Synchronizing order flow...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 48, color: 'hsl(var(--border))' }}
                >
                  inventory_2
                </span>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    marginTop: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  No orders found
                </p>
              </div>
            ) : (
              <>
                <div className="desktop-only">
                  <table className="table">
                    <thead>
                      <tr>
                        {['Order ID', 'Patriot', 'Hub', 'Amount', 'Status', 'Date', 'Actions'].map(
                          (h) => (
                            <th key={h}>{h}</th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((order) => {
                        const cfg = STATUS_CONFIG[order.status]
                        const nextStatus = NEXT_STATUS[order.status]
                        return (
                          <tr
                            key={order.id}
                            style={{
                              cursor: 'pointer',
                              background:
                                selectedOrder?.id === order.id
                                  ? 'hsl(var(--container-low))'
                                  : undefined,
                            }}
                            onClick={() =>
                              setSelectedOrder((prev) => (prev?.id === order.id ? null : order))
                            }
                          >
                            <td className="reg">#{order.id.slice(0, 8).toUpperCase()}</td>
                            <td className="who">
                              <div>
                                <b>{order.full_name}</b>
                                <span>{order.email}</span>
                              </div>
                            </td>
                            <td>
                              <b
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {order.region_or_state || '-'}
                              </b>
                            </td>
                            <td>
                              <b style={{ fontWeight: 800, color: 'hsl(var(--on-surface))' }}>
                                ₵
                                {Number(order.total_amount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </b>
                            </td>
                            <td>
                              <span
                                className={`pill ${order.status === 'Delivered' ? 'pill-ok' : order.status === 'Cancelled' ? 'pill-err' : 'pill-warn'}`}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 13 }}
                                >
                                  {cfg.icon}
                                </span>
                                {cfg.label}
                              </span>
                            </td>
                            <td
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                                {nextStatus && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleStatusAdvance(order)}
                                    disabled={updatingId === order.id}
                                  >
                                    {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                                  </button>
                                )}
                                <button
                                  className="ico"
                                  onClick={() =>
                                    setSelectedOrder((prev) =>
                                      prev?.id === order.id ? null : order
                                    )
                                  }
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 16 }}
                                  >
                                    visibility
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-only">
                  {filtered.map((order) => (
                    <OrderListCard
                      key={order.id}
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      onClick={() =>
                        setSelectedOrder((prev) => (prev?.id === order.id ? null : order))
                      }
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
        {selectedOrder &&
          (() => {
            const cfg = STATUS_CONFIG[selectedOrder.status]
            return (
              <div
                className="panel"
                style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}
              >
                <div
                  className="ph"
                  style={{
                    background: 'linear-gradient(135deg,#0f1310,#1f2620)',
                    borderTop: '3px solid hsl(var(--primary))',
                    borderRadius: '6px 6px 0 0',
                    padding: '16px 18px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                      >
                        inventory_2
                      </span>
                      Order Manifest
                    </h3>
                    <div className="meta" style={{ color: 'rgba(255,255,255,.45)', fontSize: 10 }}>
                      Logistics ID: #{selectedOrder.id.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="ico"
                    style={{
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,.1)',
                      color: '#fff',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      close
                    </span>
                  </button>
                </div>

                <div
                  style={{
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                  }}
                >
                  {/* ID & Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <span
                      className={`pill ${selectedOrder.status === 'Delivered' ? 'pill-ok' : selectedOrder.status === 'Cancelled' ? 'pill-err' : 'pill-warn'}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        {cfg.icon}
                      </span>
                      {cfg.label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 4,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        Manifest Date
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Patriot */}
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '1px solid hsl(var(--border))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <label className="field-label">Recipient details</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {selectedOrder.full_name}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                        }}
                      >
                        {selectedOrder.email}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                        }}
                      >
                        {selectedOrder.phone}
                      </p>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '1px solid hsl(var(--border))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <label className="field-label">Logistics destination</label>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                      }}
                    >
                      <p style={{ margin: 0 }}>{selectedOrder.shipping_address}</p>
                      <p style={{ margin: 0 }}>
                        {selectedOrder.city}, {selectedOrder.region_or_state}
                      </p>
                      <p
                        style={{
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface))',
                          margin: '4px 0 0',
                        }}
                      >
                        {selectedOrder.country}
                      </p>
                    </div>
                  </div>

                  {/* Manifest Items */}
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '1px solid hsl(var(--border))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <label className="field-label" style={{ margin: 0 }}>
                        Manifest items
                      </label>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {selectedOrder.items.length} Units
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 12,
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 4,
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: 'hsl(var(--on-surface))',
                                margin: 0,
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {item.product_name || 'Movement Asset'}
                            </p>
                            <p
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: 'hsl(var(--on-surface-muted))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                margin: 0,
                              }}
                            >
                              ₵{Number(item.price_at_purchase).toFixed(2)} unit
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: 'hsl(var(--on-surface))',
                                margin: 0,
                              }}
                            >
                              x{item.quantity}
                            </p>
                            <p
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: 'hsl(var(--primary))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                margin: 0,
                              }}
                            >
                              ₵{(item.quantity * item.price_at_purchase).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '1px solid hsl(var(--border))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {[
                      {
                        label: 'Subtotal',
                        value: Number(selectedOrder.subtotal).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        }),
                      },
                      {
                        label: 'Logistics Fee',
                        value: Number(selectedOrder.shipping_fee).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        }),
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
                        <span style={{ color: 'hsl(var(--on-surface))' }}>₵{value}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTop: '1px solid hsl(var(--border))',
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        Total Value
                      </span>
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        ₵
                        {Number(selectedOrder.total_amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {NEXT_STATUS[selectedOrder.status] && (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', height: 44 }}
                        onClick={() => handleStatusAdvance(selectedOrder)}
                        disabled={updatingId === selectedOrder.id}
                      >
                        {updatingId === selectedOrder.id
                          ? 'Synchronizing...'
                          : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
                      </button>
                    )}
                    {selectedOrder.status !== 'Cancelled' &&
                      selectedOrder.status !== 'Delivered' && (
                        <button
                          className="btn btn-dest"
                          style={{ width: '100%', height: 44 }}
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
