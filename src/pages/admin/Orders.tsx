import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'

// Modular imports
import { NEXT_STATUS, STATUS_CONFIG } from './orders/utils'
import { OrdersKPIs } from './orders/OrdersKPIs'
import { OrdersFilters } from './orders/OrdersFilters'
import { OrdersTable } from './orders/OrdersTable'
import { OrderDetailPanel } from './orders/OrderDetailPanel'

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'ALL'>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)

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

  const handleCancel = (order: Order) => {
    setCancelModal(order)
  }

  const handleConfirmCancel = async () => {
    if (!cancelModal) return
    setCancelling(true)
    const success = await adminService.updateOrderStatus(cancelModal.id, 'Cancelled')
    if (success) {
      toast.success('Order cancelled.')
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelModal.id ? { ...o, status: 'Cancelled' } : o))
      )
      if (selectedOrder?.id === cancelModal.id)
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'Cancelled' } : null))
      loadData(true)
      setCancelModal(null)
    } else {
      toast.error('Failed to cancel order.')
    }
    setCancelling(false)
  }

  const filtered = useMemo(() => {
    const list = orders.filter((o) => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter

      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        o.full_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })

    return list.sort((a, b) => {
      const nameA = a.full_name || ''
      const nameB = b.full_name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [orders, statusFilter, search, sortOrder])

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

  return (
    <div className="main">
      <AdminPageHeader
        title="Orders Manifest"
        icon="inventory_2"
        description="Manage official merchandise fulfillment, supply chain logistics, and movement resource distribution."
        actions={
          <>
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
          </>
        }
      />

      {/* KPI Stats Row */}
      <OrdersKPIs loading={loading} stats={stats} />

      <div className="twocol">
        {/* Orders Feed */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Fulfillment feed</h3>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 4,
                }}
              >
                Process and track merchandise orders and supply requests.
              </p>
              <div className="meta">Real-time merchandise dispatch telemetry</div>
            </div>
            <OrdersFilters
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </div>

          {/* Mobile search + filter pills */}
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
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                aria-label="Search manifest"
                name="search"
                id="orders-search-mobile"
                type="text"
                placeholder="Search manifest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: 34,
                  paddingLeft: 30,
                  paddingRight: 12,
                  boxSizing: 'border-box',
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div
                style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, flex: 1 }}
              >
                <button
                  className={`pill ${statusFilter === 'ALL' ? 'pill-ok' : 'pill-mute'}`}
                  style={{ flexShrink: 0 }}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All Statuses
                </button>
                {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((s) => (
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
              <SortToggle value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          <OrdersTable
            loading={loading}
            filtered={filtered}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            updatingId={updatingId}
            handleStatusAdvance={handleStatusAdvance}
          />
        </div>

        {/* Order Detail Panel - Industrial Standard */}
        {selectedOrder && (
          <OrderDetailPanel
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            updatingId={updatingId}
            handleStatusAdvance={handleStatusAdvance}
            handleCancel={handleCancel}
          />
        )}
      </div>

      {/* ── Cancel Order Modal ── */}
      {cancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={() => !cancelling && setCancelModal(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 440,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: 'hsl(var(--destructive))',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fff' }}>
                cancel
              </span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    color: '#fff',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Cancel Order
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  #{cancelModal.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              {/* Order summary */}
              <div
                style={{
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span
                    style={{
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Customer
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {cancelModal.full_name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span
                    style={{
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Items
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {cancelModal.items.length} item
                    {cancelModal.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    paddingTop: 6,
                    borderTop: '1px solid hsl(var(--border))',
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Order total
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    GH₵{' '}
                    {cancelModal.total_amount.toLocaleString('en-GH', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: 'hsl(var(--destructive))',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  warning
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  This action is <strong>permanent and cannot be undone.</strong> If this order was
                  already dispatched, stock will be automatically restocked.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, height: 42 }}
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                >
                  Go back
                </button>
                <button
                  className="btn btn-dest"
                  style={{ flex: 1, height: 42 }}
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
