import { OrderListCard } from '@/components/admin/OrderListCard'
import { STATUS_CONFIG, NEXT_STATUS } from './utils'
import type { Order } from '@/services/adminService'
import { Skeleton } from '@/components/states'

interface OrdersTableProps {
  loading: boolean
  filtered: Order[]
  selectedOrder: Order | null
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>
  updatingId: string | null
  handleStatusAdvance: (order: Order) => Promise<void>
}

export function OrdersTable({
  loading,
  filtered,
  selectedOrder,
  setSelectedOrder,
  updatingId,
  handleStatusAdvance,
}: OrdersTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      {loading ? (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <Skeleton variant="avatar-sm" />
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Skeleton variant="text-sm" width="50%" />
                <Skeleton variant="text-sm" width="30%" />
              </div>
              <Skeleton variant="chip" width={70} style={{ flex: '0 0 auto' }} />
              <Skeleton variant="text-sm" width={60} style={{ flex: '0 0 auto' }} />
            </div>
          ))}
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
                          selectedOrder?.id === order.id ? 'hsl(var(--container-low))' : undefined,
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
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {order.region_or_state || '-'}
                        </b>
                      </td>
                      <td>
                        <b
                          style={{
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
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
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            {cfg.icon}
                          </span>
                          {cfg.label}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                              setSelectedOrder((prev) => (prev?.id === order.id ? null : order))
                            }
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
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
                onClick={() => setSelectedOrder((prev) => (prev?.id === order.id ? null : order))}
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
  )
}
