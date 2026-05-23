import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import type { Order, OrderStats } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import { NEXT_STATUS } from './orders/utils'
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
            />
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
    </div>
  )
}
